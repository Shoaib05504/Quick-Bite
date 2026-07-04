import mongoose from 'mongoose';

const groupOrderSchema = new mongoose.Schema(
  {
    groupCode: { type: String, required: true, unique: true },
    members: [
      {
        userId: { type: mongoose.Types.ObjectId, ref: 'user', default: null },
        name: { type: String, required: true },
        joinedAt: { type: Date, default: Date.now },
        paymentStatus: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' },
      },
    ],
    cartItems: [
      {
        itemId: { type: String, required: true },
        quantity: { type: Number, required: true, default: 1 },
        addedBy: { type: String, default: 'Guest' },
        price: { type: Number, default: 0 },
      },
    ],
    activities: [
      {
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    createdBy: { type: mongoose.Types.ObjectId, ref: 'user', default: null },
    expiresAt: { type: Date, required: true },
    totalAmount: { type: Number, default: 0 },
    isExpired: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },
    groupName: { type: String, default: 'Friday Night Feast' },
    note: { type: String, default: 'No peanuts please! 🥜' },
    maxParticipants: { type: Number, default: 5 },
    expiry: { type: String, default: '30 Minutes' },
  },
  { timestamps: true }
);


const groupOrderModel = mongoose.models.groupOrder || mongoose.model('groupOrder', groupOrderSchema);
export default groupOrderModel;
