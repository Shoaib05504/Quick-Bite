import React, { useContext, useState } from 'react';
import './LoginPopup.css';
import { assets } from '../../assets/assets';
import { StoreContext } from '../context/StoreContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiX, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import { auth, googleProvider } from '../../config/firebase';
import { signInWithPopup, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { API_BASE_URL } from '../../config/apiConfig';

const LoginPopup = ({ setShowLogin }) => {
  const { setToken, loadCartData, loadUserProfile } = useContext(StoreContext);
  const [currentState, setCurrentState] = useState('Login');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);



  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [data, setData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });


  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: '', color: '' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, text: 'Weak', color: '#ef4f5f' };
    if (score <= 3) return { score: 3, text: 'Medium', color: '#f59e0b' };
    return { score: 4, text: 'Strong', color: '#10b981' };
  };

  const strengthInfo = getPasswordStrength(data.password);

  const processGoogleUser = async (googleUser) => {
    setGoogleLoading(true);
    try {
      const payload = {
        name: googleUser.displayName || 'Google User',
        email: googleUser.email,
        uid: googleUser.uid,
        photoURL: googleUser.photoURL || '',
      };

      const reqUrl = `${API_BASE_URL}/user/google-auth`;
      const response = await axios.post(reqUrl, payload, { timeout: 45000 });

      if (response && response.data && response.data.success) {
        const { token, userId, role, name } = response.data;
        setToken(token);
        localStorage.setItem('token', token);
        localStorage.setItem('userId', userId);
        if (role) localStorage.setItem('role', role);

        await Promise.all([loadCartData(token), loadUserProfile(token)]);
        toast.success(`Welcome to QuickBite, ${name || googleUser.displayName || 'Foodie'}! 🎉`);
        setShowLogin(false);
      } else {
        toast.error(response.data?.message || 'Google authentication failed.');
      }
    } catch (err) {
      console.error('Google Auth Backend Error:', err.message || err);
      const errMsg = err.response?.data?.message || 'Unable to connect to backend server. Please try again.';
      toast.error(errMsg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);

    const isNative = Capacitor.isNativePlatform();
    const webClientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID || '875272692734-fuje7g7h9p8o8m33kdp81vug8nadm0vp.apps.googleusercontent.com';

    if (isNative) {
      try {
        await GoogleAuth.initialize({
          clientId: webClientId,
          scopes: ['profile', 'email'],
        }).catch((initErr) => {
          console.warn('GoogleAuth.initialize warning:', initErr);
        });

        const googleUser = await GoogleAuth.signIn();
        if (!googleUser) {
          throw new Error('Google Sign-In failed: No account selected.');
        }

        const userObj = {
          displayName: googleUser.displayName || googleUser.name || (googleUser.givenName ? `${googleUser.givenName} ${googleUser.familyName || ''}`.trim() : 'Google User'),
          email: googleUser.email || '',
          uid: googleUser.id || googleUser.authentication?.idToken || 'google_' + Date.now(),
          photoURL: googleUser.imageUrl || '',
        };

        const idToken = googleUser?.authentication?.idToken || googleUser?.idToken;
        if (idToken) {
          try {
            const credential = GoogleAuthProvider.credential(idToken);
            const firebaseResult = await signInWithCredential(auth, credential);
            if (firebaseResult?.user) {
              userObj.displayName = firebaseResult.user.displayName || userObj.displayName;
              userObj.email = firebaseResult.user.email || userObj.email;
              userObj.uid = firebaseResult.user.uid || userObj.uid;
              userObj.photoURL = firebaseResult.user.photoURL || userObj.photoURL;
            }
          } catch (fbErr) {
            console.warn('Continuing with Native Google user profile:', fbErr.message || fbErr);
          }
        }

        await processGoogleUser(userObj);
      } catch (error) {
        setGoogleLoading(false);
        console.error('Native Google Auth Error:', error.message || error);
        const errorCode = String(error.code || error.error || '');
        const errorMessage = String(error.message || error.errorMessage || error.description || '');

        if (errorCode === '12501' || errorMessage.includes('12501') || errorMessage.includes('user canceled') || errorMessage.includes('canceled')) {
          toast.error('Google sign-in was cancelled.');
        } else if (errorCode === '12500' || errorMessage.includes('12500')) {
          toast.error('Google Error 12500: Check SHA-1 fingerprint in Firebase Console.');
        } else if (errorCode === '10' || errorMessage.includes('10')) {
          toast.error('Google Error 10: SHA-1 fingerprint mismatch or invalid Web Client ID.');
        } else {
          toast.error(`Google Sign-In Error: ${errorMessage || errorCode || 'Native authentication failed'}`);
        }
      }
    } else {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        if (result && result.user) {
          await processGoogleUser(result.user);
        } else {
          setGoogleLoading(false);
        }
      } catch (error) {
        setGoogleLoading(false);
        console.error('Web Google Auth Error:', error.message || error);
        const errorCode = String(error.code || error.error || '');
        const errorMessage = String(error.message || error.errorMessage || '');

        if (errorCode === 'auth/popup-closed-by-user') {
          toast.error('Google sign-in was cancelled.');
        } else if (errorCode === 'auth/popup-blocked') {
          toast.error('Authentication popup was blocked. Please allow popups in your browser.');
        } else {
          toast.error(errorMessage || 'Google Authentication failed.');
        }
      }
    }
  };

  const onLogin = async (event) => {
    event.preventDefault();
    if (loading || googleLoading) return;

    if (currentState === 'Sign Up') {
      if (data.password !== data.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      if (!agreeTerms) {
        toast.error('Please agree to the Terms of Service & Privacy Policy');
        return;
      }
    }

    setLoading(true);
    const endpoint = currentState === 'Login' ? '/user/login' : '/user/register';
    const targetUrl = `${API_BASE_URL}${endpoint}`;

    try {
      const response = await axios.post(targetUrl, {
        name: data.name,
        email: data.email,
        password: data.password,
      }, { timeout: 45000 });

      if (response.data && response.data.success) {
        const { token, userId, role } = response.data;
        setToken(token);
        localStorage.setItem('token', token);
        localStorage.setItem('userId', userId);
        if (role) localStorage.setItem('role', role);

        await Promise.all([loadCartData(token), loadUserProfile(token)]);
        toast.success(currentState === 'Login' ? 'Welcome back to QuickBite!' : 'Account created successfully!');
        setShowLogin(false);
      } else {
        toast.error(response.data?.message || 'Something went wrong.');
      }
    } catch (error) {
      console.error("Login Error:", error.message || error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 429) {
        toast.error('Too many attempts. Please try again in 15 minutes.');
      } else {
        toast.error(`Unable to connect to backend server. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!data.email) {
      toast.error('Please enter your email address');
      return;
    }
    setForgotLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/user/forgot-password`, { email: data.email }, { timeout: 45000 });
      setForgotSubmitted(true);
      toast.success('Reset link sent successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error sending reset link. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="login-popup">
      <div className="login-backdrop" onClick={() => setShowLogin(false)} />

      <div className="login-popup-card">
        <button
          type="button"
          className="auth-close-btn"
          onClick={() => setShowLogin(false)}
          aria-label="Close modal"
        >
          <FiX />
        </button>

        {/* Header Section */}
        <div className="auth-header">

          <div className="logo-badge">
            <img src={assets.logo} alt="QuickBite Logo" className="auth-logo" />
          </div>
          {currentState === 'Login' && (
            <>
              <h2>Welcome Back!</h2>
              <p>Login to order your favorite food.</p>
            </>
          )}
          {currentState === 'Sign Up' && (
            <>
              <h2>Create Your Account</h2>
              <p>Join QuickBite and enjoy delicious food delivered to you.</p>
            </>
          )}
          {currentState === 'Forgot Password' && (
            <>
              <h2>Forgot Password?</h2>
              <p>Enter your email address and we will send you a link to reset your password.</p>
            </>
          )}
        </div>

        {/* Forgot Password View */}
        {currentState === 'Forgot Password' ? (
          forgotSubmitted ? (
            <div className="forgot-success-card">
              <div className="success-icon-badge">
                <FiCheckCircle />
              </div>
              <h3>Reset Link Sent!</h3>
              <p>✓ Reset link sent successfully. Please check your email inbox for instructions.</p>
              <button
                type="button"
                className="auth-submit-btn"
                onClick={() => {
                  setCurrentState('Login');
                  setForgotSubmitted(false);
                }}
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotSubmit} className="auth-form">
              <div className="input-group">
                <label htmlFor="forgot-email">Email Address</label>
                <div className="input-wrapper">
                  <FiMail className="input-icon" />
                  <input
                    id="forgot-email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    value={data.email}
                    onChange={onChangeHandler}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={forgotLoading}>
                {forgotLoading ? 'SENDING RESET LINK...' : 'SEND RESET LINK'}
              </button>

              <div className="auth-footer-link">
                <button
                  type="button"
                  className="back-to-login-btn"
                  onClick={() => setCurrentState('Login')}
                >
                  <FiArrowLeft style={{ marginRight: '6px' }} /> Back to Login
                </button>
              </div>
            </form>
          )
        ) : (
          /* Login & Sign Up Views */
          <>
            {/* Social Login Button */}
            <button
              type="button"
              className="google-auth-btn"
              onClick={handleGoogleAuth}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <span className="spinner-label" style={{ color: '#1e293b' }}>
                  <span className="auth-btn-spinner" style={{ borderColor: 'rgba(30, 41, 59, 0.3)', borderTopColor: '#1e293b' }} />
                  Connecting to Google...
                </span>
              ) : (
                <>
                  <svg className="google-icon-svg" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            {/* Divider */}
            <div className="auth-divider">
              <span>{currentState === 'Login' ? 'OR CONTINUE WITH EMAIL' : 'OR SIGN UP WITH EMAIL'}</span>
            </div>

            {/* Main Form */}
            <form onSubmit={onLogin} className="auth-form">
              {currentState === 'Sign Up' && (
                <div className="input-group">
                  <label htmlFor="signup-name">Full Name</label>
                  <div className="input-wrapper">
                    <FiUser className="input-icon" />
                    <input
                      id="signup-name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      value={data.name}
                      onChange={onChangeHandler}
                      required
                      minLength={2}
                    />
                  </div>
                </div>
              )}

              <div className="input-group">
                <label htmlFor="auth-email-input">Email Address</label>
                <div className="input-wrapper">
                  <FiMail className="input-icon" />
                  <input
                    id="auth-email-input"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    value={data.email}
                    onChange={onChangeHandler}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="auth-pass-input">Password</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    id="auth-pass-input"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={data.password}
                    onChange={onChangeHandler}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              {/* Password Strength Indicator on Sign Up */}
              {currentState === 'Sign Up' && data.password && (
                <div className="password-strength-wrap">
                  <div className="strength-meter-bg">
                    <div
                      className="strength-meter-fill"
                      style={{
                        width: `${(strengthInfo.score / 4) * 100}%`,
                        backgroundColor: strengthInfo.color,
                      }}
                    />
                  </div>
                  <span className="strength-label" style={{ color: strengthInfo.color }}>
                    Password Strength: {strengthInfo.text}
                  </span>
                </div>
              )}

              {currentState === 'Sign Up' && (
                <div className="input-group">
                  <label htmlFor="auth-confirm-pass">Confirm Password</label>
                  <div className="input-wrapper">
                    <FiLock className="input-icon" />
                    <input
                      id="auth-confirm-pass"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      value={data.confirmPassword}
                      onChange={onChangeHandler}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>
              )}

              {/* Login Extra Options */}
              {currentState === 'Login' && (
                <div className="login-options-row">
                  <label className="remember-me-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember Me</span>
                  </label>
                  <button
                    type="button"
                    className="forgot-pass-link"
                    onClick={() => setCurrentState('Forgot Password')}
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {/* Sign Up Terms Checkbox */}
              {currentState === 'Sign Up' && (
                <div className="terms-checkbox-wrap">
                  <input
                    type="checkbox"
                    id="terms-checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    required
                  />
                  <label htmlFor="terms-checkbox">
                    I agree to the{' '}
                    <a href="#terms" onClick={(e) => { e.preventDefault(); toast.success('Terms of Service'); }}>
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#privacy" onClick={(e) => { e.preventDefault(); toast.success('Privacy Policy'); }}>
                      Privacy Policy
                    </a>
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <button type="submit" className="auth-submit-btn" disabled={loading || googleLoading}>
                {loading ? (
                  <span className="spinner-label">
                    <span className="auth-btn-spinner" /> Processing...
                  </span>
                ) : currentState === 'Sign Up' ? (
                  'CREATE ACCOUNT'
                ) : (
                  'LOGIN'
                )}
              </button>
            </form>

            {/* Footer Navigation */}
            <div className="auth-bottom-nav">
              {currentState === 'Login' ? (
                <p>
                  Don&apos;t have an account?{' '}
                  <span
                    className="nav-switch-link"
                    onClick={() => {
                      setCurrentState('Sign Up');
                      setData({ name: '', email: '', password: '', confirmPassword: '' });
                    }}
                  >
                    Sign Up
                  </span>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <span
                    className="nav-switch-link"
                    onClick={() => {
                      setCurrentState('Login');
                      setData({ name: '', email: '', password: '', confirmPassword: '' });
                    }}
                  >
                    Login
                  </span>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginPopup;