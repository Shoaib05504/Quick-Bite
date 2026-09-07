import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

let app = null;
let auth = null;
let googleProvider = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey.trim()) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account',
    });
  } else {
    console.warn('[QuickBite Auth Warning] VITE_FIREBASE_API_KEY is missing or empty. Firebase Google Sign-In is temporarily disabled until environment variables are configured.');
  }
} catch (err) {
  console.warn('[QuickBite Auth Warning] Firebase initialization error:', err);
}

// Initialize GoogleAuth safely for native Capacitor Android/iOS apps
if (Capacitor.isNativePlatform()) {
  const initGoogleAuth = () => {
    try {
      const webClientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID || '875272692734-fuje7g7h9p8o8m33kdp81vug8nadm0vp.apps.googleusercontent.com';
      console.log('[QuickBite Auth Init] Native platform detected:', Capacitor.getPlatform(), '| Initializing GoogleAuth with Client ID:', webClientId);
      GoogleAuth.initialize({
        clientId: webClientId,
        scopes: ['profile', 'email'],
      }).catch((err) => {
        console.warn('[QuickBite Auth Init Async Warning]:', err);
      });
    } catch (err) {
      console.warn('[QuickBite Auth Init Warning]:', err);
    }
  };

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initGoogleAuth, { once: true });
  } else {
    setTimeout(initGoogleAuth, 50);
  }
} else {
  console.log('[QuickBite Auth Init] Web platform detected:', Capacitor.getPlatform());
}

export { app, auth, googleProvider };



