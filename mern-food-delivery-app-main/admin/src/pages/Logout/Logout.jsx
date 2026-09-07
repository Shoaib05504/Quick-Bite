import React, { useEffect } from 'react';
import { clearAuthUser } from '../../services/storageService';
import './Logout.css';

const Logout = () => {
  useEffect(() => {
    const performLogout = async () => {
      await clearAuthUser();
      if (typeof localStorage !== 'undefined') localStorage.clear();
      if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
      window.dispatchEvent(new Event('storage'));
      setTimeout(() => {
        if (window.location.port === '5174') {
          window.location.href = 'http://localhost:5173/';
        } else {
          window.location.href = window.location.origin + '/';
        }
      }, 150);
    };
    performLogout();
  }, []);

  return (
    <div className="logout-page">
      <div className="logout-card">
        <h2>Logging out</h2>
        <p>Redirecting to QuickBite landing page…</p>
      </div>
    </div>
  );
};

export default Logout;
