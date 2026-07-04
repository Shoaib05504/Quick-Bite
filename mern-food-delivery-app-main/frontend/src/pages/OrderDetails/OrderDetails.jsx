import React, { useState, useEffect, useContext } from "react";
import "./OrderDetails.css";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaStore, FaMapMarkerAlt, FaUtensils, FaReceipt, FaRegClock, FaUser, FaPhone } from "react-icons/fa";
import { StoreContext } from "../../components/context/StoreContext";
import axios from "axios";

const OrderDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;
  const { url, token } = useContext(StoreContext);
  const [dbOrder, setDbOrder] = useState(null);
  const activeOrder = dbOrder || order;

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!token) return;
      try {
        const orderId = order?._id || order?.id || location.state?.order?._id || location.state?.order?.id;
        if (!orderId) return;
        const response = await axios.post(`${url}/api/order/userorders`, {}, { headers: { Authorization: `Bearer ${token}` } });
        if (response.data.success) {
          const matched = response.data.data.find(o => String(o._id || o.id) === String(orderId));
          if (matched) {
            setDbOrder(matched);
          }
        }
      } catch (err) {
        console.error("Error fetching order details", err);
      }
    };
    fetchOrderDetails();
  }, [order, token, url, location.state]);

  const orderItems = activeOrder?.items ?? [
    { name: "Farmhouse Pizza", quantity: 1, price: 299 },
    { name: "Cheese Burger", quantity: 2, price: 120 },
    { name: "Coca Cola", quantity: 1, price: 40 },
  ];

  const getOrderItemIcon = (name) => {
    const lower = String(name || "").toLowerCase();
    if (lower.includes("pizza")) return "🍕";
    if (lower.includes("burger")) return "🍔";
    if (lower.includes("cola") || lower.includes("coke") || lower.includes("drink")) return "🥤";
    return "🛒";
  };

  const subtotal = orderItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  const deliveryFee = activeOrder ? 2 : 40;
  const taxes = activeOrder ? 0 : 21;
  const grandTotal = activeOrder?.amount ?? subtotal + deliveryFee + taxes;
  
  let paymentMethod = "Cash on Delivery";
  if (activeOrder?.paymentMethod) {
    paymentMethod = activeOrder.paymentMethod;
  } else if (activeOrder?.payment === true) {
    paymentMethod = "UPI";
  }

  const deliveryAddress = order?.address || {
    firstName: "Shoaib",
    lastName: "",
    phone: "+91 XXXXX XXXXX",
    street: "Whitefield",
    city: "Bangalore",
    state: "Karnataka",
    zipcode: "560066",
    country: "India",
  };

  const orderId = activeOrder?._id || activeOrder?.id || order?._id || order?.id;
  const isSavedDelivered = String(activeOrder?.status || "").toLowerCase().includes("deliver") ||
    (orderId && localStorage.getItem(`track_order_status_${orderId}`) === 'Delivered');

  const displayStatus = isSavedDelivered ? 'Delivered' : (activeOrder?.status || 'placed');

  const getStatusHeading = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('delivered')) return "DELIVERED SUCCESSFULLY";
    if (s.includes('out') || s.includes('way')) return "ON THE WAY";
    if (s.includes('prepare') || s.includes('process')) return "PREPARING YOUR ORDER";
    return "ORDER PLACED";
  };

  const statusLabel = getStatusHeading(displayStatus);

  const getStatusStep = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('delivered')) return 3;
    if (s.includes('out') || s.includes('way')) return 2;
    if (s.includes('prepare') || s.includes('process')) return 1;
    return 0; // Default: Order Placed
  };

  const currentStep = getStatusStep(displayStatus);
  const steps = [
    { label: "Order Placed", icon: "📝" },
    { label: "Preparing", icon: "🍳" },
    { label: "On The Way", icon: "🛵" },
    { label: "Delivered", icon: "🎉" }
  ];

  return (
    <div className="order-details-page-wrapper">
      <div className="order-details glass-container">

        <div className="top-bar">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Original Order Details
          </button>
          <span className="order-id-badge">{activeOrder ? `#${activeOrder._id || activeOrder.id}` : "#ORD2456"}</span>
        </div>

        <div className="status-box glass-card">
          <div className="status-header">
            <h3>
              <FaRegClock className="section-title-icon animate-pulse" /> {statusLabel}
            </h3>
            {!isSavedDelivered && <span className="eta-badge">Estimated Delivery: 25 mins</span>}
          </div>
          
          <div className="progress-tracker">
            <div className="progress-bar-line">
              <div 
                className="progress-line-fill" 
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }} 
              />
            </div>
            <div className="progress-steps">
              {steps.map((step, idx) => (
                <div key={idx} className={`step-node ${idx <= currentStep ? 'active' : ''}`}>
                  <div className="step-icon">{step.icon}</div>
                  <span className="step-label">{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="restaurant-box glass-card">
          <h3>
            <FaStore className="section-title-icon" /> QuickBite
          </h3>
          <div className="restaurant-info">
            <span className="rating-badge">⭐ 4.5</span>
            <span className="cuisine-badge">Fast Food</span>
          </div>
        </div>

        <div className="address-box glass-card">
          <h3>
            <FaMapMarkerAlt className="section-title-icon" /> DELIVERY ADDRESS
          </h3>
          <div className="address-details">
            <p className="recipient-name">
              <FaUser className="detail-icon" /> {deliveryAddress.firstName} {deliveryAddress.lastName}
            </p>
            <p className="phone-number">
              <FaPhone className="detail-icon" /> {deliveryAddress.phone}
            </p>
            <div className="address-text-block">
              <p>{deliveryAddress.street}</p>
              <p>{deliveryAddress.city}, {deliveryAddress.state} - {deliveryAddress.zipcode}</p>
              <p className="country">{deliveryAddress.country}</p>
            </div>
          </div>
        </div>

        <div className="items-box glass-card">
          <h3>
            <FaUtensils className="section-title-icon" /> ORDERED ITEMS
          </h3>
          <div className="items-list">
            {orderItems.map((item, index) => (
              <div key={index} className="item-row">
                <div className="item-details">
                  <span className="item-icon-pill">{getOrderItemIcon(item.name)}</span>
                  <div>
                    <h4>{item.name}</h4>
                    <p className="qty-label">Qty: {item.quantity}</p>
                  </div>
                </div>
                <p className="item-price">₹{(item.price || 0) * (item.quantity || 1)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bill-box glass-card receipt-card">
          <h3>
            <FaReceipt className="section-title-icon" /> BILL SUMMARY
          </h3>

          <div className="bill-details">
            <div className="bill-row">
              <p>Subtotal</p>
              <p className="bill-value">₹{subtotal}</p>
            </div>

            <div className="bill-row">
              <p>Delivery Fee</p>
              <p className="bill-value">₹{deliveryFee}</p>
            </div>

            <div className="bill-row">
              <p>Taxes</p>
              <p className="bill-value">₹{taxes}</p>
            </div>

            <div className="receipt-divider" />

            <div className="bill-row total">
              <h3>Grand Total</h3>
              <h3 className="grand-total-val">₹{grandTotal}</h3>
            </div>

            <div className="payment-method-pill">
              <span>💰 Payment Mode</span>
              <strong>{paymentMethod}</strong>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderDetails;