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
          quantity: Math.max(0, Number(item.quantity) || 0),
          addedBy: String(item.addedBy || item.name || 'Guest'),
          price: Number(item.price || 0),
        }))
        .filter((item) => item.itemId && item.quantity > 0)
    : []);

const appendActivity = (group, message) => {
  group.activities.unshift({ message, createdAt: new Date() });
};

const markExpiredIfNeeded = async (group) => {
  if (!group) return group;
  if (group.isExpired || new Date() > new Date(group.expiresAt)) {
    if (!group.isExpired) {
      group.isExpired = true;
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
      quantity: item.quantity,
      addedBy: item.addedBy || 'Host',
      price: item.price,
    }));

    const userId = req.body.userId || null;
    const user = userId ? await userModel.findById(userId) : null;
    const creatorName = user?.name || req.body.name || 'Host';

    const duration = req.body.expiry || '30 Minutes';
    const groupOrder = await groupOrderModel.create({
      groupCode: await generateGroupCode(),
      groupName: req.body.groupName || 'Friday Night Feast',
      note: req.body.note || 'No peanuts please! 🥜',
      maxParticipants: Number(req.body.maxParticipants) || 5,
      expiry: duration,
      members: [{ userId, name: creatorName }],
      cartItems: sanitizedCart,
      createdBy: userId,
      expiresAt: buildExpiresAt(duration),
      totalAmount: 0,
      activities: [
        {
          message: `${creatorName} created the QuickBite Group Feast`,
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

const joinGroupByName = async (groupCode, name) => {
  const groupOrder = await groupOrderModel.findOne({ groupCode });
  if (!groupOrder) {
    return { success: false, message: 'Group order not found' };
  }
  await markExpiredIfNeeded(groupOrder);
  if (groupOrder.isExpired) {
    return { success: false, message: 'Group order has expired', isExpired: true };
  }

  const memberName = String(name || 'Guest').trim() || 'Guest';
  const alreadyMember = groupOrder.members.some((member) => member.name === memberName);
  if (!alreadyMember) {
    groupOrder.members.push({ name: memberName });
  }
  appendActivity(groupOrder, `${memberName} joined the feast 👋`);
  await groupOrder.save();

  return { success: true, groupOrder };
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

const updateGroupCart = async (groupCode, action, itemId, quantity, addedBy, price = 0) => {
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

  if (action === 'add') {
    if (itemIndex === -1) {
      groupOrder.cartItems.push({ itemId, quantity: 1, addedBy: normalizedName, price });
    } else {
      groupOrder.cartItems[itemIndex].quantity += 1;
    }
    appendActivity(groupOrder, `${normalizedName} added an item to the group cart`);
  } else if (action === 'remove') {
    if (currentItem) {
      currentItem.quantity -= 1;
      if (currentItem.quantity <= 0) {
        groupOrder.cartItems.splice(itemIndex, 1);
      }
      appendActivity(groupOrder, `${normalizedName} removed an item from the group cart`);
    }
  } else if (action === 'set') {
    const qty = Math.max(0, Number(quantity) || 0);
    if (qty === 0) {
      if (itemIndex !== -1) {
        groupOrder.cartItems.splice(itemIndex, 1);
      }
    } else if (itemIndex === -1) {
      groupOrder.cartItems.push({ itemId, quantity: qty, addedBy: normalizedName, price });
    } else {
      groupOrder.cartItems[itemIndex].quantity = qty;
    }
    appendActivity(groupOrder, `${normalizedName} updated a group item quantity`);
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
  const statusMsg = isLocked ? 'locked the cart 🔒' : 'unlocked the cart 🔓';
  appendActivity(groupOrder, `Host ${statusMsg}`);
  await groupOrder.save();
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
  updateMemberPayment,
  remindUnpaid,
};
