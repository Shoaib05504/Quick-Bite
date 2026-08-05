import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

const Login = ({ url, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await axios.post(`${url}/api/user/login`, {
        email: email.trim(),
        password: password,
      });

      if (response.data.success) {
        if (response.data.role === 'admin') {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('role', 'admin');
          localStorage.setItem('userId', response.data.userId);
          onLoginSuccess(response.data.token);
        } else {
          setError('Access forbidden. Account does not have admin privileges.');
        }
      } else {
        setError(response.data.message || 'Login failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials or server error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-logo">
            <span className="logo-dot"></span>
            <h2>QUICKBITE ADMIN</h2>
          </div>
          <p>Sign in to access admin panel controls & analytics</p>
        </div>

        {error && <div className="admin-login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label>Username / Email</label>
            <input
              type="text"
              placeholder="admin or admin@quickbite.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In as Admin'}
          </button>
        </form>

        <div className="admin-login-footer">
          <p>Default credentials: <code>admin</code> / <code>1234</code></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
