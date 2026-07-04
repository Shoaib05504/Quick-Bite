import React, { useContext, useState } from 'react';
import './LoginPopup.css';
import { assets, url } from '../../assets/assets';
import { StoreContext } from '../context/StoreContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = url;

const LoginPopup = ({ setShowLogin }) => {
  const { setToken, loadCartData, loadUserProfile } = useContext(StoreContext);
  const [currentState, setCurrentState] = useState('Login');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ name: '', email: '', password: '' });

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const onLogin = async (event) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    const endpoint = currentState === 'Login' ? '/api/user/login' : '/api/user/register';

    try {
      const response = await axios.post(`${API_URL}${endpoint}`, data);

      if (response.data.success) {
        const { token, userId, role } = response.data;
        setToken(token);
        localStorage.setItem('token', token);
        localStorage.setItem('userId', userId);
        if (role) localStorage.setItem('role', role);

        await Promise.all([loadCartData(token), loadUserProfile(token)]);
        toast.success(currentState === 'Login' ? 'Welcome back!' : 'Account created!');
        setShowLogin(false);
      } else {
        toast.error(response.data.message || 'Something went wrong.');
      }
    } catch (error) {
      if (error.response?.status === 429) {
        toast.error('Too many attempts. Please try again in 15 minutes.');
      } else {
        toast.error('Unable to connect to server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-popup">
      <form onSubmit={onLogin} className="login-popup-container">
        <div className="login-popup-title">
          <h2>{currentState}</h2>
          <img onClick={() => setShowLogin(false)} src={assets.cross_icon} alt="Close" />
        </div>

        <div className="login-popup-inputs">
          {currentState !== 'Login' && (
            <input
              name="name"
              onChange={onChangeHandler}
              value={data.name}
              type="text"
              placeholder="Full Name"
              required
              minLength={2}
            />
          )}
          <input
            name="email"
            onChange={onChangeHandler}
            value={data.email}
            type="email"
            placeholder="Email Address"
            required
          />
          <input
            name="password"
            onChange={onChangeHandler}
            value={data.password}
            type="password"
            placeholder="Password"
            required
            minLength={8}
          />
        </div>

        <button type="submit" style={{ margin: '8px 24px 0' }} disabled={loading}>
          {loading ? 'Please wait...' : currentState === 'Sign Up' ? 'Create Account' : 'Login'}
        </button>

        <div className="login-popup-condition">
          <input type="checkbox" required />
          <p>By continuing, I agree to the terms of use &amp; privacy policy</p>
        </div>

        {currentState === 'Login' ? (
          <p>
            Don&apos;t have an account?{' '}
            <span onClick={() => setCurrentState('Sign Up')}>Sign Up</span>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <span onClick={() => setCurrentState('Login')}>Login</span>
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginPopup;