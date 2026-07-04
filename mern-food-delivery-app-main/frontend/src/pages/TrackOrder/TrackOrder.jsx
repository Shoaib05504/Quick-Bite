import { useState, useEffect, useMemo, useContext } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import "./TrackOrder.css";
import { useParams } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { StoreContext } from "../../components/context/StoreContext";
import axios from "axios";

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RESTAURANT_POSITION = [12.9762, 77.6033];

function AutoPan({ position }) {
  const map = useMap();

  useEffect(() => {
    if (!position || !map) return;
    map.flyTo(position, map.getZoom(), {
      duration: 1.1,
    });
  }, [position, map]);

  return null;
}

function FitBounds({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (!positions || positions.length === 0 || !map) return;
    map.fitBounds(positions, {
      padding: [40, 40],
      maxZoom: 15,
    });
  }, [map, positions]);

  return null;
}

const TrackOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state?.order;
  const { url, token } = useContext(StoreContext);
  const [dbOrder, setDbOrder] = useState(null);
  const activeOrder = dbOrder || order;

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!token) return;
      try {
        const response = await axios.post(`${url}/api/order/userorders`, {}, { headers: { Authorization: `Bearer ${token}` } });
        if (response.data.success) {
          const matched = response.data.data.find(o => String(o._id || o.id) === String(id));
          if (matched) {
            setDbOrder(matched);
          }
        }
      } catch (err) {
        console.error("Error fetching order details", err);
      }
    };
    fetchOrderDetails();
  }, [id, token, url]);

  const [showLiveMap, setShowLiveMap] = useState(false);

  const addressData = activeOrder?.address || {
    firstName: "Shoaib",
    lastName: "",
    phone: "+91 XXXXX XXXXX",
    street: "Whitefield",
    city: "Bangalore",
    state: "Karnataka",
    zipcode: "560066",
    country: "India",
  };

  const addressString = `${addressData.street} ${addressData.city} ${addressData.state} ${addressData.zipcode}`.toLowerCase();
  const customerAddressText = `${addressData.firstName} ${addressData.lastName}`.trim() +
    `\n${addressData.street}, ${addressData.city}, ${addressData.state} ${addressData.zipcode}, ${addressData.country}`;

  const customerPosition = useMemo(() => {
    if (addressString.includes("indiranagar")) return [12.9784, 77.6403];
    if (addressString.includes("whitefield")) return [12.9699, 77.7490];
    if (addressString.includes("btm")) return [12.9180, 77.6101];
    return [12.9500, 77.6200];
  }, [addressString]);

  const getStatusStep = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('delivered')) return 3;
    if (s.includes('out') || s.includes('way')) return 2;
    if (s.includes('processing') || s.includes('preparing')) return 1;
    return 0; // Default: Order Placed
  };

  const getTrackingState = () => {
    const orderId = id || activeOrder?._id || activeOrder?.id;
    const isSavedDelivered = String(activeOrder?.status || "").toLowerCase().includes("deliver") ||
      (orderId && localStorage.getItem(`track_order_status_${orderId}`) === 'Delivered');

    if (isSavedDelivered) {
      return { step: 3, eta: 0, ratio: 1 };
    }

    const orderDateStr = activeOrder?.date || new Date().toISOString();
    const createdTime = new Date(orderDateStr).getTime();
    const currentTime = Date.now();
    const elapsedSeconds = Math.max(0, (currentTime - createdTime) / 1000);

    // Timing flow:
    // 0 sec = Placed (step 0)
    // 30 sec = Food Preparing (step 1)
    // 90 sec = Out for Delivery (step 2)
    // 150 sec = Delivered (step 3)
    if (elapsedSeconds >= 150) {
      if (orderId) {
        localStorage.setItem(`track_order_status_${orderId}`, 'Delivered');
      }
      return { step: 3, eta: 0, ratio: 1 };
    }

    let step = 0;
    if (elapsedSeconds >= 90) {
      step = 2;
    } else if (elapsedSeconds >= 30) {
      step = 1;
    } else {
      const dbStep = getStatusStep(activeOrder?.status);
      step = Math.max(step, dbStep);
    }

    const simulatedMinutesPassed = Math.floor(elapsedSeconds / 6);
    const etaRemaining = Math.max(1, 25 - simulatedMinutesPassed);

    let ratio = 0;
    if (step >= 2) {
      const progressSeconds = Math.max(0, elapsedSeconds - 90);
      ratio = Math.max(0, Math.min(1, progressSeconds / 60));
    }

    return { step, eta: etaRemaining, ratio };
  };

  const initialTrackingState = getTrackingState();
  const [currentStep, setCurrentStep] = useState(initialTrackingState.step);
  const [eta, setEta] = useState(initialTrackingState.eta);
  const [moveRatio, setMoveRatio] = useState(initialTrackingState.ratio);
  const isDelivered = currentStep >= 3;

  const restaurantIcon = useMemo(() => new L.DivIcon({
    className: 'custom-marker custom-marker-restaurant',
    html: '<div class="marker-icon marker-restaurant">🍔</div>',
    iconSize: [42, 42],
    iconAnchor: [21, 42],
  }), []);

  const homeIcon = useMemo(() => new L.DivIcon({
    className: 'custom-marker custom-marker-home',
    html: '<div class="marker-icon marker-home">🏠</div>',
    iconSize: [42, 42],
    iconAnchor: [21, 42],
  }), []);

  const bikeIcon = useMemo(() => new L.DivIcon({
    className: 'custom-marker custom-marker-bike',
    html: '<div class="marker-icon marker-bike">🛵</div>',
    iconSize: [42, 42],
    iconAnchor: [21, 42],
  }), []);

  const riderPosition = useMemo(() => [
    RESTAURANT_POSITION[0] + (customerPosition[0] - RESTAURANT_POSITION[0]) * moveRatio,
    RESTAURANT_POSITION[1] + (customerPosition[1] - RESTAURANT_POSITION[1]) * moveRatio,
  ], [moveRatio, customerPosition]);

  const steps = [
    { title: "Order Placed", time: "10:00 AM", done: currentStep >= 0, icon: "📝" },
    { title: "Food Preparing", time: "10:10 AM", done: currentStep >= 1, icon: "👨‍🍳" },
    { title: "Out for Delivery", time: currentStep >= 2 ? "10:25 AM" : "Pending", done: currentStep >= 2, icon: "🚴" },
    { title: "Delivered", time: currentStep >= 3 ? "10:50 AM" : "Pending", done: currentStep >= 3, icon: "✅" },
  ];

  useEffect(() => {
    if (activeOrder) {
      const state = getTrackingState();
      setCurrentStep(state.step);
      setEta(state.eta);
      setMoveRatio(state.ratio);
    }
  }, [activeOrder]);

  useEffect(() => {
    if (isDelivered) {
      setEta(0);
      setMoveRatio(1);
      return;
    }

    const interval = setInterval(() => {
      const state = getTrackingState();
      setCurrentStep(state.step);
      setEta(state.eta);
      setMoveRatio(state.ratio);
    }, 1000);

    return () => clearInterval(interval);
  }, [isDelivered, activeOrder]);

  const handleCall = () => {
    window.location.href = "tel:+917892344850";
  };

  const handleChat = () => {
    window.location.href = "https://wa.me/917892344850";
  };

  const routeCoordinates = [RESTAURANT_POSITION, riderPosition, customerPosition];

  return (
    <motion.div 
      className="track-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h2 
        className="track-title"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        Track Your Order
      </motion.h2>
      <p className="order-id">Order ID: {id}</p>

      <div className="track-content">
        {/* Food Image */}
        <motion.div 
          className="track-food-image"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4, type: "spring" }}
        >
          <img 
            src="https://images.unsplash.com/photo-1604908176997-125f25cc6f3d"
            alt="food"
          />
        </motion.div>

        {/* Main Tracking Card */}
        <motion.div 
          className="track-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {/* Timeline */}
          <div className="timeline">
            {steps.map((step, index) => (
              <motion.div 
                key={index} 
                className="timeline-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
              >
                <motion.div 
                  className={`circle ${step.done ? "active" : ""}`}
                  animate={step.done ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {step.done ? step.icon : index + 1}
                </motion.div>

                <div className="content">
                  <h4 className={step.done ? "active-text" : ""}>{step.title}</h4>
                  <span className={step.done ? "active-time" : ""}>{step.time}</span>
                </div>

                {index !== steps.length - 1 && (
                  <motion.div 
                    className={`line ${step.done ? "active" : ""}`}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: step.done ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                  ></motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* ETA Section */}
          <motion.div 
            className="eta-section"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            <div className="eta-display">
              <div className="delivery-bike">
                {isDelivered ? '🎉' : '🚴‍♂️'}
              </div>
              <div className="eta-info">
                {isDelivered ? (
                  <>
                    <h3>Delivered Successfully</h3>
                    <p>Thank you for ordering with QuickBite</p>
                  </>
                ) : (
                  <>
                    <h3>Arriving in {eta} mins</h3>
                    <p>Your order is on the way!</p>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            className="track-bottom"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.3 }}
          >
            <motion.span 
              onClick={handleCall}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              📞 Call Rider
            </motion.span>
            <motion.span 
              onClick={handleChat}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              💬 Chat Support
            </motion.span>
            <motion.button
              onClick={() => navigate("/order-details", { state: { order: activeOrder } })}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Order Details
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Live Map Preview Card */}
        <motion.div 
          className="map-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          onClick={() => setShowLiveMap(true)}
        >
          <div className="map-card-header">
            <div>
              <h3>Live Delivery Preview</h3>
              <p>Tap anywhere to expand the interactive map</p>
            </div>
            <span>🗺️</span>
          </div>

          <div className="map-preview">
            <MapContainer 
              center={riderPosition} 
              zoom={13} 
              style={{ height: '280px', width: '100%', borderRadius: '18px', pointerEvents: 'none' }}
            >
              <AutoPan position={riderPosition} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={RESTAURANT_POSITION} icon={restaurantIcon}>
                <Popup><strong>QuickBite Restaurant</strong><br/>MG Road, Bangalore</Popup>
              </Marker>
              <Marker position={riderPosition} icon={bikeIcon}>
                <Popup>Delivery Bike</Popup>
              </Marker>
              <FitBounds positions={[RESTAURANT_POSITION, riderPosition, customerPosition]} />
              <Marker position={customerPosition} icon={homeIcon}>
                <Popup>
                  <strong>Customer Address</strong><br />
                  {addressData.firstName} {addressData.lastName}<br />
                  {addressData.street}<br />
                  {addressData.city}, {addressData.state} - {addressData.zipcode}<br />
                  {addressData.country}
                </Popup>
              </Marker>
              <Polyline positions={[RESTAURANT_POSITION, riderPosition, customerPosition]} color="#ff6b6b" weight={5} opacity={0.8} dashArray="8 10" />
            </MapContainer>
          </div>

          <div className="map-card-footer">
            <p>QuickBite Restaurant is fixed at MG Road.</p>
            {isDelivered ? (
              <p>Rider has successfully delivered your order.</p>
            ) : (
              <p>Rider is on the way to your delivery address.</p>
            )}
          </div>
        </motion.div>

        {showLiveMap && (
          <div className="map-modal-backdrop" onClick={() => setShowLiveMap(false)}>
            <motion.div 
              className="map-modal"
              onClick={(event) => event.stopPropagation()}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="modal-header">
                <div>
                  <h3>Live Delivery Tracker</h3>
                  <p>Full screen route monitoring for your QuickBite order.</p>
                </div>
                <button className="close-modal-btn" onClick={() => setShowLiveMap(false)}>Close</button>
              </div>

              <div className="modal-map-wrapper">
                <MapContainer
                  center={riderPosition}
                  zoom={13}
                  scrollWheelZoom={true}
                  style={{ height: '100%', width: '100%' }}
                  className="live-map-full"
                >
                  <AutoPan position={riderPosition} />
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={RESTAURANT_POSITION} icon={restaurantIcon}>
                    <Popup><strong>QuickBite Restaurant</strong><br/>MG Road, Bangalore</Popup>
                  </Marker>
                  <Marker position={riderPosition} icon={bikeIcon}>
                    <Popup>Live delivery bike</Popup>
                  </Marker>
                      <Marker position={customerPosition} icon={homeIcon}>
                    <Popup>
                      <strong>Customer Address</strong><br />
                      {addressData.firstName} {addressData.lastName}<br />
                      {addressData.street}<br />
                      {addressData.city}, {addressData.state} - {addressData.zipcode}<br />
                      {addressData.country}
                    </Popup>
                  </Marker>
                  <Polyline positions={[RESTAURANT_POSITION, riderPosition, customerPosition]} color="#ff6b6b" weight={6} opacity={0.85} dashArray="10 8" />
                </MapContainer>
              </div>

              <div className="modal-info">
                <div className="modal-tag">
                  <h4>Destination</h4>
                  <p>{addressData.street}</p>
                  <p>{addressData.city}, {addressData.state} {addressData.zipcode}</p>
                  <p>{addressData.country}</p>
                </div>
                <div className="modal-tag">
                  <h4>Rider Status</h4>
                  <p>{isDelivered ? 'Delivered' : 'On the way'}</p>
                </div>
                <div className="modal-tag">
                  <h4>ETA</h4>
                  <p>{isDelivered ? 'Delivered' : `${eta} mins`}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TrackOrder;