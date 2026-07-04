import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import './Dashboard.css';
import { assets } from '../../assets/assets';

const Dashboard = ({ url }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalFoodItems: 0,
  });
  const [ordersOverview, setOrdersOverview] = useState({ daily: [], weekly: [], monthly: [] });
  const [revenueOverview, setRevenueOverview] = useState({ weekly: [], monthly: [] });
  const [statusBreakdown, setStatusBreakdown] = useState([]);
  const [topSellingFoods, setTopSellingFoods] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [ordersMode, setOrdersMode] = useState('daily');
  const [revenueMode, setRevenueMode] = useState('weekly');

  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${url}/api/order/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setSummary(response.data.data.summary || {});
          setOrdersOverview(response.data.data.ordersOverview || { daily: [], weekly: [], monthly: [] });
          setRevenueOverview(response.data.data.revenueOverview || { weekly: [], monthly: [] });
          setStatusBreakdown(response.data.data.statusBreakdown || []);
          setTopSellingFoods(response.data.data.topSellingFoods || []);
          setRecentOrders(response.data.data.recentOrders || []);
        } else {
          setError(response.data.message || 'Unable to load analytics');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Unable to load analytics');
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [url]);

  const renderStatusLabel = (status) => {
    const mapping = {
      Delivered: '#6C5CE7',
      Preparing: '#00b894',
      Pending: '#fdcb6e',
      Cancelled: '#d63031',
    };
    return mapping[status] || '#8884d8';
  };

  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString()}`;

  const orderCards = [
    { label: 'Total Orders', value: summary.totalOrders, accent: 'rgba(108, 92, 231, 0.15)' },
    { label: 'Total Revenue', value: formatCurrency(summary.totalRevenue), accent: 'rgba(0, 184, 148, 0.15)' },
    { label: 'Total Users', value: summary.totalUsers, accent: 'rgba(255, 234, 167, 0.15)' },
    { label: 'Food Items', value: summary.totalFoodItems, accent: 'rgba(162, 155, 254, 0.15)' },
  ];

  const ordersData = ordersOverview[ordersMode] || [];
  const revenueData = revenueOverview[revenueMode] || [];

  return (
    <div className="dashboard-page">
      <div className="dashboard-topbar">
        <div>
          <p className="dashboard-subtitle">Admin Analytics</p>
          <h1>Premium QuickBite Dashboard</h1>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-loading">Loading analytics…</div>
      ) : error ? (
        <div className="dashboard-error">{error}</div>
      ) : (
        <>
          <div className="dashboard-summary-grid">
            {orderCards.map((card) => (
              <div key={card.label} className="dashboard-summary-card" style={{ background: card.accent }}>
                <h3>{card.label}</h3>
                <p>{card.value}</p>
              </div>
            ))}
          </div>

          <div className="dashboard-charts-grid">
            <div className="dashboard-chart-card chart-analytics">
              <div className="chart-card-header">
                <div>
                  <h3>Order Trends</h3>
                  <p>Daily, weekly and monthly order history</p>
                </div>
                <div className="chart-tabs">
                  {['daily', 'weekly', 'monthly'].map((option) => (
                    <button
                      key={option}
                      className={ordersMode === option ? 'active' : ''}
                      onClick={() => setOrdersMode(option)}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ordersData} margin={{ top: 20, right: 12, left: -10, bottom: 5 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                  <XAxis dataKey="label" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', color: '#fff' }} />
                  <Line type="monotone" dataKey="value" stroke="#6c5ce7" strokeWidth={3} dot={{ r: 4, stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="dashboard-chart-card chart-analytics">
              <div className="chart-card-header">
                <div>
                  <h3>Revenue Analytics</h3>
                  <p>Real revenue performance from orders</p>
                </div>
                <div className="chart-tabs">
                  {['weekly', 'monthly'].map((option) => (
                    <button
                      key={option}
                      className={revenueMode === option ? 'active' : ''}
                      onClick={() => setRevenueMode(option)}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData} margin={{ top: 20, right: 12, left: -10, bottom: 5 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                  <XAxis dataKey="label" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', color: '#fff' }} />
                  <Bar dataKey="value" fill="#00b894" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="dashboard-chart-card status-chart-card">
              <div className="chart-card-header">
                <div>
                  <h3>Order Status</h3>
                  <p>Delivered, preparing, pending, cancelled</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusBreakdown} dataKey="value" nameKey="label" innerRadius={70} outerRadius={100} paddingAngle={4}>
                    {statusBreakdown.map((entry, index) => (
                      <Cell key={`slice-${entry.label}`} fill={renderStatusLabel(entry.label)} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="status-legend">
                {statusBreakdown.map((item) => (
                  <div key={item.label} className="status-legend-item">
                    <span style={{ background: renderStatusLabel(item.label) }} />
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="dashboard-bottom-grid">
            <div className="dashboard-list-card">
              <div className="list-card-header">
                <h3>Top Selling Foods</h3>
              </div>
              <div className="food-list">
                {topSellingFoods.map((food) => {
                  const imgSrc = food.image
                    ? (food.image.startsWith('http') ? food.image : `${url}/images/${food.image}`)
                    : null;
                  return (
                    <div key={food.name} className="food-row">
                      <div className="food-meta">
                        {imgSrc ? (
                          <img src={imgSrc} alt={food.name} onError={(e) => { e.target.onerror = null; e.target.src = assets.parcel_icon; }} />
                        ) : (
                          <div className="food-fallback" />
                        )}
                        <div>
                          <h4>{food.name}</h4>
                          <p>{food.count} orders</p>
                        </div>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${food.progress}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="dashboard-list-card recent-orders-card">
              <div className="list-card-header">
                <h3>Recent Orders</h3>
              </div>
              <div className="orders-table">
                <div className="orders-table-head">
                  <span>ID</span>
                  <span>Customer</span>
                  <span>Amount</span>
                  <span>Status</span>
                  <span>Date</span>
                </div>
                {recentOrders.map((order) => (
                  <div key={order.orderId} className="orders-table-row">
                    <span>{String(order.orderId).slice(-6)}</span>
                    <span>{order.customer}</span>
                    <span>{formatCurrency(order.amount)}</span>
                    <span className={`status-badge ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>{order.status}</span>
                    <span>{new Date(order.date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
