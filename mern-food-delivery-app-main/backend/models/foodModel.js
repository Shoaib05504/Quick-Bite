import mongoose from 'mongoose';

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  description: { type: String, required: true, trim: true, minlength: 5, maxlength: 500 },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['Salad', 'Rolls', 'Deserts', 'Sandwich', 'Cake', 'Pure Veg', 'Pasta', 'Noodles', 'Pizza', '☕ Coffee & Refreshments'],
  },
}, { timestamps: true });

// Indexes for common query patterns
foodSchema.index({ category: 1 });
foodSchema.index({ name: 'text' }); // enables text search by name

const foodModel = mongoose.models.food || mongoose.model('food', foodSchema);

export default foodModel;