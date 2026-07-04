import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { chatbotLimiter } from '../middleware/rateLimiter.js';
import { askChatbot } from '../controllers/chatbotController.js';

const chatbotRouter = express.Router();

// Requires auth to prevent anonymous API quota abuse
// Additionally rate-limited to 20 req/min per IP
chatbotRouter.post('/ask', authMiddleware, chatbotLimiter, askChatbot);

export default chatbotRouter;
