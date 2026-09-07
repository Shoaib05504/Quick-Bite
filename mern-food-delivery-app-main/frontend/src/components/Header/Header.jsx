import React from 'react';
import './Header.css';
import headerBanner from '../../assets/header_banner.png';

const Header = () => {
  const handleOrderNowClick = () => {
    const targetElement = document.getElementById('food-display') || document.getElementById('explore-menu');
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="header-banner-container">
      <div className="header-banner-wrapper">
        <img
          src={headerBanner}
          alt="QuickBite Promotional Banner - Craving Something Delicious? Up to 50% Off"
          className="header-banner-img"
        />
        <button
          type="button"
          onClick={handleOrderNowClick}
          className="order-now-overlay-btn"
          aria-label="Order Now - Explore Menu"
          title="Order Now"
        />
      </div>
    </div>
  );
};

export default Header;