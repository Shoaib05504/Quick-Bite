import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { StoreContext } from '../../components/context/StoreContext';
import SplitBill from '../../components/SplitBill/SplitBill';
import QRCodeBox from '../../components/QRCodeBox/QRCodeBox';
import './GroupOrder.css';
import { FiChevronLeft, FiShare2, FiUsers, FiClock, FiShoppingCart, FiLock, FiUnlock, FiSearch, FiLayers, FiList, FiActivity } from 'react-icons/fi';
import toast from 'react-hot-toast';

const getSocketServerUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (import.meta.env.MODE === 'development') {
    return envUrl || 'http://localhost:8000';
  }
  if (typeof window !== 'undefined') {
    if (envUrl && !envUrl.includes(window.location.hostname) && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return window.location.origin;
    }
    return envUrl || window.location.origin;
  }
  return envUrl || '';
};
const socketServerUrl = getSocketServerUrl();

const formatTimer = (milliseconds) => {
  if (milliseconds <= 0) return '00:00';
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const formatLobbyTimer = (expiryStr) => {
  if (!expiryStr) return '30:00';
  const str = String(expiryStr);
  if (str.includes('15')) return '15:00';
  if (str.includes('30')) return '30:00';
  if (str.includes('1')) return '60:00';
  if (str.includes('2')) return '120:00';
  return '30:00';
};

const getExpiryMinutes = (expiryStr) => {
  if (!expiryStr) return 30;
  const str = String(expiryStr);
  if (str.includes('15')) return 15;
  if (str.includes('30')) return 30;
  if (str.includes('1')) return 60;
  if (str.includes('2')) return 120;
  return 30;
};

const GroupOrder = () => {
  const { groupCode } = useParams();
  const navigate = useNavigate();
  const { userProfile, addItemsToCart, food_list } = useContext(StoreContext);

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [joinName, setJoinName] = useState('');
  const [expired, setExpired] = useState(false);
  const [equalSplit, setEqualSplit] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [activities, setActivities] = useState([]);
  const [started, setStarted] = useState(false);
  
  // Lobby and Chat states
  const [showSuccessBanner, setShowSuccessBanner] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    const bannerTimer = setTimeout(() => {
      setShowSuccessBanner(false);
    }, 3000);
    return () => clearTimeout(bannerTimer);
  }, []);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const newMsg = {
      id: `user-${Date.now()}`,
      type: 'user',
      sender: currentName,
      initials: currentName.charAt(0).toUpperCase(),
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: {}
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Simulated reply from other joined members only!
    const joinedOtherMembers = group?.members?.filter(m => m.name !== currentName) || [];
    if (joinedOtherMembers.length > 0) {
      setTimeout(() => {
        const replies = [
          "Sounds like a plan! Let's get started. 🚀",
          "Yum! Can't wait for the feast. 🍔",
          "I'll add my items to the cart now!",
          "Budget looks great, let's keep it under limit! 💸"
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        const responder = joinedOtherMembers[Math.floor(Math.random() * joinedOtherMembers.length)].name;
        
        const replyMsg = {
          id: `reply-${Date.now()}`,
          type: 'user',
          sender: responder,
          initials: responder.charAt(0).toUpperCase(),
          text: randomReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reactions: {}
        };
        setChatMessages((prev) => [...prev, replyMsg]);
        
        // Increment unread count if chat is closed
        if (!showChat) {
          setUnreadCount((prev) => prev + 1);
        }
      }, 2500);
    }
  };

  const handleAddReaction = (msgId, emoji) => {
    setChatMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== msgId) return msg;
        const reactions = { ...msg.reactions };
        reactions[emoji] = (reactions[emoji] || 0) + 1;
        return { ...msg, reactions };
      })
    );
  };
  
  // Menu selection states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const socketRef = useRef(null);

  const currentName = userProfile?.name || joinName || 'Guest';

  const formatActivityMessage = (msg, members = []) => {
    if (!msg) return "";
    let cleanMsg = msg;
    let prefix = "";
    if (msg.startsWith('🟢')) {
      prefix = '🟢 ';
      cleanMsg = msg.slice(2).trim();
    } else if (msg.startsWith('🔴')) {
      prefix = '🔴 ';
      cleanMsg = msg.slice(2).trim();
    }
    
    const matchingMember = members.find(m => cleanMsg.startsWith(m.name));
    if (matchingMember) {
      const nameLen = matchingMember.name.length;
      return (
        <>
          {prefix && <span>{prefix}</span>}
          <span className="activity-user-highlight">{matchingMember.name}</span>
          {cleanMsg.slice(nameLen)}
        </>
      );
    }
    
    const words = cleanMsg.split(' ');
    if (words.length > 1 && /^[A-Z]/.test(words[0])) {
      return (
        <>
          {prefix && <span>{prefix}</span>}
          <span className="activity-user-highlight">{words[0]} {words[1]}</span>
          {" " + words.slice(2).join(' ')}
        </>
      );
    }
    
    return msg;
  };

  const connectSocket = useCallback(() => {
    const socket = io(socketServerUrl, {
      transports: ['websocket'],
      autoConnect: false,
    });

    socket.connect();

    socket.on('group:joined', (payload) => {
      setGroup(payload.groupOrder);
      setActivities(payload.groupOrder.activities || []);
      setJoined(true);
      setExpired(payload.groupOrder.isExpired || new Date() > new Date(payload.groupOrder.expiresAt));
    });

    socket.on('group:updated', (payload) => {
      setGroup(payload.groupOrder);
      setActivities(payload.groupOrder.activities || []);
      setExpired(payload.groupOrder.isExpired || new Date() > new Date(payload.groupOrder.expiresAt));
    });

    socket.on('group:memberJoined', (payload) => {
      setGroup(payload.groupOrder);
      setActivities(payload.groupOrder.activities || []);
    });

    socket.on('group:remind', ({ senderName }) => {
      toast(`🔔 ${senderName} sent you a payment reminder!`, {
        icon: '💰',
        duration: 5000,
        style: {
          border: '1px solid #eab308',
          padding: '16px',
          color: '#854d0e',
          background: '#fef9c3',
        },
      });
    });

    socket.on('group:expired', () => {
      setExpired(true);
      toast.error('This group order has expired');
    });

    socketRef.current = socket;
  }, []);

  useEffect(() => {
    connectSocket();
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [connectSocket]);

  const fetchGroupOrder = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${socketServerUrl}/api/group-order/${groupCode}`);
      const data = await response.json();
      if (data.success) {
        setGroup(data.groupOrder);
        setActivities(data.groupOrder.activities || []);
        setExpired(data.isExpired || new Date() > new Date(data.groupOrder.expiresAt));
        const alreadyMember = data.groupOrder.members.some((member) => member.name === userProfile?.name);
        if (alreadyMember) {
          setJoined(true);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Unable to load group order');
    } finally {
      setLoading(false);
    }
  }, [groupCode, userProfile]);

  useEffect(() => {
    fetchGroupOrder();
  }, [fetchGroupOrder]);

  // Auto-join socket room if already joined via REST API
  useEffect(() => {
    if (joined && socketRef.current && currentName) {
      const emitJoin = () => {
        socketRef.current.emit('group:join', { groupCode, name: currentName }, (response) => {
          if (response?.success) {
            setGroup(response.groupOrder);
            setActivities(response.groupOrder.activities || []);
            setExpired(response.groupOrder.isExpired || new Date() > new Date(response.groupOrder.expiresAt));
          }
        });
      };

      if (socketRef.current.connected) {
        emitJoin();
      } else {
        socketRef.current.on('connect', emitJoin);
      }

      return () => {
        socketRef.current?.off('connect', emitJoin);
      };
    }
  }, [joined, groupCode, currentName]);

  useEffect(() => {
    if (!group?.expiresAt) return;
    const interval = setInterval(() => {
      const remaining = new Date(group.expiresAt).getTime() - Date.now();
      setTimeLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        setExpired(true);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [group]);

  const handleJoinGroup = () => {
    const name = currentName.trim() || 'Guest';
    if (!name) {
      toast.error('Enter a name to join');
      return;
    }
    if (!socketRef.current?.connected) {
      toast.error('Connecting to group session...');
      return;
    }
    socketRef.current.emit('group:join', { groupCode, name }, (response) => {
      if (response?.success) {
        setGroup(response.groupOrder);
        setActivities(response.groupOrder.activities || []);
        setJoined(true);
        setExpired(response.groupOrder.isExpired || new Date() > new Date(response.groupOrder.expiresAt));
        toast.success(`Joined as ${name}`);
      } else {
        toast.error(response?.message || 'Join failed');
      }
    });
  };

  const handleUpdateCart = (action, itemId, quantity = 1) => {
    if (expired) return;
    
    // Use one single source of truth for cart lock state
    if (group?.isLocked) {
      toast('🔒 Group cart is locked by host', {
        icon: '🔒',
        style: {
          background: 'rgba(239, 68, 68, 0.95)',
          color: '#ffffff',
          borderRadius: '10px',
          fontWeight: '600',
        }
      });
      return;
    }

    if (!socketRef.current?.connected) {
      toast.error('Real-time session disconnected');
      return;
    }

    const item = food_list.find((food) => food._id === itemId) || {};
    const price = Number(item.price || 0);
    socketRef.current.emit(
      'group:updateCart',
      { groupCode, action, itemId, quantity, addedBy: currentName, price },
      (response) => {
        if (response?.success) {
          setGroup(response.groupOrder);
          setActivities(response.groupOrder.activities || []);
          setExpired(response.groupOrder.isExpired || new Date() > new Date(response.groupOrder.expiresAt));
          
          if (action === 'add') {
            toast.success('🍽️ Item added to Group Feast');
          }
        } else {
          if (response?.message?.includes('locked')) {
            toast('🔒 Group cart is locked by host', { icon: '🔒' });
          } else {
            toast.error(response?.message || 'Unable to update cart');
          }
        }
      }
    );
  };

  const handleToggleLock = () => {
    if (!socketRef.current?.connected) {
      toast.error('Real-time session disconnected');
      return;
    }
    const nextLocked = !group?.isLocked;
    
    // Optimistically update the single source of truth immediately for instant UI responsiveness
    setGroup((prev) => prev ? { ...prev, isLocked: nextLocked } : prev);

    socketRef.current.emit('group:toggleLock', { groupCode, isLocked: nextLocked }, (response) => {
      if (response?.success) {
        setGroup(response.groupOrder);
        toast.success(nextLocked ? 'Shared cart is now LOCKED 🔒' : 'Shared cart is now UNLOCKED 🔓');
      } else {
        // Rollback state if server request fails
        setGroup((prev) => prev ? { ...prev, isLocked: !nextLocked } : prev);
        toast.error('Failed to toggle lock status');
      }
    });
  };

  const handleCheckout = async () => {
    if (!group?.cartItems?.length) {
      toast.error('The shared cart is empty');
      return;
    }
    const itemsToAdd = group.cartItems.map((item) => ({ itemId: item.itemId, quantity: item.quantity }));
    await addItemsToCart(itemsToAdd);
    navigate('/order');
  };

  const sharedCartItems = useMemo(
    () =>
      group?.cartItems?.map((item) => ({
        ...item,
        food: food_list.find((food) => food._id === item.itemId) || {},
      })) || [],
    [food_list, group]
  );

  const totalAmount = useMemo(
    () =>
      sharedCartItems.reduce(
        (sum, item) => sum + Number(item.food.price || item.price || 0) * Number(item.quantity || 0),
        0
      ),
    [sharedCartItems]
  );

  // Identify Host
  const isHost = useMemo(() => {
    if (!group) return false;
    const isCreator = group.createdBy && userProfile && String(group.createdBy) === String(userProfile._id);
    const isFirstMember = group.members[0] && group.members[0].name === currentName;
    return Boolean(isCreator || isFirstMember);
  }, [group, userProfile, currentName]);

  // List of categories derived from menu data
  const categories = useMemo(() => {
    const cats = new Set(food_list.map((item) => item.category));
    return ['All', ...Array.from(cats)];
  }, [food_list]);

  // Filtered menu selection
  const filteredMenu = useMemo(() => {
    return food_list.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [food_list, searchQuery, selectedCategory]);

  if (loading) {
    return (
      <div className="group-order-page-shell">
        <div className="group-order-loader">Loading group order…</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="group-order-page-shell">
        <div className="group-order-empty">
          <h2>Group order not found</h2>
          <button type="button" onClick={() => navigate('/home')}>
            Back to home
          </button>
        </div>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/group-order/${group.groupCode}`;

  return (
    <div className="group-order-page-shell">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group-order-container"
      >
        {!started ? (
          <motion.div
            className="group-lobby-panel"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Success Banner */}
            <AnimatePresence>
              {showSuccessBanner && (
                <motion.div
                  className="success-banner"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  onClick={() => setShowSuccessBanner(false)}
                >
                  <span>✅ Group Created Successfully!</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="lobby-card glass-card">
              <div className="lobby-header">
                <h2>{group.groupName}</h2>
                <span className="lobby-tag">Lobby</span>
              </div>

              {/* Frozen Timer */}
              <div className="lobby-timer-section">
                <div className="circular-timer-wrapper muted">
                  <svg width="100" height="100" className="circular-timer-svg">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="timer-bg-circle"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="timer-progress-circle muted"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={0}
                    />
                  </svg>
                  <div className="timer-text-overlay">{formatLobbyTimer(group.expiry)}</div>
                </div>
                <p className="timer-label-beneath">Timer starts when you enter the room</p>
              </div>

              {/* Group Code Block */}
              <div className="lobby-code-block">
                <p className="code-label">Group Code</p>
                <div className="code-row">
                  <span className="code-text-mono">{group.groupCode}</span>
                  <button
                    type="button"
                    className="copy-code-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(group.groupCode);
                      toast.success('Copied!');
                    }}
                  >
                    Copy Code
                  </button>
                </div>
              </div>

              {/* Invite Options */}
              <div className="lobby-invite-section">
                <p className="section-label">Invite Options</p>
                <div className="invite-buttons-grid">
                  <button
                    type="button"
                    className="invite-btn whatsapp-btn"
                    onClick={() => {
                      const shareMsg = `Join my group order "${group.groupName}"!\nCode: ${group.groupCode}\nLink: ${shareUrl}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(shareMsg)}`, '_blank');
                    }}
                  >
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    className="invite-btn link-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      toast.success('Link Copied!');
                    }}
                  >
                    Copy Link
                  </button>
                  <button
                    type="button"
                    className="invite-btn qr-btn"
                    onClick={() => setShowQRModal(true)}
                  >
                    QR Code
                  </button>
                </div>
              </div>

              {/* Live Members Panel */}
              <div className="lobby-members-section">
                <div className="members-header">
                  👥 {group.members.length} / {group.maxParticipants} Members Joined
                </div>
                
                <div className="members-list-pills">
                  <AnimatePresence>
                    {group.members.map((member, idx) => {
                      const initials = member.name ? member.name.charAt(0).toUpperCase() : 'M';
                      const isHostMember = idx === 0;
                      return (
                        <motion.div
                          key={`${member.name}-${idx}`}
                          className="member-pill-row"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="avatar-initial">{initials}</div>
                          <span className="member-name">{member.name}</span>
                          {isHostMember && <span className="host-badge">Host</span>}
                        </motion.div>
                      );
                    })}

                    {Array.from({ length: Math.max(0, group.maxParticipants - group.members.length) }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="member-pill-row empty">
                        <div className="avatar-initial empty">○</div>
                        <span className="member-name empty">Waiting...</span>
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Group Note card */}
              <div className="lobby-note-card">
                <span>📌 {group.note}</span>
              </div>

              {/* Primary CTA */}
              <button
                type="button"
                className="enter-room-btn"
                onClick={() => {
                  setStarted(true);
                  toast.success('Session started!');
                }}
              >
                🟢 Enter Group Room
              </button>

              {/* Secondary CTA */}
              <button
                type="button"
                className="chat-toggle-btn"
                onClick={() => {
                  setShowChat(true);
                  setUnreadCount(0);
                }}
              >
                💬 Group Chat {unreadCount > 0 && <span className="chat-badge">{unreadCount}</span>}
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="group-order-header">
              <button type="button" className="back-button" onClick={() => navigate('/cart')}>
                <FiChevronLeft /> Back to cart
              </button>
              <div className="header-meta">
                <p className="group-order-label">QuickBite Group Feast: {group.groupName}</p>
                <h1>{group.groupCode}</h1>
              </div>
            </div>

            <div className="group-order-body">
              {/* LEFT SIDEBAR PANEL */}
              <div className="group-order-left">
                <motion.div
                  className="group-order-panel glass-card"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="panel-heading">
                    <div>
                      <p className="panel-title">Group session</p>
                      <p className="panel-subtitle">Share code to invite others.</p>
                    </div>
                    <span className={`badge ${expired ? 'expired' : 'live'}`}>{expired ? 'Expired' : 'Live'}</span>
                  </div>
                  <div className="invite-cta">
                    <p className="invite-code">{group.groupCode}</p>
                    <button
                      type="button"
                      className="invite-link-btn"
                      onClick={() => navigator.clipboard.writeText(shareUrl).then(() => toast.success('Invite link copied'))}
                    >
                      <FiShare2 style={{ marginRight: '6px' }} /> Copy invite link
                    </button>
                  </div>
                </motion.div>

                <motion.div
                  className="group-order-panel glass-card group-qr-card"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 }}
                >
                  <div className="panel-heading">
                    <div>
                      <p className="panel-title">Invite QR</p>
                      <p className="panel-subtitle">Scan to join instantly.</p>
                    </div>
                  </div>
                  <div className="qr-preview">
                    <QRCodeBox value={shareUrl} />
                  </div>
                </motion.div>

                {/* CATEGORY SELECTOR FOR THE COLLABORATIVE MENU */}
                {joined && !expired && !group.isLocked && (
                  <motion.div
                    className="group-order-panel glass-card category-sidebar"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <div className="panel-heading">
                      <div>
                        <p className="panel-title"><FiLayers /> Categories</p>
                        <p className="panel-subtitle">Filter menu items</p>
                      </div>
                    </div>
                    <div className="category-vertical-list">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          className="category-list-btn"
                          onClick={() => setSelectedCategory(cat)}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* CENTER PANE - COLLABORATIVE FEAST MENU & BILL SPLIT */}
              <div className="group-order-center">
                {!joined ? (
                  <motion.div
                    className="group-order-join glass-card"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <h2>Join this feast</h2>
                    <p>Enter your name and join the shared cart session.</p>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={joinName}
                      onChange={(e) => setJoinName(e.target.value)}
                    />
                    <button type="button" onClick={handleJoinGroup} disabled={expired}>
                      {expired ? 'Session locked' : 'Join group order'}
                    </button>
                  </motion.div>
                ) : (
                  <>
                    {/* REAL-TIME COLLABORATIVE MENU */}
                    {!expired && !group.isLocked && (
                      <motion.div
                        className="group-order-panel glass-card feast-menu-panel"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                      >
                        <div className="menu-header">
                          <div>
                            <h3>Add Items to Shared Cart</h3>
                            <p className="panel-subtitle">Select dishes to add to your personal share</p>
                          </div>
                          <div className="menu-search-bar">
                            <FiSearch className="search-icon" />
                            <input
                              type="text"
                              placeholder="Search food items..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="feast-menu-grid">
                          {filteredMenu.slice(0, 8).map((food) => {
                            const userCartItem = group.cartItems.find(
                              (item) => item.itemId === food._id && item.addedBy === currentName
                            );
                            const userQty = userCartItem ? userCartItem.quantity : 0;

                            return (
                              <div key={food._id} className="feast-menu-card">
                                <div className="menu-card-img-wrap">
                                  <img src={food.image.startsWith('http') ? food.image : `${socketServerUrl}/images/${food.image}`} alt={food.name} />
                                </div>
                                <div className="menu-card-details">
                                  <h4>{food.name}</h4>
                                  <p className="menu-card-price">₹{food.price}</p>
                                  <div className="menu-card-actions">
                                    {userQty > 0 ? (
                                      <div className="feast-qty-control">
                                        <button type="button" onClick={() => handleUpdateCart('remove', food._id)}>-</button>
                                        <span>{userQty}</span>
                                        <button type="button" onClick={() => handleUpdateCart('add', food._id)}>+</button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        className="add-to-feast-btn"
                                        onClick={() => handleUpdateCart('add', food._id)}
                                      >
                                        Add to Feast
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* SHARED CART PREVIEW */}
                    <motion.div
                      className="group-order-panel glass-card"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.15 }}
                    >
                      <div className="panel-heading">
                        <div>
                          <p className="panel-title">Shared cart preview</p>
                          <p className="panel-subtitle">Live order items from the group.</p>
                        </div>
                      </div>
                      {group.cartItems.length ? (
                        <div className="cart-grid">
                          {group.cartItems.map((item, idx) => {
                            const food = food_list.find((foodItem) => foodItem._id === item.itemId) || {};
                            const isMine = item.addedBy === currentName;
                            return (
                              <div key={idx} className={`cart-item-row ${isMine ? 'my-item-row' : ''}`}>
                                <div>
                                  <p className="cart-item-name">{food.name || item.itemId}</p>
                                  <p className="cart-item-meta">
                                    x{item.quantity} • added by {item.addedBy} {isMine && '(You)'}
                                  </p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                  <p className="cart-item-total">₹{Number(food.price || item.price || 0) * item.quantity}</p>
                                  {isMine && !expired && !group.isLocked && (
                                    <div className="row-qty-control">
                                      <button type="button" onClick={() => handleUpdateCart('remove', item.itemId)}>-</button>
                                      <button type="button" onClick={() => handleUpdateCart('add', item.itemId)}>+</button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="empty-state-card">
                          <p>No shared cart items yet.</p>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}

                {/* SMART BILL SPLIT CONTAINER */}
                {joined && group.cartItems.length > 0 && (
                  <motion.div
                    className="split-bill-wrapper"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    <SplitBill
                      items={group.cartItems}
                      members={group.members}
                      foodList={food_list}
                      equalSplit={equalSplit}
                      onToggleEqual={() => setEqualSplit((prev) => !prev)}
                      groupCode={group.groupCode}
                      currentUser={currentName}
                      isHost={isHost}
                      socket={socketRef.current}
                    />
                  </motion.div>
                )}
              </div>

              {/* RIGHT SIDEBAR - LIVE MEMBERS & ACTIVITES */}
              <div className="group-order-right">
                <motion.div
                  className="group-order-card glass-card"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 }}
                >
                  <div className="card-title">
                    <FiUsers /> Live members
                  </div>
                  <div className="member-list-vertical">
                    {group.members.map((member) => (
                      <div key={`${member.name}-${member.joinedAt}`} className="member-row-badge">
                        <div className="member-badge-left">
                          <span className="member-status-avatar">
                            <FiUsers />
                          </span>
                          <span className="member-badge-name">{member.name}</span>
                        </div>
                        <span className={`payment-badge ${member.paymentStatus?.toLowerCase() || 'pending'}`}>
                          {member.paymentStatus || 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="member-count">{group.members.length} / {group.maxParticipants} members joined</p>
                </motion.div>

                <motion.div
                  className="group-order-panel glass-card"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <div className="panel-heading">
                    <div>
                      <p className="panel-title"><FiList /> Activity feed</p>
                      <p className="panel-subtitle">Realtime updates from the group.</p>
                    </div>
                  </div>
                  <div className="activity-list">
                    {activities.slice(0, 6).map((activity, index) => (
                      <div key={index} className="activity-item">
                        <span className="activity-bullet">🟢</span>
                        <p>{formatActivityMessage(activity.message, group?.members)}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* ACTIONS PANEL (LOCK, TIMEOUT, CHECKOUT) */}
                <motion.div
                  className="group-order-action-panel glass-card"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.35 }}
                >
                  <div className="action-summary">
                    {/* Dynamic Active SVG Countdown Ring */}
                    <div className="time-tracker-premium">
                      <span className="time-label"><FiClock /> Session Expiry</span>
                      
                      <div className="timer-display-row">
                        <div className="circular-timer-wrapper active">
                          <svg width="70" height="70" className="circular-timer-svg">
                            <circle
                              cx="35"
                              cy="35"
                              r="28"
                              className="timer-bg-circle"
                            />
                            <circle
                              cx="35"
                              cy="35"
                              r="28"
                              className={`timer-progress-circle ${timeLeft < 60000 ? 'red' : timeLeft < 300000 ? 'amber' : 'active'}`}
                              strokeDasharray={2 * Math.PI * 28}
                              strokeDashoffset={(2 * Math.PI * 28) - (Math.min(100, Math.max(0, (timeLeft / (getExpiryMinutes(group.expiry) * 60 * 1000)) * 100)) / 100) * (2 * Math.PI * 28)}
                            />
                          </svg>
                          <div className="timer-text-overlay-small">{formatTimer(timeLeft)}</div>
                        </div>
                        <div className="timer-meta-info">
                          <span className="timer-status-title">
                            {timeLeft < 60000 ? 'Expiring Soon! 🚨' : timeLeft < 300000 ? 'Order quickly!' : 'Session Active'}
                          </span>
                          <span className="timer-subtitle-label">
                            {timeLeft < 300000 ? 'Order before time runs out!' : 'Add items with friends'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="lock-cart-section">
                      <div className="lock-labels">
                        <span>Cart Lock Status</span>
                        <strong>{group.isLocked ? 'LOCKED 🔒' : 'UNLOCKED 🔓'}</strong>
                      </div>
                      {isHost && (
                        <button
                          type="button"
                          className={`toggle-lock-btn ${group.isLocked ? 'locked' : ''}`}
                          onClick={handleToggleLock}
                        >
                          {group.isLocked ? (
                            <>
                              <FiUnlock /> Unlock Shared Cart
                            </>
                          ) : (
                            <>
                              <FiLock /> Lock Shared Cart
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="proceed-checkout-section">
                      <div>
                        <p>Group subtotal</p>
                        <h3>₹{totalAmount}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={handleCheckout}
                        disabled={expired || !joined || (group.isLocked && !isHost)}
                      >
                        <FiShoppingCart /> Proceed to checkout
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* Floating Chat Trigger Button in Group Room */}
      {started && (
        <button
          type="button"
          className="floating-chat-trigger"
          onClick={() => {
            setShowChat(true);
            setUnreadCount(0);
          }}
        >
          💬 Chat {unreadCount > 0 && <span className="chat-badge">{unreadCount}</span>}
        </button>
      )}

      {/* QR Code Modal Bottom Sheet */}
      <AnimatePresence>
        {showQRModal && (
          <div className="modal-overlay-backdrop qr-backdrop" onClick={() => setShowQRModal(false)}>
            <motion.div
              className="qr-bottom-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sheet-drag-handle" />
              <h3>Invite QR Code</h3>
              <p>Scan this QR to join the feast instantly</p>
              <div className="sheet-qr-container">
                <QRCodeBox value={shareUrl} />
              </div>
              <button type="button" className="sheet-close-btn" onClick={() => setShowQRModal(false)}>
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Group Chat Bottom Sheet */}
      <AnimatePresence>
        {showChat && (
          <div className="modal-overlay-backdrop chat-backdrop" onClick={() => setShowChat(false)}>
            <motion.div
              className="chat-bottom-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sheet-drag-handle" />
              <div className="chat-header">
                <h3>💬 Live Group Chat</h3>
                <button type="button" className="chat-close-btn" onClick={() => setShowChat(false)}>✕</button>
              </div>

              {/* Message Feed */}
              <div className="chat-messages-container">
                {/* Interleaved User and System messages */}
                {[
                  ...activities.map((act, idx) => ({
                    id: act._id || `sys-${idx}`,
                    type: 'system',
                    text: act.message,
                    timestamp: act.createdAt ? new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'
                  })),
                  ...chatMessages
                ].map((msg) => {
                  if (msg.type === 'system') {
                    return (
                      <div key={msg.id} className="chat-message-row system">
                        <span className="system-text">📢 {msg.text}</span>
                        <span className="system-time">{msg.timestamp}</span>
                      </div>
                    );
                  }

                  const isMe = msg.sender === currentName;
                  const isHostMsg = msg.sender === 'Shoaib' || (group.members[0] && msg.sender === group.members[0].name);

                  return (
                    <div key={msg.id} className={`chat-message-row user ${isMe ? 'me' : 'others'}`}>
                      {!isMe && (
                        <div className="msg-avatar">
                          {msg.initials}
                        </div>
                      )}
                      <div className="msg-content-wrapper">
                        <div className="msg-info">
                          <span className={`msg-sender ${isHostMsg ? 'host-name' : ''}`}>
                            {msg.sender} {isHostMsg && <span className="host-chat-badge">Host</span>}
                          </span>
                          <span className="msg-time">{msg.timestamp}</span>
                        </div>
                        <div className="msg-bubble">
                          <p>{msg.text}</p>
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className="message-reactions-row">
                              {Object.entries(msg.reactions).map(([emoji, count]) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  className="reaction-pill"
                                  onClick={() => handleAddReaction(msg.id, emoji)}
                                >
                                  {emoji} {count}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="quick-reaction-triggers">
                          {['👍', '🔥', '❤️', '🍕'].map(emoji => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleAddReaction(msg.id, emoji)}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input */}
              <div className="chat-input-bar">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                />
                <div className="emoji-quick-picks">
                  {['👍', '🔥', '🍕', '🎉'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      className="emoji-pick-btn"
                      onClick={() => setInputText(prev => prev + emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <button type="button" className="chat-send-btn" onClick={handleSendMessage}>
                  Send
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroupOrder;
