import React from 'react';
import { FaMinus, FaPlus, FaTrash } from 'react-icons/fa';
import './SharedCart.css';
import { url } from '../../assets/assets';

const SharedCart = ({ items, foodList, onAdd, onRemove, onDelete, disabled }) => {
  const lines = items.map((item) => {
    const food = foodList.find((product) => product._id === item.itemId) || {};
    const API_URL = url;
    const imageUrl = food.image && food.image.startsWith('http') ? food.image : `${API_URL}/images/${food.image}`;
    return {
      ...item,
      food,
      imageUrl,
      lineTotal: Number(food.price || 0) * Number(item.quantity || 0),
    };
  });

  return (
    <div className="shared-cart glass-card">
      <div className="shared-cart-header">
        <div>
          <p className="section-title">Shared Cart</p>
          <p className="section-subtitle">Everyone sees the same live cart.</p>
        </div>
      </div>
      <div className="shared-cart-list">
        {lines.length === 0 && <p className="empty-state">No items in the group cart yet.</p>}
        {lines.map((item) => (
          <div key={item.itemId} className="shared-cart-item">
            <img src={item.imageUrl} alt={item.food.name} />
            <div className="shared-cart-item-info">
              <h4>{item.food.name || 'Menu item'}</h4>
              <p>{item.addedBy} added this</p>
            </div>
            <div className="shared-cart-actions">
              <div className="qty-controls">
                <button type="button" onClick={() => onRemove(item.itemId)} disabled={disabled}>
                  <FaMinus />
                </button>
                <span>{item.quantity}</span>
                <button type="button" onClick={() => onAdd(item.itemId)} disabled={disabled}>
                  <FaPlus />
                </button>
              </div>
              <div className="shared-cart-price">
                <p>₹{item.lineTotal}</p>
                <button type="button" className="delete-btn" onClick={() => onDelete(item.itemId)} disabled={disabled}>
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SharedCart;
