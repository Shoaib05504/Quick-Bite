import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { toast as toastify } from "react-toastify";
import { FaShoppingCart, FaBolt } from "react-icons/fa";
import "./FoodItem.css";
import { StoreContext } from "../context/StoreContext";
import { assets } from "../../assets/assets";

const FoodItem = ({ id, name, price, description, image }) => {
  const { cartItems, addToCart, url } = useContext(StoreContext);
  const navigate = useNavigate();
  const API_URL = url || import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const imageSrc =
    image && image.startsWith('http')
      ? image
      : `${API_URL}/images/${image}`;

  const handleAddToCart = () => {
    addToCart(id);
    toast.success(`${name} added to cart`);
  };

  const handleOrderNow = () => {
    if (!cartItems[id]) {
      addToCart(id);
    }
    toastify.success("✅ Order placed successfully! Preparing your delicious meal 🍽️", {
      position: "top-right",
      autoClose: 3000,
      pauseOnHover: false,
      closeOnClick: true,
      hideProgressBar: false,
      style: {
        background: "linear-gradient(135deg, #064E3B, #16A34A)",
        color: "#ffffff",
      },
    });
    setTimeout(() => {
      navigate("/order");
    }, 300);
  };

  return (
    <div className="food-item">
      <div className="food-item-img-container">
        <img src={imageSrc} className="food-item-image" alt={name} />
        {cartItems[id] > 0 && (
          <span className="food-item-qty-badge">{cartItems[id]} in cart</span>
        )}
      </div>

      <div className="food-item-info">
        <div className="food-item-name-rating">
          <p>{name}</p>
          <img src={assets.rating_starts} alt="rating" />
        </div>
        <p className="food-item-desc">{description}</p>
        <p className="food-item-price">₹{price}</p>
        <div className="food-item-actions">
          <button type="button" className="food-btn food-btn-cart" onClick={handleAddToCart}>
            <FaShoppingCart /> Add to Cart
          </button>
          <button type="button" className="food-btn food-btn-order" onClick={handleOrderNow}>
            <FaBolt /> Order Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodItem;
