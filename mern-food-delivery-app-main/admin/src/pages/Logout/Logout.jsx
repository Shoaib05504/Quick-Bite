import React, { useEffect } from 'react';
import { clearAuthUser } from '../../services/storageService';
import './Logout.css';

const Logout = () => {
  useEffect(() => {
    const performLogout = async () => {
      const isApkSession =
        (typeof localStorage !== 'undefined' && localStorage.getItem('admin_apk_session') === 'true') ||
        (typeof window !== 'undefined' && window.location.search.includes('source=apk')) ||
        (typeof navigator !== 'undefined' && /Capacitor|Android/i.test(navigator.userAgent));

      await clearAuthUser();
      if (typeof localStorage !== 'undefined') localStorage.clear();
      if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
      window.dispatchEvent(new Event('storage'));
      setTimeout(() => {
        if (isApkSession) {
          window.location.href = 'quickbite://home';
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
