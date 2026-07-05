import React from 'react';
import './Footer.css';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Truck, CreditCard, Users, Headphones, Smartphone, Heart } from 'lucide-react';

const Footer = () => {
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
            <h2 className="logo-text">
              Quick<span>Bite</span>
            </h2>
          </Link>
          <span className="brand-tagline">Fast • Fresh • Delicious</span>
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
            <li><Link to="/myorders">Live GPS Tracking</Link></li>
            <li><a href="/home#explore-menu">Offers & Deals</a></li>
            <li><a href="/home#footer">Contact Us</a></li>
          </ul>
        </div>

        {/* Column 4: DOWNLOAD APP */}
        <div className="footer-column download-app-col">
          <h3>DOWNLOAD APP</h3>
          <div className="coming-soon-card">
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
        <div className="payment-gateways-row">
          {/* PayPal */}
          <svg className="payment-svg" viewBox="0 0 24 24" width="36" height="24">
            <rect width="24" height="24" rx="3" fill="#003087"/>
            <path d="M8 6h3.5c1.4 0 2.3.1 2.8.4.5.3.8.7.9 1.3.1.5 0 1-.2 1.4-.2.4-.5.8-.9 1-.3.2-.8.3-1.5.3H9.4l-.8 4.6H7l1-6zm2.4 2.8h.9c.7 0 1.2-.1 1.4-.3.2-.2.3-.5.2-.8-.1-.3-.2-.5-.5-.6-.2-.1-.7-.1-1.3-.1h-.9l-.3 1.8zm2.6.4h3.5c1.4 0 2.3.1 2.8.4.5.3.8.7.9 1.3.1.5 0 1-.2 1.4-.2.4-.5.8-.9 1-.3.2-.8.3-1.5.3h-2.2l-.8 4.6h-1.6l1-6zm2.4 2.8h.9c.7 0 1.2-.1 1.4-.3.2-.2.3-.5.2-.8-.1-.3-.2-.5-.5-.6-.2-.1-.7-.1-1.3-.1h-.9l-.3 1.8z" fill="#0079C1"/>
          </svg>
          {/* VISA */}
          <svg className="payment-svg" viewBox="0 0 24 24" width="36" height="24">
            <rect width="24" height="24" rx="3" fill="#1A1F71"/>
            <path d="M5.5 16.5l.8-4.8H8l-.8 4.8H5.5zm5.7-4.8c-.3-.2-.8-.3-1.4-.3-1.3 0-2.2.7-2.2 1.7 0 1.2 1 1.3 1.7 1.6.7.3.9.5.9.8s-.4.6-1 .6c-.7 0-1.2-.3-1.5-.5l-.2-.1-.2 1.2c.3.1 1 .3 1.7.3 1.4 0 2.3-.7 2.3-1.8 0-1.2-.8-1.4-1.7-1.7-.6-.3-.9-.5-.9-.8 0-.3.3-.6.9-.6.6 0 1 .2 1.3.4l.2.1.2-1.3zm3.7.8l-1.3 4h1.5l.8-2.5h1.8l.2 2.5h1.3L18 11.7h-1.3l-1.8 4.8zm.5 1.5l.7-2h1.2l-.4 2h-1.5zm-11.8.2L3.5 12h-.1L2.1 16.2h1.4zm18.1-5.7h-1.2c-.4 0-.7.2-.9.6L19 16.5h1.5l.3-.8h1.8l.2.8h1.4l-1.2-4.8z" fill="#F7B600"/>
          </svg>
          {/* Mastercard */}
          <svg className="payment-svg" viewBox="0 0 24 24" width="36" height="24">
            <rect width="24" height="24" rx="3" fill="#222222"/>
            <circle cx="10" cy="12" r="5" fill="#EB001B" opacity="0.9"/>
            <circle cx="14" cy="12" r="5" fill="#F79E1B" opacity="0.9"/>
            <path d="M12 8.4c.7.9 1.1 2.1 1.1 3.6s-.4 2.7-1.1 3.6c-.7-.9-1.1-2.1-1.1-3.6s.4-2.7 1.1-3.6z" fill="#FF5F00"/>
          </svg>
          {/* Amex */}
          <svg className="payment-svg" viewBox="0 0 24 24" width="36" height="24">
            <rect width="24" height="24" rx="3" fill="#016FD0"/>
            <path d="M5 16h1.5l.3-1H8l.3 1H10l-1.8-5H6.8L5 16zm2.1-2.3L7.5 12l.4 1.7H7.1zm5.2 2.3h3.5v-1.2h-2.1v-.7h1.9v-1.1h-1.9v-.6h2.1v-1.4h-3.5V16zm5.8 0h1.5l1.2-1.9 1.2 1.9h1.5L20.5 13.5l2-2.5H21l-1.2 1.7-1.2-1.7H17l2 2.5-2.1 2.5z" fill="#FFFFFF"/>
          </svg>
          {/* Discover */}
          <svg className="payment-svg" viewBox="0 0 24 24" width="36" height="24">
            <rect width="24" height="24" rx="3" fill="#F4F4F4"/>
            <path d="M3 16h2.5c1.4 0 2.2-.6 2.2-1.7V13.7c0-1.1-.8-1.7-2.2-1.7H3v4zm1.5-2.8H5c.5 0 .8.2.8.6v.4c0 .4-.3.6-.8.6h-.5v-1.6zm6 2.8h1.5v-4H10.5v4zm3.8-.2c.3.2.7.3 1.2.3.8 0 1.2-.4 1.2-.9s-.3-.7-.9-.9c-.6-.2-.9-.4-.9-.8 0-.4.4-.7.9-.7.4 0 .7.1.9.3l.4-1c-.3-.2-.7-.3-1.2-.3-.8 0-1.3.4-1.3.9s.3.7 1 .9c.6.2.8.4.8.7s-.4.6-.9.6c-.4 0-.8-.1-1.1-.3l-.4 1zm6.2-3.8h-1.5v4h1.5v-4zm-4.7 0H16l1.2 2.5 1.2-2.5h-1.3z" fill="#111111"/>
            <circle cx="12.2" cy="13.2" r="1.8" fill="#FF6600"/>
          </svg>
        </div>
        <p className="footer-copyright">
          © 2026 QuickBite. All Rights Reserved. Made with <Heart className="copyright-heart" /> for food lovers.
        </p>
      </div>
    </footer>
  );
};

export default Footer;