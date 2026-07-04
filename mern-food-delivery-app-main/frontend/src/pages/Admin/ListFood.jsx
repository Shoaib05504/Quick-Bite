import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'development' ? 'http://localhost:8000' : '');

const ListFood = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFood = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/food/list`);
      if (res.data?.success) {
        setList(res.data.data || []);
      }
    } catch (error) {
      toast.error('Failed to load food items.');
    } finally {
      setLoading(false);
    }
  };

  const deleteFood = async (id) => {
    try {
      const token = localStorage.getItem('token');
      // Correct: DELETE uses POST /api/food/remove with body {id}
      const response = await axios.post(
        `${API_URL}/api/food/remove`,
        { id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data?.success) {
        toast.success('Food item deleted.');
        fetchFood();
      } else {
        toast.error(response.data?.message || 'Failed to delete item.');
      }
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Admin access required.');
      } else {
        toast.error('Failed to delete food item.');
      }
    }
  };

  useEffect(() => { fetchFood(); }, []);

  if (loading) return <div>Loading food items...</div>;

  return (
    <div>
      <h3>Food List ({list.length} items)</h3>
      {list.length === 0 && <p>No food items found.</p>}
      {list.map((item) => (
        <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span>{item.name}</span>
          <span>₹{item.price}</span>
          <span style={{ color: '#888', fontSize: '12px' }}>{item.category}</span>
          <button onClick={() => deleteFood(item._id)} style={{ color: 'red' }}>Delete</button>
        </div>
      ))}
    </div>
  );
};

export default ListFood;