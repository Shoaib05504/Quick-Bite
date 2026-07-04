import userModel from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import validator from 'validator';

// ── Token factory ─────────────────────────────────────────────────────────────
const createToken = (id, role = 'user') => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ── Login ─────────────────────────────────────────────────────────────────────
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const user = await userModel.findOne({ email: email.toLowerCase().trim() });

    // Generic message — prevents user enumeration
    const INVALID_MSG = 'Invalid email or password.';

    if (!user) {
      return res.status(401).json({ success: false, message: INVALID_MSG });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: INVALID_MSG });
    }

    const token = createToken(user._id, user.role);
    res.json({ success: true, token, userId: user._id, role: user.role });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

// ── Register ──────────────────────────────────────────────────────────────────
const registerUser = async (req, res) => {
  const { name, password, email } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  try {
    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const exists = await userModel.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(12); // increased from 10 to 12 rounds
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name: name.trim(),
      firstName: name.trim().split(' ')[0],
      lastName: name.trim().split(' ').slice(1).join(' '),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'user',
    });

    const user = await newUser.save();
    const token = createToken(user._id, user.role);
    res.status(201).json({ success: true, token, userId: user._id });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

// ── Get user profile ──────────────────────────────────────────────────────────
const getUserProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.body.userId).select('-password -__v');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userData = user.toObject();
    userData.addresses = (userData.addresses || []).map((addr) => ({
      ...addr,
      id: addr.id || String(addr._id),
    }));

    res.json({ success: true, user: userData });
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
};

// ── Update profile ────────────────────────────────────────────────────────────
const ALLOWED_IMAGE_HOSTS = ['res.cloudinary.com', 'i.ibb.co', 'images.unsplash.com'];

const isValidProfileImageUrl = (url) => {
  if (!url) return true; // optional field
  try {
    const parsed = new URL(url);
    return (
      ['http:', 'https:'].includes(parsed.protocol) &&
      ALLOWED_IMAGE_HOSTS.some((host) => parsed.hostname.includes(host))
    );
  } catch {
    return false;
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, profileImage } = req.body;

    // Validate profileImage to prevent SSRF
    if (profileImage && !isValidProfileImageUrl(profileImage)) {
      return res.status(400).json({ success: false, message: 'Invalid profile image URL.' });
    }

    const user = await userModel.findById(req.body.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (email && email !== user.email) {
      if (!validator.isEmail(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email address.' });
      }
      const emailExists = await userModel.findOne({ email: email.toLowerCase().trim() });
      if (emailExists) {
        return res.status(409).json({ success: false, message: 'Email already in use.' });
      }
    }

    if (firstName) user.firstName = firstName.trim();
    if (lastName !== undefined) user.lastName = lastName.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (phone) user.phone = phone.trim();
    if (profileImage) user.profileImage = profileImage;

    user.name = `${user.firstName} ${user.lastName}`.trim();

    // Recalculate profile completion
    let completion = 30;
    if (user.firstName) completion += 10;
    if (user.lastName) completion += 10;
    if (user.email) completion += 10;
    if (user.phone) completion += 10;
    if (user.profileImage && !user.profileImage.includes('profile-default')) completion += 20;
    if (user.addresses.length > 0) completion += 10;
    user.profileCompletion = Math.min(completion, 100);

    await user.save();

    // Return user without password
    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.__v;

    res.json({ success: true, message: 'Profile updated successfully.', user: safeUser });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

// ── Change password ───────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New passwords do not match.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({ success: false, message: 'New password must differ from current password.' });
    }

    const user = await userModel.findById(req.body.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
};

// ── Address helpers ───────────────────────────────────────────────────────────
const clearDefaultAddress = (addresses) => {
  addresses.forEach((addr) => { addr.isDefault = false; });
};

const ensureDefaultAddress = (addresses) => {
  if (addresses.length > 0 && !addresses.some((a) => a.isDefault)) {
    addresses[0].isDefault = true;
  }
};

const findAddressIndex = (addresses, addressId) =>
  addresses.findIndex(
    (addr) =>
      (addr.id && String(addr.id) === String(addressId)) ||
      (addr._id && String(addr._id) === String(addressId))
  );

const serializeAddresses = (addresses) =>
  addresses.map((addr) => {
    const plain = addr.toObject ? addr.toObject() : { ...addr };
    return { ...plain, id: plain.id || String(plain._id) };
  });

// ── Add address ────────────────────────────────────────────────────────────────
const addAddress = async (req, res) => {
  try {
    const { type, firstName, lastName, email, name, phone, street, city, state, country, pincode, landmark, isDefault } = req.body;

    const user = await userModel.findById(req.body.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (isDefault) clearDefaultAddress(user.addresses);

    const newAddress = {
      id: Date.now().toString(),
      type: type || 'Home',
      firstName: (firstName || '').trim(),
      lastName: (lastName || '').trim(),
      email: (email || '').trim(),
      name: name || `${firstName || ''} ${lastName || ''}`.trim(),
      phone: (phone || '').trim(),
      street: (street || '').trim(),
      city: (city || '').trim(),
      state: (state || '').trim(),
      country: (country || '').trim(),
      pincode: (pincode || '').trim(),
      landmark: (landmark || '').trim(),
      isDefault: Boolean(isDefault) || user.addresses.length === 0,
    };

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json({ success: true, message: 'Address added.', addresses: serializeAddresses(user.addresses) });
  } catch (error) {
    console.error('Add address error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to add address.' });
  }
};

// ── Edit address ────────────────────────────────────────────────────────────────
const editAddress = async (req, res) => {
  try {
    const { addressId, type, firstName, lastName, email, name, phone, street, city, state, country, pincode, landmark, isDefault } = req.body;

    const user = await userModel.findById(req.body.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const idx = findAddressIndex(user.addresses, addressId);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Address not found.' });

    const address = user.addresses[idx];
    if (!address.id && address._id) address.id = String(address._id);

    if (isDefault) clearDefaultAddress(user.addresses);

    if (type !== undefined) address.type = type;
    if (firstName !== undefined) address.firstName = firstName.trim();
    if (lastName !== undefined) address.lastName = lastName.trim();
    if (email !== undefined) address.email = email.trim();
    if (name !== undefined) address.name = name.trim();
    if (phone !== undefined) address.phone = phone.trim();
    if (street !== undefined) address.street = street.trim();
    if (city !== undefined) address.city = city.trim();
    if (state !== undefined) address.state = state.trim();
    if (country !== undefined) address.country = country.trim();
    if (pincode !== undefined) address.pincode = pincode.trim();
    if (landmark !== undefined) address.landmark = landmark.trim();
    if (isDefault !== undefined) address.isDefault = Boolean(isDefault);

    ensureDefaultAddress(user.addresses);
    await user.save();

    res.json({ success: true, message: 'Address updated.', addresses: serializeAddresses(user.addresses) });
  } catch (error) {
    console.error('Edit address error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update address.' });
  }
};

// ── Delete address ────────────────────────────────────────────────────────────
const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.body;

    const user = await userModel.findById(req.body.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const idx = findAddressIndex(user.addresses, addressId);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Address not found.' });

    user.addresses.splice(idx, 1);
    ensureDefaultAddress(user.addresses);
    await user.save();

    res.json({ success: true, message: 'Address deleted.', addresses: serializeAddresses(user.addresses) });
  } catch (error) {
    console.error('Delete address error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete address.' });
  }
};

// ── Notifications ─────────────────────────────────────────────────────────────
const getNotifications = async (req, res) => {
  try {
    const user = await userModel.findById(req.body.userId).select('notifications');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, notifications: user.notifications });
  } catch (error) {
    console.error('Get notifications error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.body;
    const user = await userModel.findById(req.body.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const notif = user.notifications.find((n) => n.id === notificationId);
    if (notif) notif.read = true;

    await user.save();
    res.json({ success: true, notifications: user.notifications });
  } catch (error) {
    console.error('Mark notification error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
};

export {
  loginUser, registerUser, getUserProfile, updateProfile, changePassword,
  addAddress, editAddress, deleteAddress, getNotifications, markNotificationAsRead,
};