import React, { useState, useContext } from 'react';
import './Profile.css';
import Navbar from '../../components/Navbar/Navbar';
import { StoreContext } from '../../components/context/StoreContext';
import { Mail, Phone, MapPin, Edit3, Lock, Plus, LogOut, Star, Zap, Clock, CheckCircle } from 'lucide-react';

const Profile = () => {
  const { token, setToken } = useContext(StoreContext);
  const [darkMode, setDarkMode] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [profileImage, setProfileImage] = useState('https://i.ibb.co/RDkh4Cw/profile-default.jpg');

  const [userProfile, setUserProfile] = useState({
    firstName: 'Raj',
    lastName: 'Kumar',
    email: 'raj.kumar@example.com',
    phone: '+91 98765 43210',
    deliveryAddress: '123 Main Street, Apartment 4B, New Delhi - 110001',
    profileCompletion: 85,
    loyaltyPoints: 2450,
  });

  const [savedAddresses] = useState([
    {
      id: 1,
      type: 'Home',
      address: '123 Main Street, Apartment 4B, New Delhi - 110001',
      default: true,
    },
    {
      id: 2,
      type: 'Office',
      address: '456 Business Park, Delhi - 110002',
      default: false,
    },
    {
      id: 3,
      type: 'Other',
      address: '789 Shopping Mall, Gurgaon - 122001',
      default: false,
    },
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
    {
      id: 4,
      image: 'https://i.ibb.co/h8xJ7pV/rolls.jpg',
      name: 'Paneer Spring Rolls',
      price: '₹180',
      status: 'Cancelled',
      date: '2 weeks ago',
      restaurant: 'Asian Fusion',
    },
  ]);

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    window.location.href = '/home';
  };

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return '#10b981';
      case 'Pending':
        return '#f59e0b';
      case 'Cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Delivered':
        return <CheckCircle size={16} />;
      case 'Pending':
        return <Clock size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  return (
    <div className={`profile-container ${darkMode ? 'dark-mode' : ''}`}>
      <Navbar />

      {/* Dark Mode Toggle */}
      <div className="dark-mode-toggle">
        <button
          className={`toggle-btn ${darkMode ? 'active' : ''}`}
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Profile Header Section */}
      <div className="profile-header">
        <div className="header-bg-gradient"></div>

        <div className="profile-main">
          <div className="profile-image-container">
            <img src={profileImage} alt="Profile" className="profile-image" />
            <label className="upload-badge">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <span className="camera-icon">📷</span>
            </label>
          </div>

          <div className="profile-info-main">
            <h1 className="user-name">
              {userProfile.firstName} {userProfile.lastName}
            </h1>
            <p className="user-email">{userProfile.email}</p>

            <div className="profile-stats">
              <div className="stat-card">
                <Zap size={20} color="#ff6b35" />
                <span>{userProfile.loyaltyPoints}</span>
                <p>Points</p>
              </div>
              <div className="stat-card">
                <Star size={20} color="#ffc107" />
                <span>4.8</span>
                <p>Rating</p>
              </div>
              <div className="stat-card">
                <div className="orders-icon">🍔</div>
                <span>{recentOrders.length}</span>
                <p>Orders</p>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button className="btn-primary" onClick={() => setEditModal(true)}>
              <Edit3 size={18} /> Edit Profile
            </button>
            <button className="btn-secondary">
              <Lock size={18} /> Change Password
            </button>
            <button className="btn-logout" onClick={handleLogout}>
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Profile Completion Progress */}
      <div className="progress-card">
        <div className="progress-header">
          <h3>Profile Completion</h3>
          <span className="progress-percent">{userProfile.profileCompletion}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${userProfile.profileCompletion}%` }}
          ></div>
        </div>
        <p className="progress-text">
          Complete your profile to unlock special offers and rewards! 🎁
        </p>
      </div>

      <div className="profile-content">
        {/* Contact Information */}
        <div className="contact-section">
          <h2 className="section-title">Contact Information</h2>
          <div className="contact-grid">
            <div className="contact-card">
              <div className="contact-icon">
                <Mail size={24} color="#ff6b35" />
              </div>
              <div className="contact-details">
                <label>Email</label>
                <p>{userProfile.email}</p>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-icon">
                <Phone size={24} color="#ff6b35" />
              </div>
              <div className="contact-details">
                <label>Phone</label>
                <p>{userProfile.phone}</p>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-icon">
                <MapPin size={24} color="#ff6b35" />
              </div>
              <div className="contact-details">
                <label>Delivery Address</label>
                <p>{userProfile.deliveryAddress}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loyalty Rewards Card */}
        <div className="rewards-section">
          <div className="rewards-card">
            <div className="rewards-header">
              <h3>🎁 Loyalty Rewards</h3>
              <span className="rewards-badge">{userProfile.loyaltyPoints} Points</span>
            </div>
            <p className="rewards-text">
              You're just <strong>550 points</strong> away from unlocking a <strong>₹500 discount</strong>!
            </p>
            <div className="rewards-progress">
              <div className="rewards-bar">
                <div
                  className="rewards-fill"
                  style={{ width: `${(userProfile.loyaltyPoints / 3000) * 100}%` }}
                ></div>
              </div>
              <p className="rewards-milestone">
                {userProfile.loyaltyPoints} / 3000 points
              </p>
            </div>
          </div>
        </div>

        {/* Saved Addresses */}
        <div className="addresses-section">
          <div className="section-header">
            <h2 className="section-title">Saved Addresses</h2>
            <button className="btn-add">
              <Plus size={18} /> Add New
            </button>
          </div>

          <div className="addresses-grid">
            {savedAddresses.map((addr) => (
              <div key={addr.id} className="address-card">
                {addr.default && <div className="default-badge">Default</div>}
                <div className="address-type">{addr.type}</div>
                <p className="address-text">{addr.address}</p>
                <div className="address-actions">
                  <button className="btn-action">Edit</button>
                  <button className="btn-action-delete">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="orders-section">
          <div className="section-header">
            <h2 className="section-title">Recent Orders</h2>
            <a href="/orders" className="view-all">
              View All →
            </a>
          </div>

          <div className="orders-grid">
            {recentOrders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-image-container">
                  <img src={order.image} alt={order.name} className="order-image" />
                  <span
                    className="order-status-badge"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    <span className="status-icon">{getStatusIcon(order.status)}</span>
                    {order.status}
                  </span>
                </div>

                <div className="order-details">
                  <h4 className="order-name">{order.name}</h4>
                  <p className="order-restaurant">{order.restaurant}</p>

                  <div className="order-footer">
                    <div className="order-price-time">
                      <span className="order-price">{order.price}</span>
                      <span className="order-date">{order.date}</span>
                    </div>
                    <button className="btn-reorder">Reorder</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setEditModal(false)}>
              ✕
            </button>
            <h2>Edit Profile</h2>

            <form>
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  defaultValue={userProfile.firstName}
                  placeholder="Enter first name"
                />
              </div>

              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  defaultValue={userProfile.lastName}
                  placeholder="Enter last name"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  defaultValue={userProfile.email}
                  placeholder="Enter email"
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  defaultValue={userProfile.phone}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="form-group">
                <label>Delivery Address</label>
                <textarea
                  defaultValue={userProfile.deliveryAddress}
                  placeholder="Enter delivery address"
                  rows="4"
                ></textarea>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  onClick={() => setEditModal(false)}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
