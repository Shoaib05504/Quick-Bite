import { Capacitor } from '@capacitor/core';

/**
 * Resolves the server base URL (without /api suffix) based on environment and platform:
 * Default Production Backend: https://quickbite-9qd2.onrender.com
 *
 * Priority Order:
 * 1. Custom URL in localStorage (quickbite_api_url) if set for debugging
 * 2. Mobile APK / Capacitor Native / WebView -> https://quickbite-9qd2.onrender.com
 * 3. Environment variable override (VITE_API_URL / VITE_PRODUCTION_API_URL)
 * 4. Production Web / Default fallback -> https://quickbite-9qd2.onrender.com
 */
const DEFAULT_PROD_URL = 'https://quickbite-9qd2.onrender.com';

export const resolveServerBaseUrl = () => {
  // 1. Custom URL from localStorage for manual testing
  const customUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('quickbite_api_url') : null;
  if (customUrl && customUrl.trim()) {
    return customUrl.trim().replace(/\/api\/?$/, '').replace(/\/$/, '');
  }

  // 2. Capacitor Native / Mobile APK check
  const isNativePlatform = Capacitor.isNativePlatform();
  const isCapacitorWeb = typeof window !== 'undefined' && (
    window.location.protocol === 'capacitor:' || 
    (window.location.hostname === 'localhost' && window.location.port === '' && typeof navigator !== 'undefined' && /Capacitor|Android/i.test(navigator.userAgent))
  );

  if (isNativePlatform || isCapacitorWeb) {
    const androidEnvUrl = import.meta.env.VITE_ANDROID_API_URL || import.meta.env.VITE_PRODUCTION_API_URL || DEFAULT_PROD_URL;
    const targetUrl = androidEnvUrl.trim().replace(/\/api\/?$/, '').replace(/\/$/, '');
    console.log(`📱 [API Config] Mobile APK/Capacitor Active. Connecting to Render backend: ${targetUrl}`);
    return targetUrl;
  }

  // 3. Browser Environment
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_PRODUCTION_API_URL;
  if (envUrl && envUrl.trim() && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.trim().replace(/\/api\/?$/, '').replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    // Development on localhost with active port
    if (isLocalhost && window.location.port !== '') {
      return (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '').replace(/\/$/, '');
    }

    // Deployed web site
    if (!isLocalhost) {
      return window.location.origin.replace(/\/$/, '');
    }
  }

  return DEFAULT_PROD_URL;
};

// Base server URL without trailing slash (e.g. "https://quickbite-9qd2.onrender.com")
export const SERVER_BASE_URL = resolveServerBaseUrl();

// API Base URL with /api suffix (e.g. "https://quickbite-9qd2.onrender.com/api")
export const API_BASE_URL = `${SERVER_BASE_URL}/api`;

// Socket server URL
export const SOCKET_SERVER_URL = SERVER_BASE_URL;

export default API_BASE_URL;
