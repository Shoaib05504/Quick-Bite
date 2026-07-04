import { createContext, useEffect, useState } from 'react';
import axios from 'axios';
import { profileAPI } from '../../services/apiService';

export const StoreContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const [food_list, setFoodList] = useState([]);
  const [foodLoading, setFoodLoading] = useState(true);
  const [foodError, setFoodError] = useState(null);
  const [token, setToken] = useState('');
  const [userProfile, setUserProfile] = useState(null);

  // ── Auth headers ─────────────────────────────────────────────────────────────
  const getAuthHeaders = (authToken = token) => ({
    headers: { Authorization: `Bearer ${authToken}` },
  });

  // ── Cart helpers ─────────────────────────────────────────────────────────────
  const sanitizeCart = (cart) =>
    Object.entries(cart || {}).reduce((acc, [itemId, qty]) => {
      const quantity = Number(qty);
      if (quantity > 0) acc[itemId] = quantity;
      return acc;
    }, {});

  const persistCart = async (nextCart, authToken = token) => {
    if (!authToken) return;
    try {
      await axios.post(`${API_URL}/api/cart/sync`, { cartData: nextCart }, getAuthHeaders(authToken));
    } catch (error) {
      console.error('Failed to sync cart:', error.message);
    }
  };

  // ── Add to cart ───────────────────────────────────────────────────────────────
  const addToCart = async (itemId) => {
    const updatedCart = sanitizeCart({ ...cartItems, [itemId]: (cartItems[itemId] || 0) + 1 });
    setCartItems(updatedCart);

    if (token) {
      try {
        const response = await axios.post(`${API_URL}/api/cart/add`, { itemId }, getAuthHeaders());
        if (response.data?.cartData) setCartItems(sanitizeCart(response.data.cartData));
      } catch (error) {
        console.error('Failed to add to cart:', error.message);
      }
    }
  };

  // ── Remove from cart ──────────────────────────────────────────────────────────
  const removeFromCart = async (itemId) => {
    const nextQty = (cartItems[itemId] || 0) - 1;
    const updatedCart = { ...cartItems };
    if (nextQty <= 0) delete updatedCart[itemId];
    else updatedCart[itemId] = nextQty;

    setCartItems(sanitizeCart(updatedCart));

    if (token) {
      try {
        const response = await axios.post(`${API_URL}/api/cart/remove`, { itemId }, getAuthHeaders());
        if (response.data?.cartData) setCartItems(sanitizeCart(response.data.cartData));
      } catch (error) {
        console.error('Failed to remove from cart:', error.message);
      }
    }
  };

  // ── Set exact quantity ────────────────────────────────────────────────────────
  const setCartQuantity = async (itemId, quantity) => {
    const qty = Math.max(0, Number(quantity) || 0);
    const updatedCart = { ...cartItems };
    if (qty === 0) delete updatedCart[itemId];
    else updatedCart[itemId] = qty;

    const sanitized = sanitizeCart(updatedCart);
    setCartItems(sanitized);

    if (token) {
      try {
        const endpoint = qty === 0 ? '/api/cart/delete' : '/api/cart/update';
        const payload = qty === 0 ? { itemId } : { itemId, quantity: qty };
        const response = await axios.post(`${API_URL}${endpoint}`, payload, getAuthHeaders());
        if (response.data?.cartData) setCartItems(sanitizeCart(response.data.cartData));
      } catch (error) {
        console.error('Failed to update cart quantity:', error.message);
      }
    }
  };

  const deleteFromCart = (itemId) => setCartQuantity(itemId, 0);

  // ── Bulk add items ────────────────────────────────────────────────────────────
  const addItemsToCart = async (items = []) => {
    if (!Array.isArray(items) || items.length === 0) return false;

    const updatedCart = { ...cartItems };
    items.forEach((item) => {
      let itemId = item._id || item.id || item.foodId;
      if (!itemId && item.name) {
        const matched = food_list.find((food) => food.name === item.name);
        itemId = matched?._id;
      }
      const qty = Number(item.quantity) || 1;
      if (!itemId) return;
      updatedCart[itemId] = (updatedCart[itemId] || 0) + qty;
    });

    const sanitized = sanitizeCart(updatedCart);
    setCartItems(sanitized);
    if (token) await persistCart(sanitized);
    return true;
  };

  // ── Cart totals ───────────────────────────────────────────────────────────────
  const getTotalCartAmount = () => {
    // Build a lookup map for O(1) access instead of O(n) find per item
    const foodMap = food_list.reduce((map, food) => {
      map[food._id] = food;
      return map;
    }, {});

    return Object.entries(cartItems).reduce((total, [itemId, qty]) => {
      if (qty > 0 && foodMap[itemId]) {
        total += foodMap[itemId].price * qty;
      }
      return total;
    }, 0);
  };

  const getTotalCartItems = () =>
    Object.values(cartItems).reduce((sum, qty) => sum + (Number(qty) > 0 ? Number(qty) : 0), 0);

  // ── Fetch food list ───────────────────────────────────────────────────────────
  const fetchFoodList = async () => {
    setFoodLoading(true);
    setFoodError(null);
    try {
      const response = await axios.get(`${API_URL}/api/food/list`);
      if (response.data?.success) {
        setFoodList(response.data.data || []);
      } else {
        throw new Error(response.data?.message || 'Failed to load food list');
      }
    } catch (error) {
      console.error('Failed to fetch food list:', error.message);
      setFoodError(error.message);
      setFoodList([]);
    } finally {
      setFoodLoading(false);
    }
  };

  // ── Load user profile ─────────────────────────────────────────────────────────
  const loadUserProfile = async (authToken = token) => {
    if (!authToken) { setUserProfile(null); return null; }
    try {
      const response = await profileAPI.getProfile();
      if (response.success && response.user) {
        setUserProfile(response.user);
        return response.user;
      }
    } catch (error) {
      console.error('Failed to load user profile:', error.message);
    }
    setUserProfile(null);
    return null;
  };

  // ── Load cart from server ─────────────────────────────────────────────────────
  const loadCartData = async (authToken) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/cart/get`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (response.data?.success) {
        setCartItems(sanitizeCart(response.data.cartData || {}));
      }
    } catch (error) {
      console.error('Failed to load cart:', error.message);
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────────
  const logout = () => {
    setToken('');
    setUserProfile(null);
    setCartItems({});
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
  };

  // ── Bootstrap on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    const bootstrap = async () => {
      await fetchFoodList();
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        setToken(savedToken);
        await Promise.all([loadCartData(savedToken), loadUserProfile(savedToken)]);
      }
    };
    bootstrap();
  }, []);

  const contextValue = {
    food_list,
    foodLoading,
    foodError,
    fetchFoodList,
    cartItems,
    setCartItems,
    userProfile,
    setUserProfile,
    loadUserProfile,
    addToCart,
    removeFromCart,
    setCartQuantity,
    deleteFromCart,
    addItemsToCart,
    getTotalCartAmount,
    getTotalCartItems,
    loadCartData,
    logout,
    url: API_URL, // keep for backward compat with existing components
    token,
    setToken,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
