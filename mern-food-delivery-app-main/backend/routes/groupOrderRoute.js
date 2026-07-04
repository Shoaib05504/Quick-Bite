import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { createGroupOrder, getGroupOrder, joinGroupOrder } from '../controllers/groupOrderController.js';

const router = express.Router();

router.post('/create', authMiddleware, createGroupOrder);
router.post('/join', joinGroupOrder);
router.get('/:groupCode', getGroupOrder);

export default router;
