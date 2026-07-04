import axios from 'axios';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (import.meta.env.MODE === 'development') {
    return envUrl ? `${envUrl}/api` : 'http://localhost:8000/api';
  }
  if (typeof window !== 'undefined') {
    if (envUrl && !envUrl.includes(window.location.hostname) && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return `${window.location.origin}/api`;
    }
    return envUrl ? `${envUrl}/api` : '/api';
  }
  return envUrl ? `${envUrl}/api` : '/api';
};
const API_BASE_URL = getApiBaseUrl();

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

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
      return { success: false, message: error.response?.data?.message || error.message };
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
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  changePassword: async (passwordData) => {
    try {
      const response = await api.post('/user/password/change', passwordData, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
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
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  editAddress: async (addressData) => {
    try {
      const response = await api.post('/user/address/edit', addressData, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  deleteAddress: async (addressId) => {
    try {
      const response = await api.post('/user/address/delete', { addressId }, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
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
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const response = await api.post('/user/notifications/read', { notificationId }, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
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
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },
};

export default api;
