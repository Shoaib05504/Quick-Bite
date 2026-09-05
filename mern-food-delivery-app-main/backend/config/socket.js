import { Server } from 'socket.io';
import {
  joinGroupByName,
  updateGroupCart,
  toggleLockGroupOrder,
  removeMemberFromGroup,
  startGroupCheckout,
  updateSocketPresence,
  updateMemberPayment,
  remindUnpaid,
  addChatMessage,
  startGroupFeast,
} from '../controllers/groupOrderController.js';

export const initSocket = (httpServer) => {
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    process.env.ADMIN_URL || 'http://localhost:5174',
    process.env.RENDER_EXTERNAL_URL,
  ]
    .filter(Boolean)
    .map((url) => url.replace(/\/$/, ''));

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const normalizedOrigin = origin.replace(/\/$/, '');
        if (
          allowedOrigins.includes(normalizedOrigin) ||
          normalizedOrigin.startsWith('http://localhost:') ||
          normalizedOrigin.startsWith('http://127.0.0.1:')
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
  });

  // Track active socket to room mapping
  const socketMetaMap = new Map(); // socket.id -> { groupCode, name }

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connection established: ${socket.id}`);

    // Join room & register presence
    socket.on('group:join', async ({ groupCode, name, avatar }, callback) => {
      try {
        const result = await joinGroupByName(groupCode, name, socket.id, avatar);
        if (result.success) {
          socket.join(groupCode);
          socketMetaMap.set(socket.id, { groupCode, name: result.memberName || name });

          // Broadcast updated group state & notification
          io.to(groupCode).emit('group:updated', { groupOrder: result.groupOrder });
          io.to(groupCode).emit('group:notification', {
            type: 'member_joined',
            message: `${result.memberName || name} joined the Group Feast 👋`,
            name: result.memberName || name,
            timestamp: new Date(),
          });
        }
        if (callback) callback(result);
      } catch (err) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Update group cart
    socket.on('group:updateCart', async ({ groupCode, action, itemId, quantity, addedBy, price, name, image }, callback) => {
      try {
        const updatedGroup = await updateGroupCart(groupCode, action, itemId, quantity, addedBy, price, name, image);
        if (updatedGroup) {
          io.to(groupCode).emit('group:updated', { groupOrder: updatedGroup });
          io.to(groupCode).emit('group:notification', {
            type: 'cart_updated',
            message: `${addedBy} ${action === 'add' ? 'added' : action === 'remove' ? 'removed' : 'updated'} ${name || 'an item'}`,
            name: addedBy,
            timestamp: new Date(),
          });
          if (callback) callback({ success: true, groupOrder: updatedGroup });
        } else {
          if (callback) callback({ success: false, message: 'Group not found' });
        }
      } catch (err) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Toggle Lock status (Host control)
    socket.on('group:toggleLock', async ({ groupCode, isLocked, requesterName }, callback) => {
      try {
        const updatedGroup = await toggleLockGroupOrder(groupCode, isLocked);
        if (updatedGroup) {
          io.to(groupCode).emit('group:updated', { groupOrder: updatedGroup });
          io.to(groupCode).emit('group:notification', {
            type: 'lock_toggled',
            message: `Cart ${isLocked ? 'locked 🔒' : 'unlocked 🔓'} by Host ${requesterName || ''}`,
            timestamp: new Date(),
          });
          if (callback) callback({ success: true, groupOrder: updatedGroup });
        } else {
          if (callback) callback({ success: false, message: 'Failed to toggle lock' });
        }
      } catch (err) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Host: Remove Member
    socket.on('group:removeMember', async ({ groupCode, memberName, requesterName }, callback) => {
      try {
        const result = await removeMemberFromGroup(groupCode, memberName, requesterName);
        if (result && result.groupOrder) {
          if (result.removedSocketId) {
            const targetSocket = io.sockets.sockets.get(result.removedSocketId);
            if (targetSocket) {
              targetSocket.leave(groupCode);
              targetSocket.emit('group:kicked', { message: 'You were removed from the Group Feast by the host.' });
            }
          }
          io.to(groupCode).emit('group:updated', { groupOrder: result.groupOrder });
          io.to(groupCode).emit('group:notification', {
            type: 'member_removed',
            message: `${memberName} was removed from the feast by Host`,
            timestamp: new Date(),
          });
          if (callback) callback({ success: true, groupOrder: result.groupOrder });
        } else {
          if (callback) callback({ success: false, message: 'Failed to remove member' });
        }
      } catch (err) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Host: Start Checkout
    socket.on('group:startCheckout', async ({ groupCode, requesterName }, callback) => {
      try {
        const updatedGroup = await startGroupCheckout(groupCode, requesterName);
        if (updatedGroup) {
          io.to(groupCode).emit('group:updated', { groupOrder: updatedGroup });
          io.to(groupCode).emit('group:checkoutStarted', { groupOrder: updatedGroup });
          io.to(groupCode).emit('group:notification', {
            type: 'checkout_started',
            message: `Checkout started by Host ${requesterName || ''}! 💳`,
            timestamp: new Date(),
          });
          if (callback) callback({ success: true, groupOrder: updatedGroup });
        } else {
          if (callback) callback({ success: false, message: 'Failed to start checkout' });
        }
      } catch (err) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Update member payment status
    socket.on('group:updatePayment', async ({ groupCode, name, paymentStatus }, callback) => {
      try {
        const updatedGroup = await updateMemberPayment(groupCode, name, paymentStatus);
        if (updatedGroup) {
          io.to(groupCode).emit('group:updated', { groupOrder: updatedGroup });
          if (callback) callback({ success: true, groupOrder: updatedGroup });
        } else {
          if (callback) callback({ success: false, message: 'Failed to update payment status' });
        }
      } catch (err) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Trigger payment reminder
    socket.on('group:remindUnpaid', async ({ groupCode, senderName }, callback) => {
      try {
        const updatedGroup = await remindUnpaid(groupCode, senderName);
        if (updatedGroup) {
          io.to(groupCode).emit('group:remind', { senderName });
          io.to(groupCode).emit('group:updated', { groupOrder: updatedGroup });
          if (callback) callback({ success: true, groupOrder: updatedGroup });
        } else {
          if (callback) callback({ success: false, message: 'Group not found' });
        }
      } catch (err) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Real-Time Group Chat Message
    socket.on('group:sendMessage', async ({ groupCode, sender, text }, callback) => {
      try {
        const result = await addChatMessage(groupCode, sender, text);
        if (result && result.message) {
          io.to(groupCode).emit('group:chatMessage', {
            message: result.message,
            groupOrder: result.updatedGroup,
          });
          if (callback) callback({ success: true, message: result.message });
        } else {
          if (callback) callback({ success: false, message: 'Failed to send message' });
        }
      } catch (err) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Start Group Feast Session
    socket.on('group:startFeast', async ({ groupCode, requesterName }, callback) => {
      try {
        const updatedGroup = await startGroupFeast(groupCode, requesterName);
        if (updatedGroup) {
          io.to(groupCode).emit('group:feastStarted', { groupOrder: updatedGroup });
          io.to(groupCode).emit('group:updated', { groupOrder: updatedGroup });
          if (callback) callback({ success: true, groupOrder: updatedGroup });
        } else {
          if (callback) callback({ success: false, message: 'Group not found' });
        }
      } catch (err) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Handle Disconnect & Presence Tracking
    socket.on('disconnect', async () => {
      console.log(`🔌 Socket client disconnected: ${socket.id}`);
      const meta = socketMetaMap.get(socket.id);
      if (meta) {
        socketMetaMap.delete(socket.id);
        try {
          const updatedGroup = await updateSocketPresence(socket.id, false);
          if (updatedGroup) {
            io.to(meta.groupCode).emit('group:updated', { groupOrder: updatedGroup });
            io.to(meta.groupCode).emit('group:notification', {
              type: 'member_offline',
              message: `${meta.name} disconnected`,
              name: meta.name,
              timestamp: new Date(),
            });
          }
        } catch (err) {
          console.error('Error handling socket disconnect presence:', err.message);
        }
      }
    });
  });

  return io;
};

