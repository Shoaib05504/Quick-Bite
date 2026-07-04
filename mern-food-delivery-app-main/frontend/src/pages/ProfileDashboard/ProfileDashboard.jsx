import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import {
  FaUserAlt,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaEdit,
  FaLock,
  FaPlus,
  FaSignOutAlt,
  FaShoppingCart,
  FaTrashAlt,
  FaHome,
  FaBriefcase,
  FaGraduationCap,
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaBell,
  FaCog,
  FaShareAlt,
  FaDownload,
  FaGift,
  FaCoins,
  FaStar,
  FaWallet,
  FaHeart,
  FaArrowRight,
  FaRocketchat,
  FaRupeeSign,
  FaSearch
} from 'react-icons/fa';
import { profileAPI, addressAPI, notificationAPI, orderAPI } from '../../services/apiService';
import './ProfileDashboard.css';
import { StoreContext } from '../../components/context/StoreContext';

const fallbackProfileImage = 'https://i.ibb.co/RDkh4Cw/profile-default.jpg';
const tabOptions = [
  { key: 'overview', label: 'Overview' },
  { key: 'rewards', label: 'Rewards' },
  { key: 'addresses', label: 'Addresses' },
  { key: 'orders', label: 'Recent Orders' },
];

const iconMap = {
  Home: <FaHome size={18} />,
  Office: <FaBriefcase size={18} />,
  College: <FaGraduationCap size={18} />,
  Other: <FaMapMarkerAlt size={18} />,
};

const normalizeAddress = (address) => ({
  ...address,
  id: String(address.id || address._id || ''),
  icon: iconMap[address.type] || <FaMapMarkerAlt size={18} />,
});

const formatAddressLine = (address) => {
  if (!address) return null;
  const parts = [address.street, address.city, address.state].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
};

const tabContentVariants = {
  hidden: { opacity: 0, y: 30, rotateX: 10, scale: 0.97 },
  visible: { 
    opacity: 1, 
    y: 0, 
    rotateX: 0, 
    scale: 1, 
    transition: { 
      type: "spring",
      stiffness: 90,
      damping: 14,
      mass: 0.8
    } 
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    rotateX: -5, 
    scale: 0.97, 
    transition: { duration: 0.2 } 
  }
};

const ProfileDashboard = () => {
  const { token, setToken, addToCart, addItemsToCart, cartItems, food_list, url, setUserProfile: setGlobalUserProfile } = useContext(StoreContext);
  const [darkMode, setDarkMode] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [addressModal, setAddressModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const [userProfile, setUserProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    memberSince: '',
    memberBadge: 'Silver',
    profileImage: fallbackProfileImage,
    profileCompletion: 0,
    loyaltyPoints: 0,
    totalOrders: 0,
    ratings: 0,
    favoriteFood: '',
    totalSpent: '₹0',
  });

  const [editFormData, setEditFormData] = useState({
    firstName: userProfile.firstName,
    lastName: userProfile.lastName,
    email: userProfile.email,
    phone: userProfile.phone,
    profileImage: userProfile.profileImage,
  });

  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [addressFormData, setAddressFormData] = useState({
    type: 'Home',
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
  });

  const [addresses, setAddresses] = useState([]);

  const [recentOrders, setRecentOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const navigate = useNavigate();

  const [notificationItems, setNotificationItems] = useState([
    { id: 'notif-1', title: 'Order delivered', message: 'Your last order has arrived successfully.', read: false },
    { id: 'notif-2', title: 'New reward unlocked', message: 'You earned 120 points from your last order.', read: false },
    { id: 'notif-3', title: 'Special coupon', message: 'Get 15% off on your next premium order.', read: true },
  ]);

  const unreadCount = useMemo(() => notificationItems.filter((item) => !item.read).length, [notificationItems]);

  // 1. Total Orders: Count of non-cancelled orders
  const totalOrdersVal = useMemo(() => {
    return recentOrders.filter(order => order.status !== 'Cancelled').length;
  }, [recentOrders]);

  // 3. Total Spent: Sum of all non-cancelled order amounts
  const totalSpentVal = useMemo(() => {
    return recentOrders
      .filter(order => order.status !== 'Cancelled')
      .reduce((sum, order) => sum + (Number(order.amount) || 0), 0);
  }, [recentOrders]);

  // 2. Reward Points: 10% of total spent (plus base rewardPoints from DB if any)
  const rewardPointsVal = useMemo(() => {
    const basePoints = userProfile?.rewardPoints || 0;
    const earnedPoints = Math.round(totalSpentVal * 0.1);
    return basePoints + earnedPoints;
  }, [userProfile, totalSpentVal]);

  // 4. Favorite Food: Tallied from order items
  const favoriteFoodVal = useMemo(() => {
    const itemCounts = {};
    recentOrders.forEach((order) => {
      if (order.status !== 'Cancelled' && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (item.name) {
            itemCounts[item.name] = (itemCounts[item.name] || 0) + (item.quantity || 1);
          }
        });
      }
    });
    
    let fav = 'None';
    let maxCount = 0;
    Object.entries(itemCounts).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        fav = name;
      }
    });
    
    return fav !== 'None' ? fav : 'None yet';
  }, [recentOrders]);

  // 5. Ratings: Deterministic average based on order history count
  const ratingsVal = useMemo(() => {
    if (userProfile && userProfile.ratings && userProfile.ratings > 0) {
      return userProfile.ratings.toFixed(1);
    }
    if (recentOrders.length === 0) return 'N/A';
    const base = 4.3;
    const variance = (recentOrders.length * 7) % 8 * 0.1;
    return (base + variance).toFixed(1);
  }, [userProfile, recentOrders]);

  // 6. Membership badge: Silver for <=3 orders, Gold for <=12 orders, Premium for >12 orders
  const membershipVal = useMemo(() => {
    if (totalOrdersVal === 0) return 'Silver';
    if (totalOrdersVal <= 3) return 'Silver';
    if (totalOrdersVal <= 12) return 'Gold';
    return 'Premium';
  }, [totalOrdersVal]);

  // 7. Verified Status: true if user has email & phone
  const isVerifiedVal = useMemo(() => {
    return !!(userProfile && userProfile.email && userProfile.phone && userProfile.phone.trim() !== '');
  }, [userProfile]);

  const statistics = useMemo(() => [
    { icon: <FaShoppingCart size={22} />, label: 'Total Orders', value: String(totalOrdersVal), color: '#FF7A29' },
    { icon: <FaCoins size={22} />, label: 'Reward Points', value: rewardPointsVal.toLocaleString('en-IN'), color: '#F9C64D' },
    { icon: <FaStar size={22} />, label: 'Ratings', value: ratingsVal, color: '#9561F9' },
    { icon: <FaHeart size={22} />, label: 'Favorite Food', value: favoriteFoodVal, color: '#FF6B6B' },
    { icon: <FaWallet size={22} />, label: 'Total Spent', value: `₹${totalSpentVal.toLocaleString('en-IN')}`, color: '#36B1FF' },
  ], [totalOrdersVal, rewardPointsVal, ratingsVal, favoriteFoodVal, totalSpentVal]);

  useEffect(() => {
    if (token) {
      loadUserProfile();
      loadRecentOrders();
    }
  }, [token]);

  const formatOrderDate = (date) => {
    if (!date) return '';
    const orderDate = new Date(date);
    const now = new Date();
    const diffMs = now - orderDate;
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return orderDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const loadRecentOrders = async () => {
    setOrdersLoading(true);
    const response = await orderAPI.getUserOrders();
    if (response.success && Array.isArray(response.data)) {
      const sortedOrders = [...response.data].sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentOrders(sortedOrders);
    } else {
      setRecentOrders([]);
      if (!response.success) {
        toast.error(response.message || 'Failed to load your orders');
      }
    }
    setOrdersLoading(false);
  };

  // Greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const dailyOffer = useMemo(() => ({
    title: 'Today — 20% off on select meals',
    subtitle: 'Use code DELISH20. Free delivery over ₹399',
  }), []);

  const primaryAddress = useMemo(() => {
    const defaultAddr = addresses.find((addr) => addr.isDefault) || addresses[0];
    return formatAddressLine(defaultAddr);
  }, [addresses]);

  const loadUserProfile = async () => {
    setLoading(true);
    const response = await profileAPI.getProfile();
    if (response.success && response.user) {
      const user = {
        ...response.user,
        profileImage: response.user.profileImage || fallbackProfileImage,
      };
      setUserProfile(user);
      if (typeof setGlobalUserProfile === 'function') {
        setGlobalUserProfile(user);
      }
      setEditFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        profileImage: user.profileImage,
      });
      setAddresses((response.user.addresses ?? []).map(normalizeAddress));
    }
    setLoading(false);
  };

  const resolveImageSrc = (image) => {
    if (!image) return fallbackProfileImage;
    const normalized = String(image).trim();
    if (/^data:/i.test(normalized) || /^https?:\/\//i.test(normalized)) return normalized;
    if (normalized.startsWith('/')) return `${url || import.meta.env.VITE_API_URL || 'http://localhost:8000'}${normalized}`;
    return `${url || import.meta.env.VITE_API_URL || 'http://localhost:8000'}/images/${normalized}`;
  };

  const handleImageError = (event) => {
    event.target.src = fallbackProfileImage;
  };

  const formatMemberSince = (value) => {
    if (!value) return 'N/A';
    const normalized = String(value).trim();
    const isoMatch = normalized.match(/^\d{4}-\d{2}-\d{2}(T.*)?$/);
    if (isoMatch) {
      const date = new Date(isoMatch[0]);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
    }
    return normalized;
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFormData({
          ...editFormData,
          profileImage: reader.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editFormData.firstName || !editFormData.lastName) {
      toast.error('First name and last name are required');
      return;
    }
    setLoading(true);
    const loadingToast = toast.loading('Updating profile...');
    const response = await profileAPI.updateProfile({
      firstName: editFormData.firstName,
      lastName: editFormData.lastName,
      email: editFormData.email,
      phone: editFormData.phone,
      profileImage: editFormData.profileImage,
    });
    toast.dismiss(loadingToast);
    if (response.success && response.user) {
      const updatedUser = {
        ...response.user,
        profileImage: response.user.profileImage || fallbackProfileImage,
      };
      setUserProfile(updatedUser);
      if (typeof setGlobalUserProfile === 'function') {
        setGlobalUserProfile(updatedUser);
      }
      setEditFormData({
        firstName: updatedUser.firstName || '',
        lastName: updatedUser.lastName || '',
        email: updatedUser.email || '',
        phone: updatedUser.phone || '',
        profileImage: updatedUser.profileImage,
      });
      toast.success('Profile updated successfully');
      setEditModal(false);
    } else {
      toast.error(response.message || 'Failed to update profile');
    }
    setLoading(false);
  };

  const handlePasswordSubmit = async () => {
    if (!passwordFormData.currentPassword || !passwordFormData.newPassword || !passwordFormData.confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordFormData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    const loadingToast = toast.loading('Updating password...');
    const response = await profileAPI.changePassword({
      currentPassword: passwordFormData.currentPassword,
      newPassword: passwordFormData.newPassword,
      confirmPassword: passwordFormData.confirmPassword,
    });
    toast.dismiss(loadingToast);
    if (response.success) {
      toast.success('Password updated successfully');
      setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordModal(false);
    } else {
      toast.error(response.message || 'Failed to update password');
    }
    setLoading(false);
  };

  const handleAddAddress = async () => {
    if (!addressFormData.street || !addressFormData.city) {
      toast.error('Street and city are required');
      return;
    }
    setLoading(true);
    const loadingToast = toast.loading('Saving address...');
    const response = await addressAPI.addAddress(addressFormData);
    toast.dismiss(loadingToast);
    if (response.success) {
      const rawAddresses = response.addresses ?? [];
      setAddresses(rawAddresses.map(normalizeAddress));
      setUserProfile((prev) => ({
        ...prev,
        addresses: rawAddresses,
      }));
      if (typeof setGlobalUserProfile === 'function') {
        setGlobalUserProfile((prev) => ({
          ...prev,
          addresses: rawAddresses,
        }));
      }
      toast.success('Address saved');
      setAddressFormData({ type: 'Home', name: '', phone: '', street: '', city: '', state: '', pincode: '', landmark: '' });
      setAddressModal(false);
    } else {
      toast.error(response.message || 'Failed to save address');
    }
    setLoading(false);
  };

  const handleEditAddress = async () => {
    if (!editingAddressId) {
      toast.error('Could not identify the address to update');
      return;
    }
    if (!addressFormData.street || !addressFormData.city) {
      toast.error('Street and city are required');
      return;
    }
    setLoading(true);
    const loadingToast = toast.loading('Updating address...');
    const response = await addressAPI.editAddress({ addressId: String(editingAddressId), ...addressFormData });
    toast.dismiss(loadingToast);
    if (response.success) {
      const rawAddresses = response.addresses ?? [];
      setAddresses(rawAddresses.map(normalizeAddress));
      setUserProfile((prev) => ({
        ...prev,
        addresses: rawAddresses,
      }));
      if (typeof setGlobalUserProfile === 'function') {
        setGlobalUserProfile((prev) => ({
          ...prev,
          addresses: rawAddresses,
        }));
      }
      toast.success('Address updated');
      setEditingAddressId(null);
      setAddressFormData({ type: 'Home', name: '', phone: '', street: '', city: '', state: '', pincode: '', landmark: '' });
      setAddressModal(false);
    } else {
      toast.error(response.message || 'Failed to update address');
    }
    setLoading(false);
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Remove this address?')) {
      return;
    }
    setLoading(true);
    const loadingToast = toast.loading('Deleting address...');
    const response = await addressAPI.deleteAddress(addressId);
    toast.dismiss(loadingToast);
    if (response.success) {
      const rawAddresses = response.addresses ?? [];
      setAddresses(rawAddresses.map(normalizeAddress));
      setUserProfile((prev) => ({
        ...prev,
        addresses: rawAddresses,
      }));
      if (typeof setGlobalUserProfile === 'function') {
        setGlobalUserProfile((prev) => ({
          ...prev,
          addresses: rawAddresses,
        }));
      }
      toast.success('Address removed');
    } else {
      toast.error(response.message || 'Could not delete address');
    }
    setLoading(false);
  };

  const handleNotificationToggle = async () => {
    const newState = !showNotifications;
    setShowNotifications(newState);
    if (newState) {
      const response = await notificationAPI.getNotifications();
      if (response.success) {
        setNotificationItems(response.notifications || notificationItems);
      }
    }
  };

  const markNotificationRead = async (id) => {
    const response = await notificationAPI.markAsRead(id);
    if (response.success) {
      setNotificationItems(response.notifications || notificationItems);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userProfile');
    toast.success('Logged out successfully');
    window.location.href = '/home';
  };

  const handleReorder = async (order) => {
    if (!order?.items?.length) {
      toast.error('No items found in this order');
      return;
    }
    const added = await addItemsToCart(order.items);
    if (added) {
      toast.success('Items added to cart successfully');
    } else {
      toast.error('Could not add items to cart');
    }
  };

  const handleViewAllOrders = () => {
    navigate('/myorders');
  };

  const handleSupportClick = () => {
    toast.success('Support chat opening soon');
  };

  return (
    <div className={`profile-dashboard ${darkMode ? 'dark-mode' : ''}`}>
      <div className="dashboard-shell">
        <header className="premium-navbar">
          <div className="navbar-content">
            <span className="animated-welcome-text">
              👋 Welcome back, {userProfile.firstName || 'Guest'}! Manage your orders, rewards, and favourites in one place.
            </span>
            <div className="icon-group">
              <button type="button" className="icon-button" onClick={handleNotificationToggle}>
                <FaBell size={18} />
                {unreadCount > 0 && <span className="icon-badge">{unreadCount}</span>}
              </button>
              <button type="button" className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
          <AnimatePresence>
            {showNotifications && (
              <motion.div className="notification-panel" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="notification-header">
                  <h4>Notifications</h4>
                  <span>{unreadCount} unread</span>
                </div>
                <div className="notification-list">
                  {notificationItems.map((notification) => (
                    <button key={notification.id} type="button" className={`notification-item ${notification.read ? 'read' : 'unread'}`} onClick={() => markNotificationRead(notification.id)}>
                      <div>
                        <strong>{notification.title}</strong>
                        <p>{notification.message}</p>
                      </div>
                      {!notification.read && <span className="dot" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

<div className="top-offer-banner">
  <h3>🔥 Flat 50% OFF on First Order</h3>

  <p>
    Enjoy delicious meals with super fast delivery only on QuickBite.
  </p>
</div>

<section className="hero-section">
          <motion.div className="hero-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="hero-left">
              <div className="hero-tag">Premium Dashboard</div>
              <h1>Welcome back, {userProfile.firstName}</h1>
              <p>Manage your profile, orders and rewards with a sleek futuristic interface.</p>
              <div className="hero-meta">
                <div>
                  <span>Member since</span>
                  <strong>{formatMemberSince(userProfile.memberSince)}</strong>
                </div>
                <div>
                  <span>Membership</span>
                  <strong>{membershipVal}</strong>
                </div>
              </div>
            </div>
            <div className="hero-right">
              <div className="hero-avatar-card">
                <img src={resolveImageSrc(userProfile.profileImage)} alt="Profile" onError={handleImageError} />
                <div className="avatar-ring" />
              </div>
              <div className="hero-actions">
                <button className="btn btn-primary" onClick={() => setEditModal(true)}><FaEdit /> Edit Profile</button>
                 <button className="btn btn-secondary" style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: '#ffffff', border: 'none' }} onClick={() => setPasswordModal(true)}><FaLock /> Change Password</button>
              </div>
            </div>
          </motion.div>
        </section>
        <section className="dashboard-grid">
          <motion.div 
            className="profile-panel glass-card" 
            initial={{ opacity: 0, y: 40, rotateX: 12, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }} 
            transition={{ type: "spring", stiffness: 85, damping: 13, delay: 0.1 }}
            style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
          >
            <div className="panel-header">
              <div>
                <p className="panel-label">Profile Snapshot</p>
                <h2>{userProfile.firstName} {userProfile.lastName}</h2>
              </div>
              <button className="secondary-pill">{isVerifiedVal ? 'Verified' : 'Unverified'}</button>
            </div>
            <div className="profile-details">
              <div><FaUserAlt className="detail-icon" /><span>{userProfile.email}</span></div>
              <div><FaPhoneAlt className="detail-icon" /><span>{userProfile.phone}</span></div>
              <div><FaMapMarkerAlt className="detail-icon" /><span>{primaryAddress || 'No saved address yet'}</span></div>
            </div>
            <div className="panel-progress">
              <div className="progress-heading"><span>Profile Strength</span><strong>{userProfile.profileCompletion}%</strong></div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${userProfile.profileCompletion}%` }} /></div>
              <p className="progress-description">Complete your profile to unlock faster orders and premium offers.</p>
            </div>
          </motion.div>
          <motion.div 
            className="stats-panel" 
            initial={{ opacity: 0, y: 40, rotateX: 12, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }} 
            transition={{ type: "spring", stiffness: 85, damping: 13, delay: 0.2 }}
            style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
          >
            <div className="stats-grid">
              {statistics.map((stat, index) => (
                <motion.div 
                  key={stat.label} 
                  className="stat-card" 
                  style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
                  initial={{ opacity: 0, scale: 0.8, rotateY: 15 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  transition={{ type: "spring", stiffness: 100, damping: 12, delay: 0.3 + index * 0.08 }}
                  whileHover={{ y: -6, scale: 1.02, rotateX: 1.5, rotateY: -1.5, transition: { duration: 0.2 } }}
                >
                  <div className="stat-icon-wrap" style={{ background: `${stat.color}20`, color: stat.color }}>{stat.icon}</div>
                  <div><p>{stat.label}</p><h3>{stat.value}</h3></div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
        <section className="tab-panel">
          <div className="tab-list">
            {tabOptions.map((tab) => (
              <motion.button 
                key={tab.key} 
                className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`} 
                onClick={() => setActiveTab(tab.key)}
                style={{ position: 'relative', transformStyle: 'preserve-3d', perspective: 1000 }}
                whileHover={{ y: -3, scale: 1.02, rotateX: 2, rotateY: -2, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.96, translateZ: -5 }}
              >
                {activeTab === tab.key && (
                  <motion.span 
                    layoutId="activeTabBg" 
                    className="active-tab-bg" 
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(135deg, #ff8c42, #ffb86d)',
                      borderRadius: '20px',
                      boxShadow: '0 8px 24px rgba(255, 129, 81, 0.28)',
                      zIndex: -1
                    }} 
                  />
                )}
                {tab.label}
              </motion.button>
            ))}
          </div>
        </section>
        <section className="tab-content-area">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" className="tab-content" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" style={{ transformStyle: 'preserve-3d', perspective: 1000 }}>
                <div className="overview-grid">
                  <motion.div 
                    className="glass-card overview-card"
                    style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
                    initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
                    animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                    transition={{ type: "spring", stiffness: 95, damping: 13, delay: 0.1 }}
                    whileHover={{ scale: 1.01, rotateX: 1, rotateY: -1, transition: { duration: 0.2 } }}
                  >
                    <div className="overview-header"><div><p className="panel-label">Rewards Summary</p><h2>Points balance</h2></div><div className="badge-pill">{membershipVal} Tier</div></div>
                    <div className="reward-total"><FaGift size={28} /><div><h3>{rewardPointsVal.toLocaleString('en-IN')}</h3><span>QuickBite points</span></div></div>
                    <div className="reward-progress"><div className="reward-bar"><div className="reward-bar-fill" style={{ width: `${Math.min((rewardPointsVal / 3000) * 100, 100)}%` }} /></div><p>Earn {Math.max(0, 3000 - rewardPointsVal)} more points for a ₹200 coupon.</p></div>
                    <div className="overview-actions"><button className="btn btn-primary" onClick={() => toast('Redeem feature coming soon')}><FaCoins /> Redeem</button><button className="btn btn-secondary" style={{ background: 'linear-gradient(135deg, #F59E0B, #FF7A35)', color: '#ffffff', border: 'none' }} onClick={() => toast('View coupons coming soon')}><FaArrowRight /> Coupons</button></div>
                  </motion.div>
                  <motion.div 
                    className="glass-card orders-summary"
                    style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
                    initial={{ opacity: 0, scale: 0.9, rotateX: -10 }}
                    animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                    transition={{ type: "spring", stiffness: 95, damping: 13, delay: 0.2 }}
                    whileHover={{ scale: 1.01, rotateX: 1, rotateY: -1, transition: { duration: 0.2 } }}
                  >
                    <div className="overview-header"><div><p className="panel-label">Recent Orders</p><h2>Delivered items</h2></div><span className="status-pill">Latest 3</span></div>
                    {ordersLoading ? (
                      <div className="empty-state"><h3>Loading orders...</h3></div>
                    ) : recentOrders.length === 0 ? (
                      <div className="empty-state"><h3>No orders found.</h3></div>
                    ) : (
                      <div className="orders-grid">
                        {recentOrders.slice(0, 3).map((order) => {
                          const item = order.items?.[0] || {};
                          const orderId = order._id || order.id;
                          const isSavedDelivered = localStorage.getItem(`track_order_status_${orderId}`) === 'Delivered';
                          const displayStatus = isSavedDelivered ? 'Delivered' : (order.status || 'Processing');
                          return (
                            <motion.div key={orderId} className="order-card" whileHover={{ y: -6 }}>
                              <img src={resolveImageSrc(item.image || fallbackProfileImage)} alt={item.name || 'Order item'} onError={handleImageError} />
                              <div className="order-info"><h4>{item.name || 'Order item'}</h4><p>{item.restaurant || 'QuickBite'}</p><div className="order-meta"><span className={`badge-status ${String(displayStatus).toLowerCase().includes('deliver') ? 'delivered' : 'processing'}`}>{displayStatus}</span><span>{formatOrderDate(order.date)}</span></div></div>
                              <div className="order-action"><span className="price"><FaRupeeSign size={12} /> {order.amount?.toFixed ? order.amount.toFixed(0) : order.amount}</span><button className="btn btn-secondary small" style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: '#ffffff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '10px' }} onClick={() => handleReorder(order)}>Reorder</button></div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            )}
            {activeTab === 'rewards' && (
              <motion.div key="rewards" className="tab-content" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" style={{ transformStyle: 'preserve-3d', perspective: 1000 }}>
                <div className="rewards-grid">
                  <motion.div 
                    className="glass-card reward-card"
                    style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
                    initial={{ opacity: 0, scale: 0.8, rotateY: 15 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 12, delay: 0.1 }}
                    whileHover={{ scale: 1.01, rotateX: 1, rotateY: -1, transition: { duration: 0.2 } }}
                  >
                    <div className="reward-header"><div><p className="panel-label">Level</p><h2>{membershipVal} Member</h2></div><FaStar className="reward-icon" size={24} /></div>
                    <p>Enjoy priority delivery, exclusive offers and premium support.</p>
                    <div className="reward-list"><span>Free delivery over ₹499</span><span>Exclusive badges unlocked</span><span>Birthday surprise rewards</span></div>
                  </motion.div>
                  <motion.div 
                    className="glass-card coupon-card"
                    style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
                    initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 12, delay: 0.2 }}
                    whileHover={{ scale: 1.01, rotateX: 1, rotateY: -1, transition: { duration: 0.2 } }}
                  >
                    <div className="coupon-header"><div><p className="panel-label">Available Coupon</p><span className="coupon-code">SAVE15</span></div></div>
                    <h3>15% off on next order</h3>
                    <p>Apply this coupon at checkout for instant savings.</p>
                    <button className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #F59E0B, #FF7A35)', color: '#ffffff', border: 'none' }} onClick={() => toast('Coupon copied!')}>Copy Code</button>
                  </motion.div>
                </div>
              </motion.div>
            )}
            {activeTab === 'addresses' && (
              <motion.div key="addresses" className="tab-content" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" style={{ transformStyle: 'preserve-3d', perspective: 1000 }}>
                <div className="address-controls"><div><p className="panel-label">Delivery Addresses</p><h2>Saved locations</h2></div><button className="btn btn-primary" onClick={() => { setEditingAddressId(null); setAddressFormData({ type: 'Home', name: '', phone: '', street: '', city: '', state: '', pincode: '', landmark: '' }); setAddressModal(true); }}><FaPlus /> Add address</button></div>
                <div className="address-grid">
                  {addresses.length === 0 ? (
                    <div className="empty-state"><FaMapMarkerAlt size={48} /><h3>No saved addresses yet</h3><p>Add a delivery address to speed up checkout.</p></div>
                  ) : addresses.map((addr, index) => (
                    <motion.div 
                      key={addr.id} 
                      className="address-card" 
                      style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
                      initial={{ opacity: 0, rotateY: 90, scale: 0.85 }}
                      animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 100, damping: 13, delay: index * 0.08 }}
                      whileHover={{ y: -6, scale: 1.01, rotateX: 1.5, rotateY: -1.5, transition: { duration: 0.2 } }}
                      layout
                    >
                      <div className="address-card-top"><div className="icon-circle">{addr.icon || iconMap[addr.type] || <FaMapMarkerAlt size={18} />}</div><div><h4>{addr.type}</h4><p>{addr.street}</p></div></div>
                      <div className="address-card-footer"><span>{addr.city}, {addr.state}</span><div className="address-actions"><button className="btn btn-secondary small" style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: '#ffffff', border: 'none', padding: '0.5rem 0.9rem', borderRadius: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)', transition: 'transform 0.2s ease' }} onClick={() => { setEditingAddressId(String(addr.id)); setAddressFormData({ type: addr.type || 'Home', name: addr.name || '', phone: addr.phone || '', street: addr.street || '', city: addr.city || '', state: addr.state || '', pincode: addr.pincode || '', landmark: addr.landmark || '' }); setAddressModal(true); }}><FaEdit size={14} /> Edit</button><button className="btn btn-tertiary small" onClick={() => handleDeleteAddress(String(addr.id))}>Delete</button></div></div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
            {activeTab === 'orders' && (
              <motion.div key="orders" className="tab-content" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" style={{ transformStyle: 'preserve-3d', perspective: 1000 }}>
                <div className="orders-view"><div className="orders-header"><div><p className="panel-label">Order History</p><h2>Recent deliveries</h2></div><button className="btn btn-secondary" style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: '#ffffff', border: 'none', padding: '0.5rem 1rem', borderRadius: '12px' }} onClick={handleViewAllOrders}>View all</button></div>
                  <div className="orders-grid-large">
                    {ordersLoading ? (
                      <div className="empty-state"><h3>Loading orders...</h3></div>
                    ) : recentOrders.length === 0 ? (
                      <div className="empty-state"><h3>No orders found.</h3></div>
                    ) : (
                      recentOrders.map((order, index) => {
                        const item = order.items?.[0] || {};
                        const orderId = order._id || order.id;
                        const isSavedDelivered = localStorage.getItem(`track_order_status_${orderId}`) === 'Delivered';
                        const displayStatus = isSavedDelivered ? 'Delivered' : (order.status || 'Processing');
                        return (
                          <motion.div 
                            key={orderId} 
                            className="order-card-large" 
                            style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
                            initial={{ opacity: 0, x: -60, rotateY: 15, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, rotateY: 0, scale: 1 }}
                            transition={{ type: "spring", stiffness: 95, damping: 14, delay: index * 0.08 }}
                            whileHover={{ y: -6, scale: 1.005, rotateX: 0.8, rotateY: -0.8, transition: { duration: 0.2 } }}
                          >
                            <img src={resolveImageSrc(item.image || fallbackProfileImage)} alt={item.name || 'Order item'} onError={handleImageError} />
                            <div className="order-content"><h3>{item.name || 'Order item'}</h3><p>{item.restaurant || 'QuickBite'}</p><div className="order-row"><span className={`badge-status ${String(displayStatus).toLowerCase().includes('deliver') ? 'delivered' : 'processing'}`}>{displayStatus}</span><span>{formatOrderDate(order.date)}</span></div><div className="order-meta-row"><strong>₹{order.amount?.toFixed ? order.amount.toFixed(0) : order.amount}</strong><button className="btn btn-primary small" style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: '#ffffff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '10px' }} onClick={() => handleReorder(order)}>Reorder</button></div></div>
                          </motion.div>
                        );
                      })
                    )}
                  </div></div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
        <footer className="dashboard-footer"><div><p>QuickBite • Premium food delivery dashboard</p></div><div><span>Designed for modern dining experiences</span></div></footer>
      </div>
      <button className="support-chat-btn" onClick={handleSupportClick}><FaRocketchat size={18} /><span>Live support</span></button>
      <AnimatePresence>
        {editModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-card" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
              <div className="modal-header"><div><h3>Edit Profile</h3><p>Update your personal information and profile image.</p></div><button type="button" className="close-button" onClick={() => setEditModal(false)}>×</button></div>
              <div className="modal-body"><div className="avatar-edit"><img src={resolveImageSrc(editFormData.profileImage || fallbackProfileImage)} alt="Profile preview" onError={handleImageError} /><label className="upload-label"><input type="file" accept="image/*" onChange={handleImageUpload} />Upload image</label></div><div className="modal-form"><div className="form-row"><label>First name</label><input value={editFormData.firstName} onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })} /></div><div className="form-row"><label>Last name</label><input value={editFormData.lastName} onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })} /></div><div className="form-row"><label>Email</label><input value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} /></div><div className="form-row"><label>Phone</label><input value={editFormData.phone} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} /></div></div></div>
              <div className="modal-footer"><button className="btn btn-tertiary" onClick={() => setEditModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleUpdateProfile} disabled={loading}>{loading ? <FaSpinner className="spinner" /> : 'Save changes'}</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {passwordModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-card" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
              <div className="modal-header"><div><h3>Change Password</h3><p>Keep your account secure with a strong password.</p></div><button type="button" className="close-button" onClick={() => setPasswordModal(false)}>×</button></div>
              <div className="modal-body"><div className="modal-form"><div className="form-row"><label>Current password</label><div className="password-input"><input type={showPassword ? 'text' : 'password'} value={passwordFormData.currentPassword} onChange={(e) => setPasswordFormData({ ...passwordFormData, currentPassword: e.target.value })} /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <FaEyeSlash /> : <FaEye />}</button></div></div><div className="form-row"><label>New password</label><div className="password-input"><input type={showNewPassword ? 'text' : 'password'} value={passwordFormData.newPassword} onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })} /><button type="button" onClick={() => setShowNewPassword(!showNewPassword)}>{showNewPassword ? <FaEyeSlash /> : <FaEye />}</button></div></div><div className="form-row"><label>Confirm password</label><div className="password-input"><input type={showConfirmPassword ? 'text' : 'password'} value={passwordFormData.confirmPassword} onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })} /><button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <FaEyeSlash /> : <FaEye />}</button></div></div></div></div>
              <div className="modal-footer"><button className="btn btn-tertiary" onClick={() => setPasswordModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handlePasswordSubmit} disabled={loading}>{loading ? <FaSpinner className="spinner" /> : 'Update password'}</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {addressModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-card" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
              <div className="modal-header"><div><h3>{editingAddressId ? 'Edit Address' : 'Add Address'}</h3><p>Save your delivery locations for faster checkout.</p></div><button type="button" className="close-button" onClick={() => setAddressModal(false)}>×</button></div>
              <div className="modal-body"><div className="modal-form"><div className="form-row"><label>Address type</label><select value={addressFormData.type} onChange={(e) => setAddressFormData({ ...addressFormData, type: e.target.value })}><option>Home</option><option>Office</option><option>College</option><option>Other</option></select></div><div className="form-row"><label>Name</label><input value={addressFormData.name} onChange={(e) => setAddressFormData({ ...addressFormData, name: e.target.value })} /></div><div className="form-row"><label>Phone</label><input value={addressFormData.phone} onChange={(e) => setAddressFormData({ ...addressFormData, phone: e.target.value })} /></div><div className="form-row"><label>Street</label><input value={addressFormData.street} onChange={(e) => setAddressFormData({ ...addressFormData, street: e.target.value })} /></div><div className="form-row"><label>City</label><input value={addressFormData.city} onChange={(e) => setAddressFormData({ ...addressFormData, city: e.target.value })} /></div><div className="form-row"><label>State</label><input value={addressFormData.state} onChange={(e) => setAddressFormData({ ...addressFormData, state: e.target.value })} /></div><div className="form-row"><label>Pincode</label><input value={addressFormData.pincode} onChange={(e) => setAddressFormData({ ...addressFormData, pincode: e.target.value })} /></div><div className="form-row"><label>Landmark</label><input value={addressFormData.landmark} onChange={(e) => setAddressFormData({ ...addressFormData, landmark: e.target.value })} /></div></div></div>
              <div className="modal-footer"><button className="btn btn-tertiary" onClick={() => setAddressModal(false)}>Cancel</button><button className="btn btn-primary" onClick={editingAddressId ? handleEditAddress : handleAddAddress} disabled={loading}>{loading ? <FaSpinner className="spinner" /> : editingAddressId ? 'Save Changes' : 'Add address'}</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <Toaster position="top-right" />
    </div>
  );
};

export default ProfileDashboard;
