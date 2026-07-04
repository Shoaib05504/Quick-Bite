import { useNavigate } from "react-router-dom";
import { FaUserShield, FaUtensils, FaEye, FaEyeSlash, FaUsers, FaReceipt, FaSmile, FaClipboardList } from "react-icons/fa";
import { useState } from "react";
import MagicBento from "../../components/MagicBento/MagicBento";
import "./RoleSelect.css";

const RoleSelect = () => {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const goAdmin = () => {
    setShowLogin(true);
  };

  const goCustomer = () => {
    localStorage.setItem("role", "customer");
    navigate("/home");
  };

  const goMoodBite = () => {
    localStorage.setItem("role", "customer");
    navigate("/home#moodbite");
  };

  const goMyOrders = () => {
    localStorage.setItem("role", "customer");
    navigate("/myorders");
  };

  const goCart = () => {
    localStorage.setItem("role", "customer");
    navigate("/cart");
  };

  const goSmartSplitBill = () => {
    localStorage.setItem("role", "customer");
    navigate("/smart-split-bill");
  };

  const handleAdminLogin = () => {
    if (name === "admin" && password === "1234") {
      localStorage.setItem("role", "admin");
      localStorage.setItem("adminName", name);
      window.location.href = "http://localhost:5175/";
    } else {
      setError("Invalid name or password ❌");
    }
  };

  const bentoCards = [
    {
      color: '#1a102f',
      title: 'Customer Portal',
      description: 'Browse local restaurants, place orders, create shared carts, and enjoy fast doorstep delivery.',
      label: 'Order Food',
      icon: <FaUtensils size={28} />,
      onClick: goCustomer,
      style: {
        border: '1px dashed rgba(168, 85, 247, 0.4)'
      }
    },
    {
      color: '#0e111a',
      title: 'Admin Portal',
      description: 'Manage menu items, view analytics, dispatch orders, and oversee restaurant activities.',
      label: 'Management',
      icon: <FaUserShield size={28} />,
      onClick: goAdmin,
      style: {
        border: '1px dashed rgba(168, 85, 247, 0.4)'
      }
    },
    {
      color: '#090d16',
      title: 'Group Ordering',
      description: 'Create shared carts with family and friends. Order together seamlessly and combine deliveries.',
      label: 'Social Eating',
      icon: <FaUsers size={24} />,
      onClick: goCart
    },
    {
      color: '#090d16',
      title: 'Smart Split Bill',
      description: 'Split the cost of your group meals effortlessly. Automated calculation and checkouts.',
      label: 'Payments',
      icon: <FaReceipt size={24} />,
      onClick: goSmartSplitBill
    },
    {
      color: '#090d16',
      title: 'MoodBite AI Recommendation',
      description: 'Feeling indecisive? Tell us your mood and let our recommendation engine select the perfect dish.',
      label: 'AI Assistant',
      icon: <FaSmile size={24} />,
      onClick: goMoodBite
    },
    {
      color: '#090d16',
      title: 'Real-Time Order Tracking',
      description: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#9ca3af', lineHeight: '1.5' }}>
            Track your order status in real time from confirmation to delivery with live status updates and estimated delivery time (ETA).
          </p>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            background: 'rgba(255, 255, 255, 0.03)', 
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.25rem 1rem',
            marginTop: '0.5rem',
            backdropFilter: 'blur(10px)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative', zIndex: 2 }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '50%', 
                background: '#a855f7', 
                boxShadow: '0 0 10px #a855f7',
                marginBottom: '0.5rem'
              }}></div>
              <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#fff', textAlign: 'center' }}>Confirmed</span>
            </div>

            <div style={{ height: '2px', background: '#a855f7', flex: 0.6, position: 'relative', top: '-10px', zIndex: 1 }}></div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative', zIndex: 2 }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '50%', 
                background: '#a855f7', 
                boxShadow: '0 0 10px #a855f7',
                marginBottom: '0.5rem'
              }}></div>
              <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#fff', textAlign: 'center' }}>Preparing</span>
            </div>

            <div style={{ height: '2px', background: 'rgba(255, 255, 255, 0.1)', flex: 0.6, position: 'relative', top: '-10px', zIndex: 1 }}></div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative', zIndex: 2 }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '50%', 
                background: 'rgba(255, 255, 255, 0.2)', 
                marginBottom: '0.5rem'
              }}></div>
              <span style={{ fontSize: '0.72rem', fontWeight: '600', color: '#9ca3af', textAlign: 'center' }}>Out for Delivery</span>
            </div>

            <div style={{ height: '2px', background: 'rgba(255, 255, 255, 0.1)', flex: 0.6, position: 'relative', top: '-10px', zIndex: 1 }}></div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative', zIndex: 2 }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '50%', 
                background: 'rgba(255, 255, 255, 0.2)', 
                marginBottom: '0.5rem'
              }}></div>
              <span style={{ fontSize: '0.72rem', fontWeight: '600', color: '#9ca3af', textAlign: 'center' }}>Delivered</span>
            </div>
          </div>
        </div>
      ),
      label: 'Order Status',
      icon: <FaClipboardList size={24} />,
      onClick: goMyOrders
    }
  ];

  return (
    <div className="home-container">
      <div className="landing-hero">
        <h1 className="main-title">Welcome to <span className="highlight">QuickBite</span></h1>
        <p className="subtitle">Select your portal below to get started, or explore our premium features</p>
      </div>

      <div className="bento-wrapper">
        <MagicBento 
          cards={bentoCards}
          textAutoHide={false}
          enableStars={true}
          enableSpotlight={true}
          enableBorderGlow={true}
          enableTilt={true}
          enableMagnetism={true}
          clickEffect={true}
          spotlightRadius={500}
          particleCount={12}
          glowColor="168, 85, 247"
        />
      </div>

      {showLogin && (
        <div className="login-popup">
          <div className="login-box">
            <h3>Admin Login 🔐</h3>

            <div className="input-field">
              <input
                type="text"
                placeholder="Enter name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <button onClick={handleAdminLogin}>Login</button>

            {error && <p className="error">{error}</p>}

            <p className="close" onClick={() => setShowLogin(false)}>
              Close
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSelect;