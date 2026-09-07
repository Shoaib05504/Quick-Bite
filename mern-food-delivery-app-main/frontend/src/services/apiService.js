import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

// Axios instance with extended timeout (60s) for Render cold starts
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// Automatic retry interceptor to handle Render free-tier cold starts (502/503/504 or ECONNABORTED)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    // Initialize retry counter
    config.__retryCount = config.__retryCount || 0;
    const MAX_RETRIES = 2;

    const isNetworkOrColdStart =
      error.code === 'ECONNABORTED' ||
      error.message?.includes('timeout') ||
      !error.response ||
      [502, 503, 504].includes(error.response?.status);

    if (isNetworkOrColdStart && config.__retryCount < MAX_RETRIES) {
      config.__retryCount += 1;
      const delayMs = config.__retryCount * 2500;
      console.warn(`⏳ [API Service] Render cold start / timeout detected. Retrying request (${config.__retryCount}/${MAX_RETRIES}) in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return api(config);
    }

    return Promise.reject(error);
  }
);

// Helper for formatted error messages
const formatError = (error) => {
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'Server connection timed out. The server may be starting up, please try again in a few seconds.';
  }
  if (!error.response) {
    return 'Network error. Please check your internet connection and try again.';
  }
  return error.response?.data?.message || error.message || 'An unexpected error occurred.';
};

// ── Auth header helper ────────────────────────────────────────────────────────
// Uses standard Authorization: Bearer <token> header
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ── User Profile APIs ─────────────────────────────────────────────────────────
export const profileAPI = {
  getProfile: async () => {
    try {
      const response = await api.get('/user/profile', { headers: getAuthHeaders() });
      return response.data;
    } catch (error) {
      return { success: false, message: formatError(error) };
    }
  },

  updateProfile: async (profileData) => {
    try {
      // NOTE: userId is no longer sent in body — backend reads it from JWT
      const response = await api.post('/user/profile/update', profileData, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      return { success: false, message: formatError(error) };
    }
  },

  changePassword: async (passwordData) => {
    try {
      const response = await api.post('/user/password/change', passwordData, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      return { success: false, message: formatError(error) };
    }
  },
};

// ── Address APIs ──────────────────────────────────────────────────────────────
export const addressAPI = {
  addAddress: async (addressData) => {
    try {
      const response = await api.post('/user/address/add', addressData, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      return { success: false, message: formatError(error) };
    }
  },

  editAddress: async (addressData) => {
    try {
      const response = await api.post('/user/address/edit', addressData, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      return { success: false, message: formatError(error) };
    }
  },

  deleteAddress: async (addressId) => {
    try {
      const response = await api.post('/user/address/delete', { addressId }, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      return { success: false, message: formatError(error) };
    }
  },
};

// ── Notification APIs ─────────────────────────────────────────────────────────
export const notificationAPI = {
  getNotifications: async () => {
    try {
      const response = await api.get('/user/notifications', { headers: getAuthHeaders() });
      return response.data;
    } catch (error) {
      return { success: false, message: formatError(error) };
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const response = await api.post('/user/notifications/read', { notificationId }, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      return { success: false, message: formatError(error) };
    }
  },
};

// ── Order APIs ────────────────────────────────────────────────────────────────
export const orderAPI = {
  getUserOrders: async () => {
    try {
      const response = await api.post('/order/userorders', {}, { headers: getAuthHeaders() });
      return response.data;
    } catch (error) {
      return { success: false, message: formatError(error) };
    }
  },
};

export default api;
