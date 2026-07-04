import express from 'express';
import multer from 'multer';
import path from 'path';
import { Readable } from 'stream';
import cloudinary from '../config/cloudinary.js';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/admin.js';
import { clearCache } from '../middleware/cache.js';
import { cacheMiddleware } from '../middleware/cache.js';
import { addFood, listFood, deleteFood } from '../controllers/foodController.js';

// ── Multer — memory storage (uploads go to Cloudinary, not disk) ─────────────
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'));
  }
  cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter,
});

// ── Cloudinary upload helper ─────────────────────────────────────────────────
const uploadToCloudinary = (buffer, mimetype) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'quickbite/food', resource_type: 'image' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
};

// Attach Cloudinary URL to req.file so foodController can use req.file.url
const attachCloudinaryUrl = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    req.file.cloudinaryUrl = result.secure_url;
    req.file.cloudinaryPublicId = result.public_id;
    next();
  } catch (err) {
    console.error('[Cloudinary] Upload failed:', err.message);
    return res.status(500).json({ success: false, message: 'Image upload failed. Please try again.' });
  }
};

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
}, attachCloudinaryUrl, (req, res, next) => {
  clearCache('/api/food/list'); // invalidate food list cache on add
  next();
}, addFood);

router.post('/remove', authMiddleware, adminMiddleware, (req, res, next) => {
  clearCache('/api/food/list'); // invalidate food list cache on remove
  next();
}, deleteFood);

export default router;