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
      { name: "Greek salad", price: 30, description: "Food provides essential nutrients for overall health and well-being", category: "Salad", image: "food_1.png" },
      { name: "Veg salad", price: 25, description: "Food provides essential nutrients for overall health and well-being", category: "Salad", image: "food_2.png" },
      { name: "Clover Salad", price: 30, description: "Food provides essential nutrients for overall health and well-being", category: "Salad", image: "food_3.png" },
      { name: "Chicken Salad", price: 50, description: "Food provides essential nutrients for overall health and well-being", category: "Salad", image: "food_4.png" },
      // Rolls
      { name: "Lasagna Rolls", price: 60, description: "Food provides essential nutrients for overall health and well-being", category: "Rolls", image: "food_5.png" },
      { name: "Peri Peri Rolls", price: 70, description: "Food provides essential nutrients for overall health and well-being", category: "Rolls", image: "food_6.png" },
      { name: "Chicken Rolls", price: 90, description: "Food provides essential nutrients for overall health and well-being", category: "Rolls", image: "food_7.png" },
      { name: "Veg Rolls", price: 70, description: "Food provides essential nutrients for overall health and well-being", category: "Rolls", image: "food_8.png" },
      // Deserts
      { name: "Ripple Ice Cream", price: 40, description: "Food provides essential nutrients for overall health and well-being", category: "Deserts", image: "food_9.png" },
      { name: "Fruit Ice Cream", price: 45, description: "Food provides essential nutrients for overall health and well-being", category: "Deserts", image: "food_10.png" },
      { name: "Jar Ice Cream", price: 30, description: "Food provides essential nutrients for overall health and well-being", category: "Deserts", image: "food_11.png" },
      { name: "Vanilla Ice Cream", price: 35, description: "Food provides essential nutrients for overall health and well-being", category: "Deserts", image: "food_12.png" },
      // Sandwich
      { name: "Chicken Sandwich", price: 100, description: "Food provides essential nutrients for overall health and well-being", category: "Sandwich", image: "food_13.png" },
      { name: "Vegan Sandwich", price: 80, description: "Food provides essential nutrients for overall health and well-being", category: "Sandwich", image: "food_14.png" },
      { name: "Grilled Sandwich", price: 75, description: "Food provides essential nutrients for overall health and well-being", category: "Sandwich", image: "food_15.png" },
      { name: "Bread Sandwich", price: 70, description: "Food provides essential nutrients for overall health and well-being", category: "Sandwich", image: "food_16.png" },
      // Cake
      { name: "Cup Cake", price: 40, description: "Food provides essential nutrients for overall health and well-being", category: "Cake", image: "food_17.png" },
      { name: "Vegan Cake", price: 35, description: "Food provides essential nutrients for overall health and well-being", category: "Cake", image: "food_18.png" },
      { name: "Butterscotch Cake", price: 50, description: "Food provides essential nutrients for overall health and well-being", category: "Cake", image: "food_19.png" },
      { name: "Sliced Cake", price: 45, description: "Food provides essential nutrients for overall health and well-being", category: "Cake", image: "food_20.png" },
      // Pure Veg
      { name: "Garlic Mushroom ", price: 75, description: "Food provides essential nutrients for overall health and well-being", category: "Pure Veg", image: "food_21.png" },
      { name: "Fried Cauliflower", price: 50, description: "Food provides essential nutrients for overall health and well-being", category: "Pure Veg", image: "food_22.png" },
      { name: "Mix Veg Pulao", price: 40, description: "Food provides essential nutrients for overall health and well-being", category: "Pure Veg", image: "food_23.png" },
      { name: "Rice Zucchini", price: 50, description: "Food provides essential nutrients for overall health and well-being", category: "Pure Veg", image: "food_24.png" },
      // Pasta
      { name: "Cheese Pasta", price: 60, description: "Food provides essential nutrients for overall health and well-being", category: "Pasta", image: "food_25.png" },
      { name: "Tomato Pasta", price: 60, description: "Food provides essential nutrients for overall health and well-being", category: "Pasta", image: "food_26.png" },
      { name: "Creamy Pasta", price: 65, description: "Food provides essential nutrients for overall health and well-being", category: "Pasta", image: "food_27.png" },
      { name: "Chicken Pasta", price: 85, description: "Food provides essential nutrients for overall health and well-being", category: "Pasta", image: "food_28.png" },
      // Noodles
      { name: "Buttter Noodles", price: 60, description: "Food provides essential nutrients for overall health and well-being", category: "Noodles", image: "food_29.png" },
      { name: "Veg Noodles", price: 50, description: "Food provides essential nutrients for overall health and well-being", category: "Noodles", image: "food_30.png" },
      { name: "Somen Noodles", price: 40, description: "Food provides essential nutrients for overall health and well-being", category: "Noodles", image: "food_31.png" },
      { name: "Cooked Noodles", price: 50, description: "Food provides essential nutrients for overall health and well-being", category: "Noodles", image: "food_32.png" },
      // Pizza
      { name: "margherita pizza", price: 150, description: "A simple and delicious classic Italian pizza with rich mozzarella cheese and fresh basil.", category: "Pizza", image: "https://th.bing.com/th/id/R.f64028935afcaa8eedbe7f148cedf46b?rik=NIvgQl8d7rsFaQ&riu=http%3a%2f%2fwww.tefal.com.au%2fcdn%2fshop%2farticles%2fMargherita_Pizza.webp%3fv%3d1744080384%26width%3d2048&ehk=GuOP9nnS0L19T1XUsyGMpN1NIZUgjkSau64uo%2bDOdqg%3d&risl=&pid=ImgRaw&r=0" },
      { name: "Cheese Pizza", price: 180, description: "Classic hot pizza loaded with extra melted mozzarella cheese.", category: "Pizza", image: "https://static.vecteezy.com/system/resources/thumbnails/047/021/782/small_2x/a-slice-of-freshly-baked-cheese-pizza-with-melted-mozzarella-free-photo.jpeg" },
      // Coffee & Refreshments
      { name: "Cold Coffee", price: 120, description: "Refreshing blended iced coffee with milk and rich chocolate syrup.", category: "☕ Coffee & Refreshments", image: "food_33.png" },
      { name: "Cappuccino", price: 140, description: "Classic espresso with steamed milk and a thick layer of foam.", category: "☕ Coffee & Refreshments", image: "food_34.png" },
      { name: "Café Latte", price: 150, description: "Smooth espresso blended with steamed milk and light foam.", category: "☕ Coffee & Refreshments", image: "food_35.png" },
      { name: "Espresso", price: 110, description: "Rich and bold single shot of pure espresso coffee.", category: "☕ Coffee & Refreshments", image: "food_36.png" },
      { name: "Fresh Lime Soda", price: 90, description: "Fizzy lime beverage served sweet or salted to refresh your senses.", category: "☕ Coffee & Refreshments", image: "food_37.png" },
      { name: "Virgin Mojito", price: 130, description: "Refreshing lime and mint mocktail served over crushed ice.", category: "☕ Coffee & Refreshments", image: "food_38.png" },
      { name: "Mango Smoothie", price: 160, description: "Thick and creamy tropical smoothie made with sweet mangoes.", category: "☕ Coffee & Refreshments", image: "food_39.png" },
      { name: "Chocolate Milkshake", price: 170, description: "Indulgent milkshake with rich Belgian chocolate and vanilla cream.", category: "☕ Coffee & Refreshments", image: "food_40.png" }
    ];

    // Seed missing items
    let seededCount = 0;
    for (const foodInfo of allExpectedFoods) {
      const exists = await foodModel.findOne({ name: { $regex: new RegExp(`^${foodInfo.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') } });
      if (!exists) {
        const item = new foodModel(foodInfo);
        await item.save();
        seededCount += 1;
      }
    }

    if (seededCount > 0) {
      console.log(`Seeded ${seededCount} missing food items successfully. ✅`);
    } else {
      console.log("All expected food items already exist in DB. ✅");
    }

    // Always update existing Coffee & Refreshments image references to point to local files
    const seededCoffeeItems = await foodModel.find({ category: '☕ Coffee & Refreshments' });
    const nameToImageMap = {
      "Cold Coffee": "food_33.png",
      "Cappuccino": "food_34.png",
      "Café Latte": "food_35.png",
      "Espresso": "food_36.png",
      "Fresh Lime Soda": "food_37.png",
      "Virgin Mojito": "food_38.png",
      "Mango Smoothie": "food_39.png",
      "Chocolate Milkshake": "food_40.png"
    };
    for (const foodItem of seededCoffeeItems) {
      const targetFilename = nameToImageMap[foodItem.name];
      if (targetFilename && foodItem.image !== targetFilename) {
        foodItem.image = targetFilename;
        await foodItem.save();
      }
    }
    console.log('Database coffee image mappings updated successfully! ✅');
  } catch (error) {
    console.error("Database connection/seeding failed:", error);
  }
};