import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { FaUser, FaPhone, FaMapMarker, FaEdit, FaLock, FaPlus, FaSignOutAlt, FaStar, FaBolt, FaClock, FaCheckCircle, FaBell, FaCog, FaShare, FaDownload, FaShoppingCart, FaTrash, FaHome, FaBriefcase, FaGraduationCap } from 'react-icons/fa';
import './ProfileDashboard.css';
import { StoreContext } from '../../components/context/StoreContext';

const ProfileDashboard = () => {
  const { token, setToken } = useContext(StoreContext);
  const [darkMode, setDarkMode] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [profileImage, setProfileImage] = useState('https://i.ibb.co/RDkh4Cw/profile-default.jpg');
  const [notifications, setNotifications] = useState(3);
  const [activeTab, setActiveTab] = useState('overview');

  const [userProfile, setUserProfile] = useState({
    firstName: 'Raj',
    lastName: 'Kumar',
    email: 'raj.kumar@example.com',
    phone: '+91 98765 43210',
    memberSince: 'Jan 2023',
    memberBadge: 'Gold',
    deliveryAddress: '123 Main Street, Apartment 4B, New Delhi - 110001',
    profileCompletion: 85,
    loyaltyPoints: 2450,
    totalOrders: 24,
    ratings: 4.8,
    favoriteCategory: 'Biryani',
  });

  const [statistics] = useState([
    { icon: '📦', label: 'Total Orders', value: '24', color: '#ff6b35' },
    { icon: '⚡', label: 'Reward Points', value: '2,450', color: '#f7931e' },
    { icon: '⭐', label: 'Rating', value: '4.8', color: '#fbbf24' },
    { icon: '🍔', label: 'Favorite', value: 'Biryani', color: '#ff8c42' },
  ]);

  const [recentOrders] = useState([
    {
      id: 1,
      image: 'https://i.ibb.co/9p6MxBr/biryani.jpg',
      name: 'Hyderabadi Biryani',
      price: '₹280',
      status: 'Delivered',
      date: '2 days ago',
      restaurant: 'Spice Palace',
    },
    {
      id: 2,
      image: 'https://i.ibb.co/1J4gPXf/pizza.jpg',
      name: 'Margherita Pizza',
      price: '₹420',
      status: 'Delivered',
      date: '5 days ago',
      restaurant: 'The Pizza House',
    },
    {
      id: 3,
      image: 'https://i.ibb.co/nBGbGXr/burger.jpg',
      name: 'Grilled Chicken Burger',
      price: '₹320',
      status: 'Delivered',
      date: '1 week ago',
      restaurant: 'Burger Station',
    },
  ]);

  const [savedAddresses] = useState([
    { id: 1, type: 'Home', address: '123 Main Street, Delhi', icon: <FaHome />, emoji: '🏠' },
    { id: 2, type: 'College', address: '456 Campus Road, Delhi', icon: <FaGraduationCap />, emoji: '🎓' },
    { id: 3, type: 'Office', address: '789 Business Park, Gurgaon', icon: <FaBriefcase />, emoji: '💼' },
  ]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const handleChangePassword = () => {
    setPasswordModal(true);
  };

  const handleRedeemPoints = () => {
    toast.success('Redeem Points functionality coming soon!', {
      duration: 3000,
      position: 'top-right',
    });
  };

  const handleViewCoupons = () => {
    toast.success('View Coupons functionality coming soon!', {
      duration: 3000,
      position: 'top-right',
    });
  };

  const handleReorder = (orderId) => {
    toast.success(`Reordering item ${orderId}`, {
      duration: 3000,
      position: 'top-right',
    });
  };

  const handleAddAddress = () => {
    toast.success('Add New Address functionality coming soon!', {
      duration: 3000,
      position: 'top-right',
    });
  };

  const handleEditAddress = (id) => {
    toast.success(`Editing address ${id}`, {
      duration: 3000,
      position: 'top-right',
    });
  };

  const handleDeleteAddress = (id) => {
    toast.success(`Deleting address ${id}`, {
      duration: 3000,
      position: 'top-right',
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    toast.success('Search functionality coming soon!', {
      duration: 3000,
      position: 'top-right',
    });
  };

  const handleNotification = () => {
    toast.success('You have 3 new notifications!', {
      duration: 3000,
      position: 'top-right',
    });
  };

  const handleSettings = () => {
    toast.success('Settings panel coming soon!', {
      duration: 3000,
      position: 'top-right',
    });
  };

  const handleShare = () => {
    toast.success('Share functionality coming soon!', {
      duration: 3000,
      position: 'top-right',
    });
  };

  const handleDownload = () => {
    toast.success('Download functionality coming soon!', {
      duration: 3000,
      position: 'top-right',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return '#10b981';
      case 'Preparing':
        return '#f59e0b';
      case 'Cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className={`profile-dashboard ${darkMode ? 'dark-mode' : ''}`}>
      {/* Floating Background Elements */}
      <div className="floating-shapes">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="floating-icon icon-1">🍕</div>
        <div className="floating-icon icon-2">🍔</div>
        <div className="floating-icon icon-3">🍜</div>
        <div className="floating-icon icon-4">🍣</div>
      </div>

      {/* Premium Navbar */}
      <nav className="premium-navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <div className="brand-logo">Q</div>
            <span className="brand-text">QuickBite</span>
          </div>

          <ul className="navbar-menu">
            <li><a href="#home">Home</a></li>
            <li><a href="#menu">Explore</a></li>
            <li><a href="#orders">Orders</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>

          <div className="navbar-right">
            <form className="search-bar" onSubmit={handleSearch}>
              <input type="text" placeholder="Search restaurants..." />
              <span className="search-icon">🔍</span>
            </form>

            <div className="navbar-icons">
              <motion.div 
                className="icon-wrapper notification" 
                onClick={handleNotification}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaBell size={20} />
                {notifications > 0 && <span className="badge">{notifications}</span>}
              </motion.div>
              <motion.div 
                className="icon-wrapper" 
                onClick={handleSettings}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaCog size={20} />
              </motion.div>
            </div>

            <button className="dark-toggle" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-gradient"></div>
        <div className="hero-content">
          <h1>Welcome back, {userProfile.firstName}! 👋</h1>
          <p>Manage your profile and track your food delivery journey</p>
        </div>
      </div>

      {/* Main Profile Card */}
      <motion.div 
        className="profile-wrapper"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div 
          className="profile-card glassmorphic"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.01 }}
        >
          <div className="profile-header-section">
            <div className="profile-image-wrapper">
              <img src={profileImage} alt="Profile" className="profile-image" />
              <label className="upload-overlay">
                <input type="file" accept="image/*" onChange={handleImageUpload} />
                <span className="upload-icon">📷</span>
              </label>
              <div className={`member-badge ${userProfile.memberBadge.toLowerCase()}`}>
                {userProfile.memberBadge}
              </div>
            </div>

            <div className="profile-info">
              <h1 className="profile-name">{userProfile.firstName} {userProfile.lastName}</h1>
              <p className="member-since">Member since {userProfile.memberSince}</p>

              <div className="contact-info">
                <span><FaUser size={16} /> {userProfile.email}</span>
                <span><FaPhone size={16} /> {userProfile.phone}</span>
              </div>

              <div className="profile-actions">
                <motion.button 
                  className="btn-primary" 
                  onClick={() => setEditModal(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaEdit size={16} /> Edit Profile
                </motion.button>
                <motion.button 
                  className="btn-secondary" 
                  onClick={handleChangePassword}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaLock size={16} /> Change Password
                </motion.button>
                <motion.button 
                  className="btn-logout" 
                  onClick={handleLogout}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaSignOutAlt size={16} /> Logout
                </motion.button>
              </div>
            </div>

            <div className="share-section">
              <motion.button 
                className="btn-icon" 
                onClick={handleShare}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaShare size={18} />
              </motion.button>
              <motion.button 
                className="btn-icon" 
                onClick={handleDownload}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaDownload size={18} />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div 
          className="stats-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="stats-grid">
            {statistics.map((stat, index) => (
              <div key={index} className="stat-card glassmorphic" style={{ '--stat-color': stat.color }}>
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-content">
                  <p className="stat-label">{stat.label}</p>
                  <h3 className="stat-value">{stat.value}</h3>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Progress Section */}
        <motion.div 
          className="progress-section glassmorphic"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="progress-header">
            <h3>Profile Strength</h3>
            <span className="progress-percent">{userProfile.profileCompletion}%</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${userProfile.profileCompletion}%` }}></div>
            </div>
          </div>
          <p className="progress-hint">Complete your profile to unlock exclusive offers! 🎁</p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div 
          className="tab-navigation"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <motion.button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} 
            onClick={() => setActiveTab('overview')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Overview
          </motion.button>
          <motion.button 
            className={`tab-btn ${activeTab === 'rewards' ? 'active' : ''}`} 
            onClick={() => setActiveTab('rewards')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Rewards
          </motion.button>
          <motion.button 
            className={`tab-btn ${activeTab === 'addresses' ? 'active' : ''}`} 
            onClick={() => setActiveTab('addresses')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Addresses
          </motion.button>
        </motion.div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <motion.div 
            className="tab-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            key="overview"
          >
            {/* Rewards Card */}
            <div className="rewards-card premium-gradient">
              <div className="rewards-header">
                <div>
                  <h3>💎 QuickBite Rewards</h3>
                  <p>Earn points on every order</p>
                </div>
                <span className="points-badge">{userProfile.loyaltyPoints} pts</span>
              </div>
              <div className="rewards-progress">
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${(userProfile.loyaltyPoints / 3000) * 100}%` }}></div>
                </div>
                <p className="milestone-text">550 points away from ₹500 discount! 🎉</p>
              </div>
              <div className="rewards-footer">
                <motion.button 
                  className="btn-rewards" 
                  onClick={handleRedeemPoints}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Redeem Points
                </motion.button>
                <motion.button 
                  className="btn-rewards-secondary" 
                  onClick={handleViewCoupons}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View Coupons
                </motion.button>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="orders-section">
              <div className="section-header">
                <h2>Recent Orders</h2>
                <a href="/myorders" className="view-all">View All →</a>
              </div>
              <div className="orders-carousel">
                {recentOrders.map((order) => (
                  <div key={order.id} className="order-card glassmorphic">
                    <div className="order-image">
                      <img src={order.image} alt={order.name} />
                      <span className="status-badge" style={{ backgroundColor: getStatusColor(order.status) }}>
                        {order.status}
                      </span>
                    </div>
                    <div className="order-info">
                      <h4>{order.name}</h4>
                      <p className="restaurant">{order.restaurant}</p>
                      <p className="date">{order.date}</p>
                      <div className="order-footer">
                        <span className="price">{order.price}</span>
                        <motion.button 
                          className="btn-reorder" 
                          onClick={() => handleReorder(order.id)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <FaShoppingCart size={14} /> Reorder
                        </motion.button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'rewards' && (
          <motion.div 
            className="tab-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            key="rewards"
          >
            <div className="rewards-detail glassmorphic">
              <h2>Your Loyalty Rewards</h2>
              <div className="rewards-info">
                <div className="reward-item">
                  <span className="reward-icon">⭐</span>
                  <div>
                    <h4>Gold Member</h4>
                    <p>Unlock premium benefits and exclusive offers</p>
                  </div>
                </div>
                <div className="reward-item">
                  <span className="reward-icon">🎁</span>
                  <div>
                    <h4>Special Offers</h4>
                    <p>Get 10% off on all orders this month</p>
                  </div>
                </div>
                <div className="reward-item">
                  <span className="reward-icon">🚀</span>
                  <div>
                    <h4>Free Delivery</h4>
                    <p>Enjoy free delivery on orders above ₹500</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'addresses' && (
          <motion.div 
            className="tab-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            key="addresses"
          >
            <div className="addresses-section">
              <div className="section-header">
                <h2>Saved Addresses</h2>
                <motion.button 
                  className="btn-add-address" 
                  onClick={handleAddAddress}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaPlus size={18} /> Add New
                </motion.button>
              </div>
              <div className="addresses-grid">
                {savedAddresses.map((addr) => (
                  <motion.div 
                    key={addr.id} 
                    className="address-card glassmorphic"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: addr.id * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="address-emoji">{addr.icon}</div>
                    <h4>{addr.type}</h4>
                    <p>{addr.address}</p>
                    <div className="address-actions">
                      <motion.button 
                        className="btn-small" 
                        onClick={() => handleEditAddress(addr.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Edit
                      </motion.button>
                      <motion.button 
                        className="btn-small-danger" 
                        onClick={() => handleDeleteAddress(addr.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FaTrash size={12} />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Edit Profile Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div className="modal-content glassmorphic" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setEditModal(false)}>✕</button>
            <h2>Edit Your Profile</h2>
            <form className="edit-form">
              <div className="form-group">
                <label>First Name</label>
                <input type="text" defaultValue={userProfile.firstName} />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" defaultValue={userProfile.lastName} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" defaultValue={userProfile.email} />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" defaultValue={userProfile.phone} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" onClick={() => setEditModal(false)}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {passwordModal && (
        <div className="modal-overlay" onClick={() => setPasswordModal(false)}>
          <div className="modal-content glassmorphic" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setPasswordModal(false)}>✕</button>
            <h2>Change Password</h2>
            <form className="edit-form">
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" placeholder="Enter current password" />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" placeholder="Enter new password" />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" placeholder="Confirm new password" />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setPasswordModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" onClick={() => { alert('Password changed successfully!'); setPasswordModal(false); }}>
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="premium-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>QuickBite</h4>
            <p>Premium Food Delivery Experience</p>
          </div>
          <div className="footer-links">
            <a href="#help">Help & Support</a>
            <a href="#terms">Terms & Conditions</a>
            <a href="#privacy">Privacy Policy</a>
          </div>
          <div className="footer-social">
            <span>Follow Us</span>
            <div className="social-icons">
              <a href="#fb">f</a>
              <a href="#tw">𝕏</a>
              <a href="#ig">📷</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Toaster for notifications */}
      <Toaster />
    </div>
  );
};

export default ProfileDashboard;
