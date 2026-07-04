import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  id: { type: String },
  type: { type: String, enum: ['Home', 'Hostel', 'Office', 'College', 'Other'], default: 'Home' },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  email: { type: String, default: '' },
  name: { type: String, default: '' },
  phone: { type: String, default: '' },
  street: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  country: { type: String, default: '' },
  pincode: { type: String, default: '' },
  landmark: { type: String, default: '' },
  isDefault: { type: Boolean, default: false },
});

const notificationSchema = new mongoose.Schema({
  id: { type: String },
  type: { type: String, enum: ['order', 'coupon', 'reward', 'system'] },
  title: { type: String },
  message: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }, // NEW: role-based access control
  phone: { type: String, default: '' },
  profileImage: { type: String, default: 'https://i.ibb.co/RDkh4Cw/profile-default.jpg' },
  memberSince: { type: Date, default: Date.now },
  memberBadge: { type: String, default: 'Silver' },
  profileCompletion: { type: Number, default: 30 },
  rewardPoints: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  ratings: { type: Number, default: 0 },
  addresses: [addressSchema],
  notifications: [notificationSchema],
  cartData: { type: Object, default: {} },
}, { minimize: false, timestamps: true });


const userModel = mongoose.models.user || mongoose.model('user', userSchema);

export default userModel;