import api from './apiService';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const groupOrderAPI = {
  createGroupOrder: async (payload) => {
    try {
      const response = await api.post('/group-order/create', payload, {
        headers: getHeaders(),
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  getGroupOrder: async (groupCode) => {
    try {
      const response = await api.get(`/group-order/${groupCode}`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },

  joinGroupOrder: async (payload) => {
    try {
      const response = await api.post('/group-order/join', payload);
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
  },
};
