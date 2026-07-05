// One-time migration script: Upload all local food images to Cloudinary
// Reads .env manually to handle quoted values
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read and parse .env manually (strip quotes from values)
const envPath = path.resolve(__dirname, '../.env');
const envRaw = fs.readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envRaw.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx < 0) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  // Strip surrounding quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  env[key] = val;
}

console.log('Cloud name:', env.CLOUDINARY_CLOUD_NAME);
console.log('API key:', env.CLOUDINARY_API_KEY);
console.log('API secret length:', env.CLOUDINARY_API_SECRET?.length);

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const uploadsDir = path.resolve(__dirname, '../uploads');

const imageFiles = fs.readdirSync(uploadsDir).filter(f =>
  /^food_\d+\.(png|jpg|jpeg|webp)$/i.test(f)
);

console.log(`\nFound ${imageFiles.length} food images to upload...\n`);

const results = {};

for (const filename of imageFiles) {
  const filepath = path.join(uploadsDir, filename);
  const publicId = `quickbite/food/${path.parse(filename).name}`;
  try {
    const result = await cloudinary.uploader.upload(filepath, {
      public_id: publicId,
      resource_type: 'image',
      overwrite: true,
    });
    results[filename] = result.secure_url;
    console.log(`✅ ${filename} → ${result.secure_url}`);
  } catch (err) {
    console.error(`❌ Failed to upload ${filename}:`, err.message);
  }
}

console.log('\n\n=== CLOUDINARY URL MAP ===\n');
for (const [file, url] of Object.entries(results)) {
  console.log(`"${file}": "${url}",`);
}

const outputPath = path.resolve(__dirname, '../config/cloudinary-image-map.json');
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
console.log(`\n✅ Results saved to ${outputPath}`);
