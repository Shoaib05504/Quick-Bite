import express from 'express';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/admin.js';
import {
  placeOrder,
  verifyPayment,
  userOrders,
  getDashboardData,
  listOrders,
  updateStatus,
} from '../controllers/orderController.js';

const orderRouter = express.Router();

// ── User routes (authenticated) ──────────────────────────────────────────────
orderRouter.post('/place', authMiddleware, placeOrder);
orderRouter.post('/userorders', authMiddleware, userOrders);

// Payment verification — authenticated to prevent anonymous abuse
orderRouter.post('/verify', authMiddleware, verifyPayment);

// ── Admin routes (authenticated + admin role) ────────────────────────────────
orderRouter.get('/dashboard', authMiddleware, adminMiddleware, getDashboardData);
orderRouter.get('/list', authMiddleware, adminMiddleware, listOrders);
orderRouter.post('/status', authMiddleware, adminMiddleware, updateStatus);

export default orderRouter;
