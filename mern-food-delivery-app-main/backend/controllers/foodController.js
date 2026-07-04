import foodModel from '../models/foodModel.js';
import validator from 'validator';

const ALLOWED_CATEGORIES = ['Salad', 'Rolls', 'Deserts', 'Sandwich', 'Cake', 'Pure Veg', 'Pasta', 'Noodles', 'Pizza', '☕ Coffee & Refreshments'];

// ── Add Food (Admin only — protected at route level) ──────────────────────────
const addFood = async (req, res) => {
  try {
    const { name, description, price, category, image } = req.body;

    // Validate required fields
    if (!name || !description || !price || !category) {
      return res.status(400).json({ success: false, message: 'Name, description, price, and category are required.' });
    }

    const parsedPrice = Number(price);
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0 || parsedPrice > 100000) {
      return res.status(400).json({ success: false, message: 'Price must be a positive number (max 100,000).' });
    }

    if (name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({ success: false, message: 'Food name must be between 2 and 100 characters.' });
    }

    if (description.trim().length < 5 || description.trim().length > 500) {
      return res.status(400).json({ success: false, message: 'Description must be between 5 and 500 characters.' });
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Allowed: ${ALLOWED_CATEGORIES.join(', ')}`,
      });
    }

    // Image: either from multer+Cloudinary upload (file) or a provided URL
    let imageValue = image;
    if (req.file) {
      imageValue = req.file.cloudinaryUrl || req.file.filename;
    }

    if (!imageValue) {
      return res.status(400).json({ success: false, message: 'Food image is required.' });
    }

    const food = new foodModel({
      name: name.trim(),
      description: description.trim(),
      price: parsedPrice,
      category,
      image: imageValue,
    });

    await food.save();
    res.status(201).json({ success: true, message: 'Food item added successfully.' });
  } catch (error) {
    console.error('addFood error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to add food item.' });
  }
};

// ── List Food (Public — cached at route level) ────────────────────────────────
const listFood = async (req, res) => {
  try {
    const foods = await foodModel.find({}).lean();
    res.json({ success: true, data: foods });
  } catch (error) {
    console.error('listFood error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch food items.' });
  }
};

// ── Delete Food (Admin only — protected at route level) ───────────────────────
const deleteFood = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Food item ID is required.' });
    }

    const deleted = await foodModel.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Food item not found.' });
    }

    res.json({ success: true, message: 'Food item deleted.' });
  } catch (error) {
    console.error('deleteFood error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete food item.' });
  }
};

export { addFood, listFood, deleteFood };