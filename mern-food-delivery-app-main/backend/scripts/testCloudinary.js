// Test Cloudinary credentials
import cloudinary from '../config/cloudinary.js';

try {
  const result = await cloudinary.api.ping();
  console.log('Cloudinary ping:', result);
} catch (err) {
  console.error('Cloudinary error:', err.message);
  console.log('Config:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret_length: process.env.CLOUDINARY_API_SECRET?.length,
  });
}
