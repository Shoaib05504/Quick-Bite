import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiter for authentication endpoints.
 * Prevents brute-force attacks on login/register.
 * 10 attempts per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  skipSuccessfulRequests: true, // only count failed requests
});

/**
 * Rate limiter for the AI chatbot endpoint.
 * Protects against API quota exhaustion.
 * 20 requests per minute per IP.
 */
export const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Chatbot rate limit reached. Please wait a moment.',
  },
});

/**
 * General API rate limiter.
 * Applied to all other routes.
 * 200 requests per 15 minutes per IP.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Never rate-limit Socket.IO polling, static upload images, or static web assets
    if (req.path.startsWith('/socket.io')) return true;
    if (req.path.startsWith('/images')) return true;
    if (req.path.startsWith('/assets')) return true;
    if (!req.path.startsWith('/api')) return true;
    return false;
  },
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
  },
});
