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
        <button 
          type="button" 
          onClick={onOpenGroupModal}
          style={{
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: 'auto'
          }}
        >
          <FaUsers /> Start Group Feast
        </button>
      </div>
    </div>
  );
};

export default Header;