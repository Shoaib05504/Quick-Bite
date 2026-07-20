import React, { useContext, useState } from 'react'
import './Navbar.css'
import { assets } from './../../assets/assets';
import { Link, useNavigate } from 'react-router-dom'
import { StoreContext } from './../context/StoreContext';
import { FaShoppingCart } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ChefHat, Smartphone, MessageSquare, Users } from 'lucide-react';

const menuItems = [
  {
    icon: <Home className="h-4 w-4" />,
    label: "Home",
    to: '/home',
    href: null,
    gradient: "radial-gradient(circle, rgba(22,163,74,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(22,163,74,0) 100%)",
    iconColor: "icon-green",
    key: 'Home Page'
  },
  {
    icon: <ChefHat className="h-4 w-4" />,
    label: "Explore Menu",
    to: null,
    href: '/home#explore-menu',
    gradient: "radial-gradient(circle, rgba(255,138,0,0.15) 0%, rgba(255,138,0,0.06) 50%, rgba(255,138,0,0) 100%)",
    iconColor: "icon-orange",
    key: 'Explore Menu'
  },
  {
    icon: <Users className="h-4 w-4" />,
    label: "Group Order",
    to: null,
    action: 'group-order',
    gradient: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(168,85,247,0.06) 50%, rgba(168,85,247,0) 100%)",
    iconColor: "icon-purple",
    key: 'Group Order'
  },
  {
    icon: <Smartphone className="h-4 w-4" />,
    label: "Mobile App",
    to: null,
    href: '/home#app-download',
    gradient: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.06) 50%, rgba(59,130,246,0) 100%)",
    iconColor: "icon-blue",
    key: 'Mobile App'
  },
  {
    icon: <MessageSquare className="h-4 w-4" />,
    label: "Contact Us",
    to: null,
    href: '/home#footer',
    gradient: "radial-gradient(circle, rgba(147,51,234,0.15) 0%, rgba(147,51,234,0.06) 50%, rgba(147,51,234,0) 100%)",
    iconColor: "icon-purple",
    key: 'Contact Us'
  },
];

const itemVariants = {
  initial: { rotateX: 0, opacity: 1 },
  hover: { rotateX: -90, opacity: 0 },
};

const backVariants = {
  initial: { rotateX: 90, opacity: 0 },
  hover: { rotateX: 0, opacity: 1 },
};

const glowVariants = {
  initial: { opacity: 0, scale: 0.8 },
  hover: {
    opacity: 1,
    scale: 2,
    transition: {
      opacity: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
      scale: { duration: 0.5, type: "spring", stiffness: 300, damping: 25 },
    },
  },
};

const sharedTransition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
  duration: 0.5,
};

const Navbar = ({ setShowLogin, search, setSearch, onOpenGroupModal }) => {
  const [menu, setMenu] = useState('home');
  const [profileOpen, setProfileOpen] = useState(false);
  const { getTotalCartItems, token, setToken, userProfile, setUserProfile, logout: contextLogout, url } = useContext(StoreContext);
  const API_URL = url;
  const navigate = useNavigate();
  const cartCount = getTotalCartItems();

  const resolveProfileImage = (image) => {
    if (!image) return assets.profile_icon;
    const normalized = String(image).trim();
    if (/^data:/i.test(normalized) || /^https?:\/\//i.test(normalized)) return normalized;
    if (normalized.startsWith('/')) return `${API_URL}${normalized}`;
    return `${API_URL}/images/${normalized}`;
  };

  const profileImageSrc = resolveProfileImage(userProfile?.profileImage);
  const profileDisplayName = userProfile
    ? userProfile.name || `${userProfile.firstName || 'User'}${userProfile.lastName ? ` ${userProfile.lastName}` : ''}`
    : 'Guest';

  const logout = () => {
    if (typeof contextLogout === 'function') {
      contextLogout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('role');
      setToken('');
      if (typeof setUserProfile === 'function') setUserProfile(null);
    }
    navigate('/home');
  };

  const handleNavClick = (e, item) => {
    if (item.action === 'group-order') {
      e.preventDefault();
      setMenu(item.key);
      if (typeof onOpenGroupModal === 'function') {
        onOpenGroupModal();
      }
      return;
    }
    if (item.href) {
      const hashIndex = item.href.indexOf('#');
      if (hashIndex !== -1) {
        const targetId = item.href.slice(hashIndex + 1);
        if (window.location.pathname === '/home') {
          e.preventDefault();
          setMenu(item.key);
          const targetEl = document.getElementById(targetId);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    }
  };

  return (
    <div className='navbar'>
      <Link to='/'>
        <h2 className="logo-text">
          <span className="logo-q">
            <span className="fork">🍴</span>
          </span>
          Quick<span>Bite</span>
        </h2>
      </Link>
      <ul className="navbar-menu">
        {menuItems.map((item) => (
          <li key={item.key} className="menu-li">
            <motion.div
              className="perspective-wrap group"
              style={{ perspective: "600px" }}
              whileHover="hover"
              initial="initial"
            >
              {/* Glow effect on hover */}
              <motion.div
                className="item-glow"
                variants={glowVariants}
                style={{
                  background: item.gradient,
                  opacity: 0,
                }}
              />
              {item.to ? (
                <Link
                  to={item.to}
                  onClick={() => setMenu(item.key)}
                  className={`menu-link-front ${menu === item.key ? 'active' : ''}`}
                  variants={itemVariants}
                  transition={sharedTransition}
                  style={{
                    transformStyle: "preserve-3d",
                    transformOrigin: "center bottom"
                  }}
                >
                  <span className={`menu-icon ${item.iconColor}`}>
                    {item.icon}
                  </span>
                  <span className="menu-label">{item.label}</span>
                </Link>
              ) : (
                <a
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  className={`menu-link-front ${menu === item.key ? 'active' : ''}`}
                  variants={itemVariants}
                  transition={sharedTransition}
                  style={{
                    transformStyle: "preserve-3d",
                    transformOrigin: "center bottom"
                  }}
                >
                  <span className={`menu-icon ${item.iconColor}`}>
                    {item.icon}
                  </span>
                  <span className="menu-label">{item.label}</span>
                </a>
              )}
              
              {item.to ? (
                <Link
                  to={item.to}
                  onClick={() => setMenu(item.key)}
                  className={`menu-link-back ${menu === item.key ? 'active' : ''}`}
                  variants={backVariants}
                  transition={sharedTransition}
                  style={{
                    transformStyle: "preserve-3d",
                    transformOrigin: "center top",
                    transform: "rotateX(90deg)"
                  }}
                >
                  <span className={`menu-icon ${item.iconColor}`}>
                    {item.icon}
                  </span>
                  <span className="menu-label">{item.label}</span>
                </Link>
              ) : (
                <a
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  className={`menu-link-back ${menu === item.key ? 'active' : ''}`}
                  variants={backVariants}
                  transition={sharedTransition}
                  style={{
                    transformStyle: "preserve-3d",
                    transformOrigin: "center top",
                    transform: "rotateX(90deg)"
                  }}
                >
                  <span className={`menu-icon ${item.iconColor}`}>
                    {item.icon}
                  </span>
                  <span className="menu-label">{item.label}</span>
                </a>
              )}
            </motion.div>
          </li>
        ))}
      </ul>
      <div className="navbar-right">
        <input
          type="text"
          placeholder="Search food..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="navbar-search-input"
        />
        <Link to="/cart" className="navbar-cart-link" aria-label="Open cart">
          <FaShoppingCart className="navbar-cart-icon" />
          {cartCount > 0 && (
            <span className="navbar-cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
          )}
        </Link>
        {!token ? (
          <button onClick={() => setShowLogin(true)}>Sign in</button>
        ) : (
          <div
            className='navbar-profile'
            onMouseEnter={() => setProfileOpen(true)}
            onMouseLeave={() => setProfileOpen(false)}
          >
            <div className="navbar-profile-button">
              <img
                className="navbar-profile-image"
                src={profileImageSrc}
                alt="Profile"
                onError={(event) => {
                  event.currentTarget.src = assets.profile_icon;
                }}
              />
              <span className="profile-status-dot" />
            </div>

            <AnimatePresence>
              {profileOpen && (
                <motion.ul
                  className="nav-profile-dropdown"
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  <li className="dropdown-user-card">
                    <div>
                      <p className="dropdown-user-name">{profileDisplayName}</p>
                      <p className="dropdown-user-greeting">Welcome back 👋</p>
                    </div>
                  </li>
                  <li className="nav-profile-item" onClick={() => navigate('/profile-dashboard')}>
                    <img
                      className="dropdown-profile-icon"
                      src={profileImageSrc}
                      alt="Profile"
                      onError={(event) => {
                        event.currentTarget.src = assets.profile_icon;
                      }}
                    />
                    <p>Profile</p>
                  </li>
                  <li className="nav-profile-item" onClick={() => navigate('/myorders')}>
                    <img src={assets.bag_icon} alt="Orders" />
                    <p>Orders</p>
                  </li>
                  <hr />
                  <li className="nav-profile-item" onClick={logout}>
                    <img src={assets.logout_icon} alt="Logout" />
                    <p>Logout</p>
                  </li>
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
