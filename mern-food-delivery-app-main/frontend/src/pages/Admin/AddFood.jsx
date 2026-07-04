import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import './Admin.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const CATEGORIES = ['Salad', 'Rolls', 'Deserts', 'Sandwich', 'Cake', 'Pure Veg', 'Pasta', 'Noodles'];

const AddFood = () => {
  const [data, setData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/food/add`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Food item added successfully!');
        setData({ name: '', description: '', price: '', category: '', image: '' });
      } else {
        toast.error(response.data.message || 'Failed to add food item.');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('Admin access required.');
      } else {
        toast.error(error.response?.data?.message || 'Network error.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add Food Item</h3>
      <input name="name" placeholder="Name" value={data.name} onChange={handleChange} required minLength={2} />
      <input name="description" placeholder="Description" value={data.description} onChange={handleChange} required minLength={5} />
      <input name="price" type="number" placeholder="Price (₹)" value={data.price} onChange={handleChange} required min={1} />
      <select name="category" value={data.category} onChange={handleChange} required>
        <option value="">Select Category</option>
        {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
      </select>
      <input name="image" placeholder="Image URL" value={data.image} onChange={handleChange} required />
      <button type="submit" disabled={loading}>
        {loading ? 'Adding...' : 'Add Food'}
      </button>
    </form>
  );
};

export default AddFood;