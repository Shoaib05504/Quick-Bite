import { Capacitor } from '@capacitor/core';

/**
 * Helper to detect if running inside an Android Emulator vs Physical Device
 */
const isAndroidEmulator = () => {
  if (typeof navigator === 'undefined') return false;
  const userAgent = (navigator.userAgent || '').toLowerCase();
  
  // Known emulator signatures in Android WebView userAgent
  const emulatorKeywords = [
    'sdk_gphone',
    'google_sdk',
    'emulator',
    'android sdk',
    'goldfish',
    'ranchu',
    'vbox86p',
    'x86_64',
    'x86'
  ];
  
  const is10022 = typeof window !== 'undefined' && window.location.hostname === '10.0.2.2';
  return emulatorKeywords.some((keyword) => userAgent.includes(keyword)) || is10022;
};

/**
 * Resolves the server base URL (without /api suffix) based on environment and platform:
 * 1. Custom URL in localStorage (if set by user for custom debugging)
 * 2. Capacitor Native (Android/iOS) or WebView:
 *    - Android Emulator -> http://10.0.2.2:8000
 *    - Physical Device -> VITE_ANDROID_API_URL or fallback to http://10.80.218.217:8000
 * 3. Browser Development (localhost/127.0.0.1) -> VITE_API_URL or http://localhost:8000
 * 4. Production Web -> window.location.origin or deployed HTTPS backend
 */
export const resolveServerBaseUrl = () => {
  // 1. Custom URL from localStorage
  const customUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('quickbite_api_url') : null;
  if (customUrl && customUrl.trim()) {
    return customUrl.trim().replace(/\/api\/?$/, '').replace(/\/$/, '');
  }

  // Environment variables
  const DEFAULT_PHYSICAL_ANDROID_URL = 'http://10.80.218.217:8000';
  const DEFAULT_PROD_URL = 'https://quickbite-9qd2.onrender.com';
  
  const envUrl = import.meta.env.VITE_API_URL;
  const androidEnvUrl = import.meta.env.VITE_ANDROID_API_URL;
  const prodUrl = (import.meta.env.VITE_PRODUCTION_API_URL || DEFAULT_PROD_URL).replace(/\/$/, '');

  // 2. Capacitor Native / WebView check
  const isNativePlatform = Capacitor.isNativePlatform();
  const isCapacitorWeb = typeof window !== 'undefined' && (
    window.location.protocol === 'capacitor:' || 
    (window.location.hostname === 'localhost' && window.location.port === '' && typeof navigator !== 'undefined' && /Capacitor|Android/i.test(navigator.userAgent))
  );

  if (isNativePlatform || isCapacitorWeb) {
    const emulatorDetected = isAndroidEmulator();

    if (emulatorDetected) {
      console.log('🤖 [API Config] Detected Android Emulator. Using http://10.0.2.2:8000');
      return 'http://10.0.2.2:8000';
    }

    // Physical Android device
    const targetPhysicalUrl = (androidEnvUrl && androidEnvUrl.trim())
      ? androidEnvUrl.trim().replace(/\/api\/?$/, '').replace(/\/$/, '')
      : DEFAULT_PHYSICAL_ANDROID_URL;

    console.log(`📱 [API Config] Detected Physical Android Device. Using ${targetPhysicalUrl}`);
    return targetPhysicalUrl;
  }

  // 3. Browser Development check
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    if (isLocalhost && window.location.port !== '') {
      if (envUrl && envUrl.trim()) {
        return envUrl.trim().replace(/\/api\/?$/, '').replace(/\/$/, '');
      }
      return 'http://localhost:8000';
    }

    // If loaded on non-localhost domain in browser (production web deployment)
    if (!isLocalhost) {
      return window.location.origin.replace(/\/$/, '');
    }
  }

  return prodUrl;
};

// Base server URL without trailing slash (e.g. "http://10.80.218.217:8000" or "http://localhost:8000")
export const SERVER_BASE_URL = resolveServerBaseUrl();

// API Base URL with /api suffix (e.g. "http://10.80.218.217:8000/api")
export const API_BASE_URL = `${SERVER_BASE_URL}/api`;

// Socket server URL
export const SOCKET_SERVER_URL = SERVER_BASE_URL;

export default API_BASE_URL;
