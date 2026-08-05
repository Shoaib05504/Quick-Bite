import groupOrderModel from '../models/groupOrderModel.js';
import userModel from '../models/userModel.js';

const buildExpiresAt = (durationStr = '30 Minutes') => {
  let minutes = 30; // default fallback
  const str = String(durationStr);
  if (str.includes('15')) minutes = 15;
  else if (str.includes('30')) minutes = 30;
  else if (str.includes('1')) minutes = 60;
  else if (str.includes('2')) minutes = 120;
  return new Date(Date.now() + minutes * 60 * 1000);
};

const generateGroupCode = async () => {
  let code = '';
  let exists = true;
  while (exists) {
    const suffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    code = `QB-${suffix}`;
    exists = await groupOrderModel.exists({ groupCode: code });
  }
  return code;
};

const calculateTotalAmount = (items) =>
  items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0);

const sanitizeCartItems = (items = []) =>
  (Array.isArray(items)
    ? items
        .map((item) => ({
          itemId: String(item.itemId || item._id || ''),
          name: String(item.name || item.title || ''),
          image: String(item.image || ''),
          quantity: Math.max(0, Number(item.quantity) || 0),
          addedBy: String(item.addedBy || item.name || 'Guest'),
          price: Number(item.price || 0),
          addedAt: item.addedAt || new Date(),
        }))
        .filter((item) => item.itemId && item.quantity > 0)
    : []);

const appendActivity = (group, message) => {
  group.activities.unshift({ message, createdAt: new Date() });
  if (group.activities.length > 50) {
    group.activities = group.activities.slice(0, 50);
  }
};

const markExpiredIfNeeded = async (group) => {
  if (!group) return group;
  if (group.isExpired || new Date() > new Date(group.expiresAt)) {
    if (!group.isExpired) {
      group.isExpired = true;
      group.status = 'expired';
      await group.save();
    }
  }
  return group;
};

const createGroupOrder = async (req, res) => {
  try {
    const rawCartItems = req.body.cartItems || [];
    const sanitizedCart = sanitizeCartItems(rawCartItems).map((item) => ({
      itemId: item.itemId,
      name: item.name,
      image: item.image,
      quantity: item.quantity,
      addedBy: item.addedBy || 'Host',
      price: item.price,
    }));

    const userId = req.body.userId || null;
    const user = userId ? await userModel.findById(userId) : null;
    const creatorName = user?.name || req.body.name || 'Host';

    const duration = req.body.expiry || '30 Minutes';
    const maxParticipants = Number(req.body.maxParticipants) || 5;
    const groupOrder = await groupOrderModel.create({
      groupCode: await generateGroupCode(),
      groupName: req.body.groupName || 'Friday Night Feast',
      note: req.body.note || 'No peanuts please! 🥜',
      maxParticipants,
      expiry: duration,
      members: [
        {
          userId,
          name: creatorName,
          isHost: true,
          isOnline: true,
          avatar: user?.avatar || '',
        },
      ],
      cartItems: sanitizedCart,
      createdBy: userId,
      expiresAt: buildExpiresAt(duration),
      totalAmount: 0,
      status: 'active',
      activities: [
        {
          message: `${creatorName} created the QuickBite Group Feast 🎉`,
          createdAt: new Date(),
        },
      ],
    });

    groupOrder.totalAmount = calculateTotalAmount(
      sanitizedCart.map((item) => ({
        ...item,
        price: Number(item.price || 0),
      }))
    );
    await groupOrder.save();

    res.json({ success: true, groupOrder });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: 'Error creating group order' });
  }
};

const getGroupOrder = async (req, res) => {
  try {
    const { groupCode } = req.params;
    const groupOrder = await groupOrderModel.findOne({ groupCode });
    if (!groupOrder) {
      return res.json({ success: false, message: 'Group order not found' });
    }
    await markExpiredIfNeeded(groupOrder);
    res.json({ success: true, groupOrder });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: 'Error fetching group order' });
  }
};

const joinGroupByName = async (groupCode, name, socketId = null, avatar = '') => {
  const groupOrder = await groupOrderModel.findOne({ groupCode });
  if (!groupOrder) {
    return { success: false, message: 'Group order not found' };
  }
  await markExpiredIfNeeded(groupOrder);
  if (groupOrder.isExpired) {
    return { success: false, message: 'Group order has expired', isExpired: true };
  }
  if (groupOrder.status === 'completed') {
    return { success: false, message: 'Group order has already been completed' };
  }

  const memberName = String(name || 'Guest').trim() || 'Guest';
  const existingMember = groupOrder.members.find((member) => member.name === memberName);

  if (!existingMember) {
    if (groupOrder.members.length >= groupOrder.maxParticipants) {
      return {
        success: false,
        message: `Group is full! Maximum ${groupOrder.maxParticipants} members allowed.`,
        isFull: true,
      };
    }
    groupOrder.members.push({
      name: memberName,
      isHost: groupOrder.members.length === 0,
      isOnline: true,
      socketId,
      avatar,
      joinedAt: new Date(),
    });
    appendActivity(groupOrder, `${memberName} joined the feast 👋`);
  } else {
    existingMember.isOnline = true;
    if (socketId) existingMember.socketId = socketId;
    if (avatar) existingMember.avatar = avatar;
  }

  await groupOrder.save();
  return { success: true, groupOrder, memberName };
};

const joinGroupOrder = async (req, res) => {
  try {
    const { groupCode, name } = req.body;
    const response = await joinGroupByName(groupCode, name);
    res.json(response);
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: 'Error joining group order' });
  }
};

const updateGroupCart = async (groupCode, action, itemId, quantity, addedBy, price = 0, name = '', image = '') => {
  const groupOrder = await groupOrderModel.findOne({ groupCode });
  if (!groupOrder) {
    return null;
  }
  await markExpiredIfNeeded(groupOrder);
  if (groupOrder.isExpired) {
    return groupOrder;
  }
  if (groupOrder.isLocked) {
    throw new Error('This group cart is locked by the host.');
  }

  const normalizedName = String(addedBy || 'Guest');
  const itemIndex = groupOrder.cartItems.findIndex((item) => item.itemId === itemId && item.addedBy === normalizedName);
  const currentItem = groupOrder.cartItems[itemIndex];
  const itemNameDisplay = name || itemId;

  if (action === 'add') {
    if (itemIndex === -1) {
      groupOrder.cartItems.push({ itemId, name: itemNameDisplay, image, quantity: 1, addedBy: normalizedName, price, addedAt: new Date() });
    } else {
      groupOrder.cartItems[itemIndex].quantity += 1;
    }
    appendActivity(groupOrder, `${normalizedName} added ${itemNameDisplay} to the cart 🍕`);
  } else if (action === 'remove') {
    if (currentItem) {
      currentItem.quantity -= 1;
      if (currentItem.quantity <= 0) {
        groupOrder.cartItems.splice(itemIndex, 1);
      }
      appendActivity(groupOrder, `${normalizedName} removed ${itemNameDisplay} from the cart 🗑️`);
    }
  } else if (action === 'set') {
    const qty = Math.max(0, Number(quantity) || 0);
    if (qty === 0) {
      if (itemIndex !== -1) {
        groupOrder.cartItems.splice(itemIndex, 1);
      }
    } else if (itemIndex === -1) {
      groupOrder.cartItems.push({ itemId, name: itemNameDisplay, image, quantity: qty, addedBy: normalizedName, price, addedAt: new Date() });
    } else {
      groupOrder.cartItems[itemIndex].quantity = qty;
    }
    appendActivity(groupOrder, `${normalizedName} updated ${itemNameDisplay} quantity to ${qty}`);
  }

  groupOrder.totalAmount = calculateTotalAmount(
    groupOrder.cartItems.map((item) => ({ ...item, price: Number(item.price || 0) }))
  );
  await groupOrder.save();
  return groupOrder;
};

const toggleLockGroupOrder = async (groupCode, isLocked) => {
  const groupOrder = await groupOrderModel.findOne({ groupCode });
  if (!groupOrder) return null;
  await markExpiredIfNeeded(groupOrder);
  if (groupOrder.isExpired) return groupOrder;

  groupOrder.isLocked = Boolean(isLocked);
  groupOrder.status = isLocked ? 'locked' : 'active';
  const statusMsg = isLocked ? 'locked the cart 🔒' : 'unlocked the cart 🔓';
  appendActivity(groupOrder, `Host ${statusMsg}`);
  await groupOrder.save();
  return groupOrder;
};

const removeMemberFromGroup = async (groupCode, memberName, requesterName) => {
  const groupOrder = await groupOrderModel.findOne({ groupCode });
  if (!groupOrder) return null;

  const requester = groupOrder.members.find((m) => m.name === requesterName);
  if (!requester || !requester.isHost) {
    throw new Error('Only the host can remove members.');
  }

  const targetIndex = groupOrder.members.findIndex((m) => m.name === memberName);
  if (targetIndex !== -1) {
    const removedMember = groupOrder.members[targetIndex];
    groupOrder.members.splice(targetIndex, 1);
    appendActivity(groupOrder, `${requesterName} removed ${memberName} from the feast`);
    await groupOrder.save();
    return { groupOrder, removedSocketId: removedMember.socketId };
  }
  return { groupOrder, removedSocketId: null };
};

const startGroupCheckout = async (groupCode, requesterName) => {
  const groupOrder = await groupOrderModel.findOne({ groupCode });
  if (!groupOrder) return null;

  const requester = groupOrder.members.find((m) => m.name === requesterName);
  if (!requester || !requester.isHost) {
    throw new Error('Only the host can start checkout.');
  }

  groupOrder.status = 'checkout_started';
  groupOrder.isLocked = true;
  appendActivity(groupOrder, `Host ${requesterName} started checkout 💳`);
  await groupOrder.save();
  return groupOrder;
};

const updateSocketPresence = async (socketId, isOnline) => {
  const groupOrder = await groupOrderModel.findOne({ 'members.socketId': socketId });
  if (!groupOrder) return null;

  const member = groupOrder.members.find((m) => m.socketId === socketId);
  if (member) {
    member.isOnline = isOnline;
    if (!isOnline) {
      appendActivity(groupOrder, `${member.name} went offline 🔴`);
    } else {
      appendActivity(groupOrder, `${member.name} reconnected 🟢`);
    }
    await groupOrder.save();
  }
  return groupOrder;
};

const updateMemberPayment = async (groupCode, name, paymentStatus) => {
  const groupOrder = await groupOrderModel.findOne({ groupCode });
  if (!groupOrder) return null;

  const member = groupOrder.members.find((m) => m.name === name);
  if (member) {
    member.paymentStatus = paymentStatus;
    appendActivity(groupOrder, `${name} marked share as ${paymentStatus === 'Paid' ? 'Paid ✅' : 'Pending ⏳'}`);
    await groupOrder.save();
  }
  return groupOrder;
};

const remindUnpaid = async (groupCode, senderName) => {
  const groupOrder = await groupOrderModel.findOne({ groupCode });
  if (!groupOrder) return null;

  appendActivity(groupOrder, `🔔 ${senderName} sent a payment reminder to all pending members`);
  await groupOrder.save();
  return groupOrder;
};

export {
  createGroupOrder,
  getGroupOrder,
  joinGroupOrder,
  joinGroupByName,
  updateGroupCart,
  markExpiredIfNeeded,
  toggleLockGroupOrder,
  removeMemberFromGroup,
  startGroupCheckout,
  updateSocketPresence,
  updateMemberPayment,
  remindUnpaid,
};

