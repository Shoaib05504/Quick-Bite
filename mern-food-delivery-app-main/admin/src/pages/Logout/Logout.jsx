import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Logout.css';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('adminName');
    setTimeout(() => {
      if (window.location.port === "5174") {
        window.location.href = 'http://localhost:5173/';
      } else {
        window.location.href = '/';
      }
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
