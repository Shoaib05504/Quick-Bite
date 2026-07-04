import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  items: { type: Array, required: true },
  amount: { type: Number, required: true },
  address: { type: Object, required: true },
  status: { type: String, default: 'placed', index: true },
  date: { type: Date, default: Date.now }, // FIX: was Date.now() — now a function reference
  payment: { type: Boolean, default: false },
  paymentMethod: { type: String, default: 'UPI' },
});

// Compound index for common query patterns
orderSchema.index({ userId: 1, date: -1 });
orderSchema.index({ date: -1 });

const orderModel = mongoose.models.order || mongoose.model('order', orderSchema);

export default orderModel;
