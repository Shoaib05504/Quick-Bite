import mongoose from "mongoose";

const normalizeMongoUri = (uri) => {
  try {
    const trimmed = uri.trim();
    if (!trimmed.startsWith('mongodb://') && !trimmed.startsWith('mongodb+srv://')) {
      return trimmed;
    }

    const uriParts = trimmed.split('://');
    const protocol = uriParts[0] + '://';
    const rest = uriParts[1];

    if (!rest.includes('@')) {
      return trimmed;
    }

    const [credentials, hostAndPath] = rest.split('@');
    if (!credentials.includes(':')) {
      return trimmed;
    }

    const [username, password] = credentials.split(/:(.+)/);
    const safeCredentials = `${encodeURIComponent(username)}:${encodeURIComponent(password)}`;
    return `${protocol}${safeCredentials}@${hostAndPath}`;
  } catch (error) {
    return uri;
  }
};

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import foodModel from "../models/foodModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');

const downloadImage = async (url, filename) => {
  const filepath = path.join(uploadsDir, filename);
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    if (fs.existsSync(filepath)) {
      return;
    }
    console.log(`[Downloader] Downloading ${filename}...`);
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filepath);
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    console.log(`[Downloader] Saved ${filename} successfully. ✅`);
  } catch (error) {
    console.error(`[Downloader] Failed to download ${filename}:`, error.message);
    const fallbackPath = path.join(uploadsDir, 'food_1.png');
    if (fs.existsSync(fallbackPath) && !fs.existsSync(filepath)) {
      console.log(`[Downloader] Copying food_1.png as fallback for ${filename}`);
      fs.copyFileSync(fallbackPath, filepath);
    }
  }
};

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URL || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI is not defined. Please set MONGODB_URL or MONGO_URI in .env');
    }

    const normalizedUri = normalizeMongoUri(mongoUri);
    await mongoose.connect(normalizedUri);
    console.log("MongoDB Connected ✅");

    // Automatically download Coffee & Refreshments images
    const imagesToDownload = [
      { url: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80", filename: "food_33.png" },
      { url: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&auto=format&fit=crop&q=80", filename: "food_34.png" },
      { url: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80", filename: "food_35.png" },
      { url: "https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=600&auto=format&fit=crop&q=80", filename: "food_36.png" },
      { url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80", filename: "food_37.png" },
      { url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80", filename: "food_38.png" },
      { url: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80", filename: "food_39.png" },
      { url: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80", filename: "food_40.png" },
      { url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80", filename: "menu_coffee.png" }
    ];

    for (const item of imagesToDownload) {
      await downloadImage(item.url, item.filename);
    }

    // Comprehensive list of all 42 expected foods (32 original items + 2 Pizza items + 8 Coffee & Refreshments items)
    const allExpectedFoods = [
      // Salad
      { name: "Greek salad", price: 30, description: "Food provides essential nutrients for overall health and well-being", category: "Salad", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80" },
      { name: "Veg salad", price: 25, description: "Food provides essential nutrients for overall health and well-being", category: "Salad", image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80" },
      { name: "Clover Salad", price: 30, description: "Food provides essential nutrients for overall health and well-being", category: "Salad", image: "https://images.unsplash.com/photo-1601648764658-cf37e8c89b70?w=400&q=80" },
      { name: "Chicken Salad", price: 50, description: "Food provides essential nutrients for overall health and well-being", category: "Salad", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80" },
      // Rolls
      { name: "Lasagna Rolls", price: 60, description: "Food provides essential nutrients for overall health and well-being", category: "Rolls", image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80" },
      { name: "Peri Peri Rolls", price: 70, description: "Food provides essential nutrients for overall health and well-being", category: "Rolls", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80" },
      { name: "Chicken Rolls", price: 90, description: "Food provides essential nutrients for overall health and well-being", category: "Rolls", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80" },
      { name: "Veg Rolls", price: 70, description: "Food provides essential nutrients for overall health and well-being", category: "Rolls", image: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&q=80" },
      // Deserts
      { name: "Ripple Ice Cream", price: 40, description: "Food provides essential nutrients for overall health and well-being", category: "Deserts", image: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&q=80" },
      { name: "Fruit Ice Cream", price: 45, description: "Food provides essential nutrients for overall health and well-being", category: "Deserts", image: "https://images.unsplash.com/photo-1488900128323-21503983a07e?w=400&q=80" },
      { name: "Jar Ice Cream", price: 30, description: "Food provides essential nutrients for overall health and well-being", category: "Deserts", image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80" },
      { name: "Vanilla Ice Cream", price: 35, description: "Food provides essential nutrients for overall health and well-being", category: "Deserts", image: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&q=80" },
      // Sandwich
      { name: "Chicken Sandwich", price: 100, description: "Food provides essential nutrients for overall health and well-being", category: "Sandwich", image: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=400&q=80" },
      { name: "Vegan Sandwich", price: 80, description: "Food provides essential nutrients for overall health and well-being", category: "Sandwich", image: "https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400&q=80" },
      { name: "Grilled Sandwich", price: 75, description: "Food provides essential nutrients for overall health and well-being", category: "Sandwich", image: "https://images.unsplash.com/photo-1528736235302-52922df5c122?w=400&q=80" },
      { name: "Bread Sandwich", price: 70, description: "Food provides essential nutrients for overall health and well-being", category: "Sandwich", image: "https://images.unsplash.com/photo-1521986329282-0436c1f1e212?w=400&q=80" },
      // Cake
      { name: "Cup Cake", price: 40, description: "Food provides essential nutrients for overall health and well-being", category: "Cake", image: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400&q=80" },
      { name: "Vegan Cake", price: 35, description: "Food provides essential nutrients for overall health and well-being", category: "Cake", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80" },
      { name: "Butterscotch Cake", price: 50, description: "Food provides essential nutrients for overall health and well-being", category: "Cake", image: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&q=80" },
      { name: "Sliced Cake", price: 45, description: "Food provides essential nutrients for overall health and well-being", category: "Cake", image: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&q=80" },
      // Pure Veg
      { name: "Garlic Mushroom ", price: 75, description: "Food provides essential nutrients for overall health and well-being", category: "Pure Veg", image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&q=80" },
      { name: "Fried Cauliflower", price: 50, description: "Food provides essential nutrients for overall health and well-being", category: "Pure Veg", image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80" },
      { name: "Mix Veg Pulao", price: 40, description: "Food provides essential nutrients for overall health and well-being", category: "Pure Veg", image: "https://images.unsplash.com/photo-1645696301019-35adcc18fc9e?w=400&q=80" },
      { name: "Rice Zucchini", price: 50, description: "Food provides essential nutrients for overall health and well-being", category: "Pure Veg", image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80" },
      // Pasta
      { name: "Cheese Pasta", price: 60, description: "Food provides essential nutrients for overall health and well-being", category: "Pasta", image: "https://images.unsplash.com/photo-1551183053-bf91798d792b?w=400&q=80" },
      { name: "Tomato Pasta", price: 60, description: "Food provides essential nutrients for overall health and well-being", category: "Pasta", image: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&q=80" },
      { name: "Creamy Pasta", price: 65, description: "Food provides essential nutrients for overall health and well-being", category: "Pasta", image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80" },
      { name: "Chicken Pasta", price: 85, description: "Food provides essential nutrients for overall health and well-being", category: "Pasta", image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&q=80" },
      // Noodles
      { name: "Buttter Noodles", price: 60, description: "Food provides essential nutrients for overall health and well-being", category: "Noodles", image: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=400&q=80" },
      { name: "Veg Noodles", price: 50, description: "Food provides essential nutrients for overall health and well-being", category: "Noodles", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80" },
      { name: "Somen Noodles", price: 40, description: "Food provides essential nutrients for overall health and well-being", category: "Noodles", image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80" },
      { name: "Cooked Noodles", price: 50, description: "Food provides essential nutrients for overall health and well-being", category: "Noodles", image: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&q=80" },
      // Pizza
      { name: "margherita pizza", price: 150, description: "A simple and delicious classic Italian pizza with rich mozzarella cheese and fresh basil.", category: "Pizza", image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80" },
      { name: "Cheese Pizza", price: 180, description: "Classic hot pizza loaded with extra melted mozzarella cheese.", category: "Pizza", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80" },
      // Coffee & Refreshments
      { name: "Cold Coffee", price: 120, description: "Refreshing blended iced coffee with milk and rich chocolate syrup.", category: "☕ Coffee & Refreshments", image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&q=80" },
      { name: "Cappuccino", price: 140, description: "Classic espresso with steamed milk and a thick layer of foam.", category: "☕ Coffee & Refreshments", image: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&q=80" },
      { name: "Café Latte", price: 150, description: "Smooth espresso blended with steamed milk and light foam.", category: "☕ Coffee & Refreshments", image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&q=80" },
      { name: "Espresso", price: 110, description: "Rich and bold single shot of pure espresso coffee.", category: "☕ Coffee & Refreshments", image: "https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=400&q=80" },
      { name: "Fresh Lime Soda", price: 90, description: "Fizzy lime beverage served sweet or salted to refresh your senses.", category: "☕ Coffee & Refreshments", image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80" },
      { name: "Virgin Mojito", price: 130, description: "Refreshing lime and mint mocktail served over crushed ice.", category: "☕ Coffee & Refreshments", image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&q=80" },
      { name: "Mango Smoothie", price: 160, description: "Thick and creamy tropical smoothie made with sweet mangoes.", category: "☕ Coffee & Refreshments", image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&q=80" },
      { name: "Chocolate Milkshake", price: 170, description: "Indulgent milkshake with rich Belgian chocolate and vanilla cream.", category: "☕ Coffee & Refreshments", image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80" }
    ];

    // Seed missing items AND update existing items with new image URLs
    let seededCount = 0;
    let updatedCount = 0;
    for (const foodInfo of allExpectedFoods) {
      const exists = await foodModel.findOne({ name: { $regex: new RegExp(`^${foodInfo.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } });
      if (!exists) {
        const item = new foodModel(foodInfo);
        await item.save();
        seededCount += 1;
      } else if (exists.image !== foodInfo.image && !exists.image.startsWith('http')) {
        // Update existing items that still have old local filename images
        exists.image = foodInfo.image;
        await exists.save();
        updatedCount += 1;
      }
    }

    if (seededCount > 0) console.log(`Seeded ${seededCount} missing food items successfully. ✅`);
    if (updatedCount > 0) console.log(`Updated ${updatedCount} food items with new image URLs. ✅`);
    if (seededCount === 0 && updatedCount === 0) console.log("All expected food items already exist and are up to date. ✅");

  } catch (error) {
    console.error("Database connection/seeding failed:", error);
  }
};