import React, { useContext, useEffect, useState } from 'react'
import './MyOrders.css'
import { StoreContext } from './../../components/context/StoreContext';
import axios from 'axios';
import { assets } from './../../assets/assets';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const MyOrders = () => {
  const { url, token } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchOrders = async () => {
    if (!token) {
      setError('Please log in to view your orders.');
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${url}/api/order/userorders`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) {
        const sortedOrders = Array.isArray(response.data.data)
          ? [...response.data.data].sort((a, b) => new Date(b.date) - new Date(a.date))
          : [];
        setOrders(sortedOrders);
        setError('');
      } else {
        setOrders([]);
        setError(response.data.message || 'Unable to load orders.');
      }
    } catch (err) {
      setOrders([]);
      setError(err.response?.data?.message || err.message || 'Unable to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const formatOrderDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleReorder = (orderId) => {
    toast.success('Reorder request sent.');
    // future: navigate to reorder workflow or add items to cart
  };

  return (
    <div className="my-orders-page">
      <div className="my-orders-header">
        <div>
          <p className="panel-label">Order History</p>
          <h2>My Orders</h2>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><h3>Loading orders...</h3></div>
      ) : error ? (
        <div className="empty-state"><h3>{error}</h3></div>
      ) : orders.length === 0 ? (
        <div className="empty-state"><h3>No orders found.</h3></div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const orderId = order._id || order.id;
            const item = order.items?.[0] || {};
            const itemNames = Array.isArray(order.items)
              ? order.items.map((it) => it.name || 'Item').filter(Boolean)
              : [];
            const itemCount = itemNames.length;
            const itemsPreview = itemCount
              ? itemNames.slice(0, 2).join(', ') + (itemCount > 2 ? ` +${itemCount - 2} more` : '')
              : 'Order items';
            const totalQuantity = Array.isArray(order.items)
              ? order.items.reduce((sum, it) => sum + (Number(it.quantity ?? it.qty ?? 1) || 1), 0)
              : 0;
            const currencyAmount = order.amount?.toFixed ? order.amount.toFixed(0) : order.amount || '0';
            const isSavedDelivered = localStorage.getItem(`track_order_status_${orderId}`) === 'Delivered';
            const displayStatus = isSavedDelivered ? 'Delivered' : (order.status || 'Processing');
            const normalizedStatus = String(displayStatus).toLowerCase();
            const statusClass = normalizedStatus.includes('delivered')
              ? 'delivered'
              : normalizedStatus.includes('cancel')
              ? 'cancelled'
              : normalizedStatus.includes('out') || normalizedStatus.includes('delivery')
              ? 'out-for-delivery'
              : normalizedStatus.includes('process')
              ? 'processing'
              : 'default';
            const paymentText = order.paymentStatus || (typeof order.payment !== 'undefined'
              ? (order.payment === true ? 'Paid' : 'Pending')
              : (order.paid ? 'Paid' : 'Pending'));
            const paymentClass = String(paymentText).toLowerCase() === 'paid' ? 'paid' : 'pending';

            return (
              <div key={orderId} className="my-orders-card">
                <div className="my-orders-card-image">
                  <img
                    src={item.image || assets.parcel_icon}
                    alt={item.name || 'Food item'}
                    onError={(e) => { e.target.src = assets.parcel_icon; }}
                  />
                </div>

                <div className="my-orders-card-content">
                  <div className="my-orders-card-header">
                    <div>
                      <h3>{item.name || 'Food item'}</h3>
                      <p className="order-restaurant">{order.restaurant || item.restaurant || 'QuickBite'}</p>
                    </div>
                    <span className={`order-status ${statusClass}`}>{displayStatus}</span>
                  </div>

                  <div className="order-detail-grid">
                    <div className="order-detail-block">
                      <span>Ordered</span>
                      <strong>{formatOrderDate(order.date)}</strong>
                    </div>
                    <div className="order-detail-block">
                      <span>Items</span>
                      <strong>{itemsPreview}</strong>
                    </div>
                    <div className="order-detail-block">
                      <span>Quantity</span>
                      <strong>{totalQuantity}</strong>
                    </div>
                    <div className="order-detail-block">
                      <span>Payment</span>
                      <strong className={`payment-tag ${paymentClass}`}>{paymentText}</strong>
                    </div>
                  </div>

                  <div className="my-orders-card-footer">
                    <div>
                      <p className="order-summary-label">Total amount</p>
                      <p className="order-price">₹{currencyAmount}</p>
                    </div>
                    <div className="order-summary-meta">
                      <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                      <span>{order.location || order.deliveryAddress?.city || 'QuickBite delivery'}</span>
                    </div>
                  </div>
                </div>

                <div className="my-orders-card-actions">
                  <button className="btn btn-secondary small" onClick={() => navigate(`/track/${orderId}`)}>Track Order</button>
                  <button className="btn btn-primary small" onClick={() => handleReorder(orderId)}>Reorder</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
