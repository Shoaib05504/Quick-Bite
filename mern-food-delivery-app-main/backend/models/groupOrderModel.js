import mongoose from 'mongoose';

const groupOrderSchema = new mongoose.Schema(
  {
    groupCode: { type: String, required: true, unique: true },
    groupName: { type: String, default: 'Friday Night Feast' },
    note: { type: String, default: 'No peanuts please! 🥜' },
    maxParticipants: { type: Number, default: 5 },
    expiry: { type: String, default: '30 Minutes' },
    expiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['active', 'locked', 'checkout_started', 'completed', 'expired'],
      default: 'active',
    },
    createdBy: { type: mongoose.Types.ObjectId, ref: 'user', default: null },
    isStarted: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },
    isExpired: { type: Boolean, default: false },
    totalAmount: { type: Number, default: 0 },
    members: [
      {
        userId: { type: mongoose.Types.ObjectId, ref: 'user', default: null },
        name: { type: String, required: true },
        isHost: { type: Boolean, default: false },
        isOnline: { type: Boolean, default: true },
        socketId: { type: String, default: null },
        avatar: { type: String, default: '' },
        joinedAt: { type: Date, default: Date.now },
        paymentStatus: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' },
      },
    ],
    cartItems: [
      {
        itemId: { type: String, required: true },
        name: { type: String, default: '' },
        image: { type: String, default: '' },
        quantity: { type: Number, required: true, default: 1 },
        addedBy: { type: String, default: 'Guest' },
        price: { type: Number, default: 0 },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    activities: [
      {
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    chatMessages: [
      {
        messageId: { type: String, required: true },
        sender: { type: String, required: true },
        initials: { type: String, default: '' },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const groupOrderModel = mongoose.models.groupOrder || mongoose.model('groupOrder', groupOrderSchema);
export default groupOrderModel;

