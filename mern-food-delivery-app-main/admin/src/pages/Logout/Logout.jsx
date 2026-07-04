import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Logout.css';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setTimeout(() => {
      // Redirect to the frontend dev server. Try common Vite ports.
      window.location.href = 'http://localhost:5175/';
    }, 350);
  }, [navigate]);

  return (
    <div className="logout-page">
      <div className="logout-card">
        <h2>Logging out</h2>
        <p>Redirecting to the main webpage…</p>
      </div>
    </div>
  );
};

export default Logout;
