import { Server } from 'socket.io';
import {
  joinGroupByName,
  updateGroupCart,
  toggleLockGroupOrder,
  updateMemberPayment,
  remindUnpaid,
} from '../controllers/groupOrderController.js';

export const initSocket = (httpServer) => {
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    process.env.ADMIN_URL || 'http://localhost:5174',
  ];

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
          callback(null, true);
        } else {
          callback(new Error('CORS: Origin not allowed by socket'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connection established: ${socket.id}`);

    // Join room
    socket.on('group:join', async ({ groupCode, name }, callback) => {
      try {
        const result = await joinGroupByName(groupCode, name);
        if (result.success) {
          socket.join(groupCode);
          io.to(groupCode).emit('group:updated', { groupOrder: result.groupOrder });
        }
        if (callback) callback(result);
      } catch (err) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Update group cart
    socket.on('group:updateCart', async ({ groupCode, action, itemId, quantity, addedBy, price }, callback) => {
      try {
        const updatedGroup = await updateGroupCart(groupCode, action, itemId, quantity, addedBy, price);
        if (updatedGroup) {
          io.to(groupCode).emit('group:updated', { groupOrder: updatedGroup });
          if (callback) callback({ success: true, groupOrder: updatedGroup });
        } else {
          if (callback) callback({ success: false, message: 'Group not found' });
        }
      } catch (err) {
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Toggle Lock status
    socket.on('group:toggleLock', async ({ groupCode, isLocked }, callback) => {
      try {
        const updatedGroup = await toggleLockGroupOrder(groupCode, isLocked);
        if (updatedGroup) {
          io.to(groupCode).emit('group:updated', { groupOrder: updatedGroup });
          if (callback) callback({ success: true, groupOrder: updatedGroup });
        } else {
          if (callback) callback({ success: false, message: 'Failed to toggle lock' });
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
          // Broadcast message event to group room
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

    socket.on('disconnect', () => {
      console.log(`🔌 Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};
