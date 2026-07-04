import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/admin.js';
import { clearCache } from '../middleware/cache.js';
import { cacheMiddleware } from '../middleware/cache.js';
import { addFood, listFood, deleteFood } from '../controllers/foodController.js';

// ── Multer — safe file uploads ───────────────────────────────────────────────
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: 'uploads',
  filename: (req, file, cb) => {
    // Use UUID filename — prevents path traversal and original filename injection
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter,
});

const router = express.Router();

// ── Routes ────────────────────────────────────────────────────────────────────
// Public: list all food items (cached for 60 seconds)
router.get('/list', cacheMiddleware(60), listFood);

// Admin-only: add and remove food items
router.post('/add', authMiddleware, adminMiddleware, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, (req, res, next) => {
  clearCache('/api/food/list'); // invalidate food list cache on add
  next();
}, addFood);

router.post('/remove', authMiddleware, adminMiddleware, (req, res, next) => {
  clearCache('/api/food/list'); // invalidate food list cache on remove
  next();
}, deleteFood);

export default router;