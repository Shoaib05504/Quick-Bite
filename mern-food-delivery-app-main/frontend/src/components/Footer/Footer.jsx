import React from 'react';
import './Footer.css';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { assets } from '../../assets/assets';
import { MapPin, Phone, Mail, Truck, CreditCard, Users, Headphones, Smartphone, Heart } from 'lucide-react';

const Footer = () => {
  const handleDownloadClick = () => {
    toast('🚀 QuickBite Mobile App Coming Soon! Order faster and smarter from anywhere.', {
      duration: 3000,
      position: 'top-right',
      style: {
        background: 'linear-gradient(135deg, #16A34A, #10B981)',
        color: '#ffffff',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
        padding: '12px 18px',
        boxShadow: '0 10px 25px -5px rgba(22, 163, 74, 0.3)',
      },
    });
  };

  return (
    <footer className="footer" id="footer">
      {/* 1. OUR SERVICES (Top Section Features Grid) */}
      <div className="footer-services-grid">
        <div className="footer-service-card">
          <div className="service-icon-wrapper">
            <Truck className="service-icon" />
          </div>
          <h3>Fast Food Delivery</h3>
          <p>Get fresh, piping hot meals delivered to your doorstep in record time.</p>
        </div>
        
        <div className="footer-service-card">
          <div className="service-icon-wrapper">
            <CreditCard className="service-icon" />
          </div>
          <h3>Secure Online Payment</h3>
          <p>Pay with confidence using our multiple encrypted secure payment options.</p>
        </div>
        
        <div className="footer-service-card">
          <div className="service-icon-wrapper">
            <Users className="service-icon" />
          </div>
          <h3>Smart Split Bill</h3>
          <p>Easily split orders and bills with friends for hassle-free group dining.</p>
        </div>
        
        <div className="footer-service-card">
          <div className="service-icon-wrapper">
            <Headphones className="service-icon" />
          </div>
          <h3>24/7 Customer Support</h3>
          <p>We are here to help you anytime, day or night, with dedicated support.</p>
        </div>
      </div>

      <hr className="footer-divider-top" />

      {/* 2. MIDDLE SECTION (4 Columns) */}
      <div className="footer-columns-grid">
        {/* Column 1: Brand Info */}
        <div className="footer-column brand-info-col">
          <Link to="/home" className="footer-logo-link">
            <img src={assets.logo} alt="QuickBite Logo" className="footer-logo-img" />
          </Link>
          <span className="brand-tagline">FAST • FRESH • DELICIOUS</span>
          <p className="brand-desc">
            Experience smart food ordering with QuickBite. Get fresh meals, AI food recommendations, group ordering, and live delivery tracking all in one place.
          </p>
          <div className="contact-info-list">
            <div className="contact-info-item">
              <MapPin className="contact-icon" />
              <span>Bengaluru, Karnataka, India</span>
            </div>
            <div className="contact-info-item">
              <Phone className="contact-icon" />
              <span>+91 XXXXX XXXXX</span>
            </div>
            <div className="contact-info-item">
              <Mail className="contact-icon" />
              <a href="mailto:support@quickbite.com">support@quickbite.com</a>
            </div>
          </div>
        </div>

        {/* Column 2: MY ACCOUNT */}
        <div className="footer-column">
          <h3>MY ACCOUNT</h3>
          <ul className="footer-links-list">
            <li><Link to="/profile-dashboard">My Profile</Link></li>
            <li><Link to="/myorders">My Orders</Link></li>
            <li><Link to="/myorders">Track Order</Link></li>
            <li><Link to="/profile-dashboard">Saved Addresses</Link></li>
            <li><Link to="/cart">Cart</Link></li>
          </ul>
        </div>

        {/* Column 3: EXPLORE QUICKBITE */}
        <div className="footer-column">
          <h3>EXPLORE QUICKBITE</h3>
          <ul className="footer-links-list">
            <li><a href="/home#explore-menu">Explore Menu</a></li>
            <li><a href="/home#moodbite">MoodBite AI Recommendation</a></li>
            <li><Link to="/cart">Group Ordering</Link></li>
            <li><Link to="/myorders">Order Tracking</Link></li>
            <li><Link to="/smart-split-bill">Smart Split Bill</Link></li>
            <li><a href="/home#footer">Contact Us</a></li>
          </ul>
        </div>

        {/* Column 4: DOWNLOAD APP */}
        <div className="footer-column download-app-col">
          <h3>DOWNLOAD APP</h3>
          <div className="coming-soon-card" onClick={handleDownloadClick}>
            <div className="coming-soon-badge">
              <Smartphone className="badge-icon" />
              <span>Coming Soon</span>
            </div>
            <p className="coming-soon-title">QuickBite Mobile App is coming soon!</p>
            <p className="coming-soon-desc">Order faster and smarter from anywhere.</p>
          </div>
        </div>
      </div>

      <hr className="footer-divider-bottom" />

      {/* 3. BOTTOM SECTION (Payment Icons & Copyright) */}
      <div className="footer-bottom-section">
        <h4 className="secure-payments-title">Secure Payments</h4>
        <div className="payment-gateways-row">
          {/* UPI */}
          <svg className="payment-svg" viewBox="0 0 38 24" width="38" height="24">
            <rect width="38" height="24" rx="4" fill="#FFFFFF" stroke="#D1FAE5" strokeWidth="1.5"/>
            <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="#16A34A" fontSize="10" fontWeight="800" fontFamily="'Poppins', sans-serif" letterSpacing="0.2">UPI</text>
          </svg>
          {/* VISA */}
          <svg className="payment-svg" viewBox="0 0 38 24" width="38" height="24">
            <rect width="38" height="24" rx="4" fill="#1A1F71"/>
            <path d="M7 16.5l1.1-4.8h2.3l-1.1 4.8H7zm7.5-4.8c-.4-.2-1.1-.3-1.9-.3-1.8 0-3 1-3 2.3 0 1.6 1.4 1.7 2.3 2.2.9.4 1.2.7 1.2 1.1s-.5.8-1.4.8c-1 0-1.7-.4-2.1-.7l-.3-.1-.3 1.6c.4.2 1.4.4 2.3.4 1.9 0 3.2-1 3.2-2.5 0-1.6-1.1-1.9-2.3-2.3-.8-.4-1.2-.7-1.2-1.1 0-.4.4-.8 1.2-.8.8 0 1.4.3 1.8.5l.3.1.3-1.8zm4.8 1.1l-1.8 5.6h2l1.1-3.5h2.5l.3 3.5h1.8l-1.8-6.7h-1.8l-2.3 1.1zm.7 2.1l1-2.8h1.7l-.6 2.8H20zm-15.6.3l-1.5-6h-.1l-1.9 5.9h1.9zm24.7-8h-1.7c-.5 0-1 .3-1.2.8L25 16.5h2l.4-1.1h2.5l.3 1.1h1.9L30.3 10.3z" fill="#F7B600"/>
          </svg>
          {/* Mastercard */}
          <svg className="payment-svg" viewBox="0 0 38 24" width="38" height="24">
            <rect width="38" height="24" rx="4" fill="#222222"/>
            <circle cx="15.5" cy="12" r="6.5" fill="#EB001B" opacity="0.9"/>
            <circle cx="22.5" cy="12" r="6.5" fill="#F79E1B" opacity="0.9"/>
            <path d="M19 7.4c1 1.2 1.5 2.8 1.5 4.6s-.5 3.4-1.5 4.6c-1-1.2-1.5-2.8-1.5-4.6s.5-3.4 1.5-4.6z" fill="#FF5F00"/>
          </svg>
          {/* PayPal */}
          <svg className="payment-svg" viewBox="0 0 38 24" width="38" height="24">
            <rect width="38" height="24" rx="4" fill="#003087"/>
            <path d="M13 6h4.5c1.8 0 3 .1 3.7.5.7.4 1.1 1 1.2 1.8.1.7 0 1.4-.3 1.9-.3.6-.7 1.1-1.3 1.4-.4.3-1.1.4-2.1.4h-3l-1.1 6.2H11.5l1.5-8.2zm3.3 3.8h1.2c1 0 1.7-.1 2-.4.3-.3.4-.7.3-1.1-.1-.4-.3-.7-.7-.8-.3-.1-1-.1-1.8-.1h-1.2l-.4 2.4zm3.6.5h4.5c1.8 0 3 .1 3.7.5.7.4 1.1 1 1.2 1.8.1.7 0 1.4-.3 1.9-.3.6-.7 1.1-1.3 1.4-.4.3-1.1.4-2.1.4H22l-1.1 6.2h-3l1.5-8.2zm3.3 3.8H25c1 0 1.7-.1 2-.4.3-.3.4-.7.3-1.1-.1-.4-.3-.7-.7-.8-.3-.1-1-.1-1.8-.1H24l-.4 2.4z" fill="#0079C1"/>
          </svg>
        </div>
        <p className="footer-copyright">
          © 2026 QuickBite. Crafted with <Heart className="copyright-heart" /> for food lovers.
        </p>
      </div>
    </footer>
  );
};

export default Footer;