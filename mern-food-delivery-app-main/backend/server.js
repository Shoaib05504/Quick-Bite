import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { connectDB } from './config/db.js';
import foodRouter from './routes/foodRoute.js';
import userRouter from './routes/userRoute.js';
import 'dotenv/config';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orderRoute.js';
import chatbotRouter from './routes/chatbotRoute.js';
import groupOrderRouter from './routes/groupOrderRoute.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { initSocket } from './config/socket.js';

// ── Validate required environment variables at startup ──────────────────────
const REQUIRED_ENV = [
  'MONGO_URI', 'JWT_SECRET', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET',
  'EMAIL', 'EMAIL_PASSWORD', 'GEMINI_API_KEY'
];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key] || process.env[key].startsWith('REPLACE_'));
if (missingEnv.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnv.join(', '));
  console.error('📋 Copy backend/.env.example to backend/.env and fill in real values.');
  process.exit(1);
}

const app = express();
const httpServer = createServer(app);

// Initialize real-time Socket.IO handler - triggered image download retry
initSocket(httpServer);

// ── Security headers — disabled temporarily to resolve cross-origin blocks ──
// app.use(helmet({
//   crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow images to load in browser
// }));

// ── CORS — only allow known origins ─────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  process.env.ADMIN_URL || 'http://localhost:5174',
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, same-origin)
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── General rate limiter ─────────────────────────────────────────────────────
app.use(generalLimiter);

// ── DB connection ─────────────────────────────────────────────────────────────
connectDB();

// ── Static uploads (images served publicly) ─────────────────────────────────
app.use('/images', express.static('uploads'));

// ── API routes ───────────────────────────────────────────────────────────────
app.use('/api/food', foodRouter);
app.use('/api/user', userRouter);
app.use('/api/cart', cartRouter);
app.use('/api/order', orderRouter);
app.use('/api/chatbot', chatbotRouter);
app.use('/api/group-order', groupOrderRouter);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'QuickBite API', version: '2.0.0' });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  // CORS errors
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ success: false, message: err.message });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── Port binding with retry ──────────────────────────────────────────────────
let port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;
const MAX_PORT_TRIES = 10;
let portAttempts = 0;

const startServer = (p) => {
  const onError = (err) => {
    if (err && err.code === 'EADDRINUSE' && portAttempts < MAX_PORT_TRIES) {
      portAttempts += 1;
      const nextPort = p + 1;
      console.warn(`Port ${p} in use, trying ${nextPort}...`);
      httpServer.removeListener('error', onError);
      httpServer.removeListener('listening', onListening);
      startServer(nextPort);
    } else {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  };

  const onListening = () => {
    console.log(`✅ QuickBite API running on http://localhost:${p}`);
    httpServer.removeListener('error', onError);
    httpServer.removeListener('listening', onListening);
  };

  httpServer.once('error', onError);
  httpServer.once('listening', onListening);
  httpServer.listen(p);
};

startServer(port);
