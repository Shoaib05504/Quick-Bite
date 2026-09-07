import React, { useState, useContext, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar/Navbar';
import { Route, Routes, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import Home from './pages/Home/Home';
import Cart from './pages/Cart/Cart';
import Admin from './pages/Admin/Admin.jsx';
import PlaceOrder from './pages/PlaceOrder/PlaceOrder';
import Footer from './components/Footer/Footer';
import LoginPopup from './components/LoginPopup/LoginPopup';
import Verify from './pages/Verify/Verify';
import MyOrders from './pages/MyOrders/MyOrders';
import Success from './pages/Success';
import RoleSelect from './pages/RoleSelect/RoleSelect';
import TrackOrder from './pages/TrackOrder/TrackOrder';
import OrderDetails from './pages/OrderDetails/OrderDetails';
import Chatbot from './components/Chatbot/Chatbot';
import Profile from './pages/Profile/Profile';
import ProfileDashboard from './pages/ProfileDashboard/ProfileDashboard';
import GroupOrder from './pages/GroupOrder/GroupOrder';
import SmartSplitBill from './pages/SmartSplitBill/SmartSplitBill';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { StoreContext } from './components/context/StoreContext';
import GroupOrderModal from './components/GroupOrderModal/GroupOrderModal';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const App = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const { token } = useContext(StoreContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Auto-open login popup when redirected by ProtectedRoute
  useEffect(() => {
    if (searchParams.get('login') === '1' && !token) {
      setShowLogin(true);
    }
  }, [searchParams, token]);

  // Deep link listener for quickbite://home return flow from Admin Panel
  useEffect(() => {
    let listenerHandler = null;
    const setupDeepLink = async () => {
      try {
        listenerHandler = await CapacitorApp.addListener('appUrlOpen', (event) => {
          const url = event?.url;
          console.log('📱 Deep Link received:', url);
          if (url && (url === 'quickbite://home' || url.startsWith('quickbite://home') || url.startsWith('quickbite://'))) {
            navigate('/');
          }
        });
      } catch (err) {
        console.warn('Capacitor App listener notice:', err?.message || err);
      }
    };
    setupDeepLink();
    return () => {
      if (listenerHandler && typeof listenerHandler.remove === 'function') {
        listenerHandler.remove();
      }
    };
  }, [navigate]);

  // Handle food search submission when Enter key is pressed
  const handleSearchSubmit = (queryText) => {
    const query = (queryText !== undefined ? queryText : search).trim();
    setSubmittedSearch(query);

    if (query !== '') {
      if (window.location.pathname !== '/home') {
        navigate('/home');
      }
      setTimeout(() => {
        const foodSection = document.getElementById('food-display') || document.getElementById('explore-menu');
        if (foodSection) {
          foodSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 120);
    }
  };

  const handleSearchClear = () => {
    setSubmittedSearch('');
  };

  return (
    <>
      {/* Single toast library — removed duplicate react-toastify */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2600,
          style: {
            background: 'rgba(18, 12, 40, 0.94)',
            color: '#f8f7ff',
            border: '1px solid rgba(159, 81, 255, 0.3)',
            boxShadow: '0 24px 50px rgba(95, 56, 255, 0.18)',
            borderRadius: '18px',
            backdropFilter: 'blur(10px)',
          },
        }}
      />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        pauseOnHover={false}
        closeOnClick={true}
        hideProgressBar={false}
      />

      {showLogin && <LoginPopup setShowLogin={setShowLogin} />}
      {showGroupModal && (
        <GroupOrderModal
          cartLines={[]}
          onClose={() => setShowGroupModal(false)}
        />
      )}

      <div className="app">
        <Navbar
          setShowLogin={setShowLogin}
          search={search}
          setSearch={setSearch}
          onSearchSubmit={handleSearchSubmit}
          onSearchClear={handleSearchClear}
          onOpenGroupModal={() => setShowGroupModal(true)}
        />

        <Routes>
          {/* Public routes */}
          <Route path="/" element={<RoleSelect />} />
          <Route
            path="/home"
            element={
              <Home
                search={search}
                submittedSearch={submittedSearch}
                setSearch={setSearch}
                onOpenGroupModal={() => setShowGroupModal(true)}
              />
            }
          />
          <Route path="/verify" element={<Verify />} />
          <Route path="/success" element={<Success />} />
          <Route path="/track/:id" element={<TrackOrder />} />
          <Route path="/group-order/:groupCode" element={<GroupOrder />} />
          <Route path="/smart-split-bill" element={<SmartSplitBill />} />

          {/* Protected routes — redirect to login if not authenticated */}
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/order" element={<ProtectedRoute><PlaceOrder /></ProtectedRoute>} />
          <Route path="/myorders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile-dashboard" element={<ProtectedRoute><ProfileDashboard /></ProtectedRoute>} />
          <Route path="/order-details" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />

          {/* Admin route — role check from JWT payload via context */}
          <Route
            path="/admin"
            element={
              token && localStorage.getItem('role') === 'admin'
                ? <Admin />
                : <Navigate to="/" replace />
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>

      <Footer />
      <Chatbot />
    </>
  );
};

export default App;