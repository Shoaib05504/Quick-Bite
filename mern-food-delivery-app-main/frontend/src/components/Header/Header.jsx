import React from 'react';
import './Header.css';
import myfood from '../../assets/myfood.png';
import { FaUsers } from 'react-icons/fa';

const Header = ({ onOpenGroupModal }) => {
  return (
    <div 
      className="header"
      style={{ backgroundImage: `url(${myfood})` }}
    >
      <div className="header-contents">
        <h2>Order Your Favorite Food Together</h2>
        <p>Choose from a diverse menu featuring a delectable array of dishes. Start a QuickBite Group Feast to order together in real-time with friends!</p>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <a href="#explore-menu">
            <button type="button">Explore Menu</button>
          </a>
          <button 
            type="button" 
            onClick={onOpenGroupModal}
            style={{
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FaUsers /> Start Group Feast
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;