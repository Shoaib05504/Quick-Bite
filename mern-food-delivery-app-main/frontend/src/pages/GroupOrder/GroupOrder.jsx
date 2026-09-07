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
import { groupOrderAPI } from '../../services/groupOrderService';
import { SOCKET_SERVER_URL } from '../../config/apiConfig';

const socketServerUrl = SOCKET_SERVER_URL;

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
  const chatEndRef = useRef(null);

  useEffect(() => {
    const bannerTimer = setTimeout(() => {
      setShowSuccessBanner(false);
    }, 3000);
    return () => clearTimeout(bannerTimer);
  }, []);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    if (!socketRef.current) {
      toast.error('Not connected to live group room');
      return;
    }
    const messageText = inputText.trim();
    setInputText('');

    socketRef.current.emit(
      'group:sendMessage',
      {
        groupCode,
        sender: currentName,
        text: messageText,
      },
      (response) => {
        if (!response?.success) {
          toast.error(response?.message || 'Failed to send message');
        }
      }
    );
  };

  useEffect(() => {
    if (showChat) {
      setUnreadCount(0);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [showChat]);

  useEffect(() => {
    if (showChat) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChat]);
  
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
    if (socketRef.current) return;

    const socket = io(getSocketServerUrl(), {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socket.on('connect', () => {
      console.log('Real-time socket connected');
    });

    socket.on('reconnect', () => {
      toast.success('Real-time connection restored! 🟢');
    });

    socket.on('group:joined', (payload) => {
      setGroup(payload.groupOrder);
      setActivities(payload.groupOrder.activities || []);
      if (payload.groupOrder.chatMessages) {
        setChatMessages(payload.groupOrder.chatMessages);
      }
      setJoined(true);
      setExpired(payload.groupOrder.isExpired || new Date() > new Date(payload.groupOrder.expiresAt));
    });

    socket.on('group:updated', (payload) => {
      setGroup(payload.groupOrder);
      setActivities(payload.groupOrder.activities || []);
      if (payload.groupOrder.chatMessages) {
        setChatMessages(payload.groupOrder.chatMessages);
      }
      setExpired(payload.groupOrder.isExpired || new Date() > new Date(payload.groupOrder.expiresAt));
    });

    socket.on('group:feastStarted', (payload) => {
      setGroup(payload.groupOrder);
      toast.success('🎉 Group Feast has started! Everyone can now add items.');
    });

    socket.on('group:chatMessage', (payload) => {
      if (payload?.message) {
        setChatMessages((prev) => {
          const msgId = payload.message.messageId || payload.message._id;
          const exists = prev.some((m) => (m.messageId && m.messageId === msgId) || (m._id && m._id === msgId));
          if (exists) return prev;
          return [...prev, payload.message];
        });
        if (!showChat) {
          setUnreadCount((prev) => prev + 1);
        }
      }
    });

    socket.on('group:notification', (payload) => {
      if (payload?.message) {
        toast(payload.message, {
          icon: payload.type === 'member_joined' ? '👋' : payload.type === 'cart_updated' ? '🍕' : payload.type === 'lock_toggled' ? '🔒' : '🔔',
          duration: 3500,
          style: {
            borderRadius: '12px',
            background: '#0f172a',
            color: '#ffffff',
            fontWeight: '600',
            fontSize: '14px',
          },
        });
      }
    });

    socket.on('group:checkoutStarted', (payload) => {
      toast.success('💳 Host started checkout! Navigating to checkout...');
      if (payload?.groupOrder?.cartItems?.length) {
        const itemsToAdd = payload.groupOrder.cartItems.map((item) => ({ itemId: item.itemId, quantity: item.quantity }));
        addItemsToCart(itemsToAdd);
        localStorage.setItem('groupOrderCheckout', JSON.stringify(payload.groupOrder.cartItems));
        localStorage.setItem('groupOrderCode', groupCode);
      }
      setTimeout(() => {
        navigate('/order');
      }, 1200);
    });

    socket.on('group:kicked', (payload) => {
      toast.error(payload?.message || 'You were removed from the Group Feast by the host.');
      setJoined(false);
      navigate('/home');
    });

    socket.on('group:remind', ({ senderName }) => {
      toast(`🔔 ${senderName} sent a payment reminder to all members!`, {
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
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
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
        if (data.groupOrder.chatMessages) {
          setChatMessages(data.groupOrder.chatMessages);
        }
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
      }

      socketRef.current.on('connect', emitJoin);

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
      if (socketRef.current) {
        socketRef.current.connect();
      } else {
        connectSocket();
      }
      toast.error('Reconnecting to group session... Please try again');
      return;
    }

    const item = food_list.find((food) => food._id === itemId) || {};
    const price = Number(item.price || 0);
    socketRef.current.emit(
      'group:updateCart',
      { groupCode, action, itemId, quantity, addedBy: currentName, price, name: item.name || '', image: item.image || '' },
      (response) => {
        if (response?.success) {
          setGroup(response.groupOrder);
          setActivities(response.groupOrder.activities || []);
          setExpired(response.groupOrder.isExpired || new Date() > new Date(response.groupOrder.expiresAt));
          
          if (action === 'add') {
            toast.success(`🍽️ Added ${item.name || 'item'} to Group Feast`);
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

  const handleStartFeast = async () => {
    if (!isHost) {
      toast.error('Only the host can start the Group Feast');
      return;
    }

    // Optimistically unlock feast session immediately for instant UI responsiveness
    setGroup((prev) => (prev ? { ...prev, isStarted: true } : prev));
    toast.success('🎉 Group Feast Started! Everyone can now add items to the shared cart.');

    // Emit Socket event to notify all connected room members in real-time
    if (socketRef.current?.connected) {
      socketRef.current.emit(
        'group:startFeast',
        { groupCode, requesterName: currentName },
        (response) => {
          if (response?.success) {
            setGroup(response.groupOrder);
          }
        }
      );
    }

    // Backup REST API call to guarantee database update
    const res = await groupOrderAPI.startGroupFeast({ groupCode, requesterName: currentName });
    if (res?.success && res.groupOrder) {
      setGroup(res.groupOrder);
    }
  };

  const handleCopyInviteMessage = () => {
    if (!group) return;
    const inviteMessage = `🍽️ Join my QuickBite Group Feast!\n\nCode: ${group.groupCode}\n\n🔗 Link: ${window.location.origin}/group-order/${group.groupCode}`;
    navigator.clipboard.writeText(inviteMessage).then(() => {
      toast.success('✅ Invitation copied! Share it with your friends.', {
        duration: 4000,
        style: {
          borderRadius: '12px',
          background: '#0f172a',
          color: '#ffffff',
          fontWeight: '600',
          fontSize: '14px',
        },
      });
    });
  };

  const handleShareWhatsApp = () => {
    if (!group) return;
    const inviteMessage = `🍽️ Join my QuickBite Group Feast!\n\nCode: ${group.groupCode}\n\n🔗 Link: ${window.location.origin}/group-order/${group.groupCode}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(inviteMessage)}`, '_blank');
  };

  const handleToggleLock = () => {
    if (!socketRef.current?.connected) {
      toast.error('Real-time session disconnected');
      return;
    }
    const nextLocked = !group?.isLocked;
    
    // Optimistically update the single source of truth immediately for instant UI responsiveness
    setGroup((prev) => prev ? { ...prev, isLocked: nextLocked } : prev);

    socketRef.current.emit('group:toggleLock', { groupCode, isLocked: nextLocked, requesterName: currentName }, (response) => {
      if (response?.success) {
        setGroup(response.groupOrder);
        toast.success(nextLocked ? 'Shared cart is now LOCKED 🔒' : 'Shared cart is now UNLOCKED 🔓');
      } else {
        setGroup((prev) => prev ? { ...prev, isLocked: !nextLocked } : prev);
        toast.error('Failed to toggle lock status');
      }
    });
  };

  const handleRemoveMember = (memberName) => {
    if (!isHost) {
      toast.error('Only the host can remove members');
      return;
    }
    if (memberName === currentName) {
      toast.error('Host cannot remove themselves');
      return;
    }
    if (!socketRef.current?.connected) {
      toast.error('Session disconnected');
      return;
    }
    socketRef.current.emit(
      'group:removeMember',
      { groupCode, memberName, requesterName: currentName },
      (response) => {
        if (response?.success) {
          setGroup(response.groupOrder);
          toast.success(`Removed ${memberName} from feast`);
        } else {
          toast.error(response?.message || 'Failed to remove member');
        }
      }
    );
  };

  const handleStartCheckout = async () => {
    if (!isHost) {
      toast.error('Only the host can start group checkout');
      return;
    }
    if (!group?.cartItems?.length) {
      toast.error('The shared cart is empty');
      return;
    }
    if (!socketRef.current?.connected) {
      toast.error('Session disconnected');
      return;
    }
    socketRef.current.emit(
      'group:startCheckout',
      { groupCode, requesterName: currentName },
      async (response) => {
        if (response?.success) {
          setGroup(response.groupOrder);
          const itemsToAdd = response.groupOrder.cartItems.map((item) => ({ itemId: item.itemId, quantity: item.quantity }));
          await addItemsToCart(itemsToAdd);
          localStorage.setItem('groupOrderCheckout', JSON.stringify(response.groupOrder.cartItems));
          localStorage.setItem('groupOrderCode', groupCode);
          toast.success('Group checkout started! 💳');
          navigate('/order');
        } else {
          toast.error(response?.message || 'Unable to start checkout');
        }
      }
    );
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
    const isSavedHost = localStorage.getItem(`isHost_${group.groupCode}`) === 'true';
    const isCreator = group.createdBy && userProfile && String(group.createdBy) === String(userProfile._id);
    const hostMember = (group.members && group.members.find((m) => m.isHost)) || (group.members && group.members[0]);
    const isHostByName = hostMember && (hostMember.name === currentName || currentName === 'Guest' || currentName === 'Host');
    return Boolean(isSavedHost || isCreator || isHostByName);
  }, [group, userProfile, currentName]);

  const isStarted = Boolean(group?.isStarted);

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
              <span>✅ Group Feast Live! Code: {group.groupCode}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HEADER BAR */}
        <div className="group-order-header">
          <button type="button" className="back-button" onClick={() => navigate('/cart')}>
            <FiChevronLeft /> Back to cart
          </button>
          <div className="header-meta">
            <p className="group-order-label">QuickBite Group Feast: {group.groupName}</p>
            <h1>{group.groupCode}</h1>
          </div>
        </div>

        {/* STAGE 1: BEFORE FEAST STARTS (ONLY SHOW GROUP SESSION PANEL) */}
        {!isStarted ? (
          <motion.div
            key="stage1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="group-order-stage1-container"
            style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}
          >
            <div className="lobby-card glass-card">
              <div className="lobby-header">
                <h2>{group.groupName}</h2>
                <span className="badge live" style={{ background: '#fef08a', color: '#854d0e', fontWeight: '800' }}>
                  LOBBY / WAITING
                </span>
              </div>

              {/* Timer */}
              <div className="lobby-timer-section">
                <div className="circular-timer-wrapper muted">
                  <svg width="100" height="100" className="circular-timer-svg">
                    <circle cx="50" cy="50" r="40" className="timer-bg-circle" />
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
                <p className="timer-label-beneath">Session Timer: {formatTimer(timeLeft)}</p>
              </div>

              {/* Group Code */}
              <div className="lobby-code-block">
                <p className="code-label">Group Code</p>
                <div className="code-row">
                  <span className="code-text-mono">{group.groupCode}</span>
                  <button
                    type="button"
                    className="copy-code-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(group.groupCode);
                      toast.success('Group Code Copied!');
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
                    onClick={handleShareWhatsApp}
                  >
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    className="invite-btn link-btn"
                    onClick={handleCopyInviteMessage}
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

              {/* Members Joined List */}
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

              {/* Food Preference / Allergy Info */}
              <div className="lobby-note-card">
                <span>📌 Food Preference / Allergy Info: {group.note || 'No special requests'}</span>
              </div>

              {/* Inline Join Section if !joined */}
              {!joined && (
                <div className="join-group-card">
                  <div className="join-card-header">
                    <h3>👋 Join the Group Feast</h3>
                    <p>Enter your name to join the group session.</p>
                  </div>
                  <div className="join-input-row">
                    <input
                      type="text"
                      className="join-name-input"
                      placeholder="Enter your name"
                      value={joinName}
                      onChange={(e) => setJoinName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleJoinGroup();
                      }}
                    />
                    <button
                      type="button"
                      className="join-feast-btn-green"
                      onClick={handleJoinGroup}
                      disabled={expired}
                    >
                      {expired ? 'Session Expired' : 'Join Group Feast'}
                    </button>
                  </div>
                </div>
              )}

              {/* Host vs Member Primary CTA */}
              {joined && (
                <div style={{ marginTop: '12px' }}>
                  {isHost ? (
                    <button
                      type="button"
                      className="start-feast-btn-hero"
                      onClick={handleStartFeast}
                      disabled={expired}
                    >
                      🚀 Start Group Feast
                    </button>
                  ) : (
                    <div className="waiting-host-pill">
                      ⏳ Waiting for the host to start the feast
                    </div>
                  )}
                </div>
              )}

              {/* Group Chat Button */}
              <button
                type="button"
                className="chat-toggle-btn"
                onClick={() => {
                  setShowChat(true);
                  setUnreadCount(0);
                }}
                style={{ marginTop: '12px', width: '100%' }}
              >
                💬 Group Chat {joined ? '🔓' : '🔒'} {unreadCount > 0 && <span className="chat-badge">{unreadCount}</span>}
              </button>
            </div>
          </motion.div>
        ) : (
          /* STAGE 2: AFTER HOST CLICKS "START GROUP FEAST" (FULL DASHBOARD UNLOCKED) */
          <motion.div
            key="stage2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Top Summary Card */}
            <div className="lobby-card glass-card" style={{ width: '100%', boxSizing: 'border-box', marginBottom: '24px' }}>
              <div className="lobby-header">
                <h2>{group.groupName}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="feast-started-badge">🎉 Feast Started</span>
                  <span className={`badge ${expired ? 'expired' : 'live'}`}>{expired ? 'Expired' : 'LIVE'}</span>
                </div>
              </div>

              <div className="joined-actions-bar">
                <button type="button" className="start-feast-btn-hero" disabled style={{ width: 'auto', padding: '10px 20px', fontSize: '0.9rem' }}>
                  🎉 Feast Started
                </button>
                <button
                  type="button"
                  className="joined-action-btn chat-btn"
                  onClick={() => {
                    setShowChat(true);
                    setUnreadCount(0);
                  }}
                >
                  💬 Group Chat 🔓 {chatMessages.length > 0 && `(${chatMessages.length})`}
                </button>
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
                  onClick={handleCopyInviteMessage}
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
            {isStarted && !expired && !group.isLocked && (
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
            {/* REAL-TIME COLLABORATIVE MENU (UNLOCKED ONLY AFTER STARTING FEAST) */}
            {!isStarted ? (
              <div className="feast-locked-banner glass-card">
                <div className="locked-banner-icon">{isHost ? '🎉' : '⏳'}</div>
                <h3>
                  {isHost
                    ? 'Ready to start ordering?'
                    : 'Waiting for the host to start the Group Feast'}
                </h3>
                <p>
                  {isHost
                    ? 'Click "Start Group Feast" to unlock the food menu for all joined members.'
                    : 'The host will unlock the food menu shortly. You can chat with the group in the meantime!'}
                </p>
                {isHost && (
                  <button
                    type="button"
                    className="start-feast-main-btn"
                    onClick={handleStartFeast}
                  >
                    🎉 Start Group Feast
                  </button>
                )}
              </div>
            ) : (
              !expired && !group.isLocked && (
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
                    )
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
          </motion.div>
        )}

      {/* Floating Chat Trigger Button in Group Room */}
      <button
        type="button"
        className="floating-chat-trigger"
        onClick={() => {
          setShowChat(true);
          setUnreadCount(0);
        }}
      >
        💬 Chat {joined ? '🔓' : '🔒'} {unreadCount > 0 && <span className="chat-badge">{unreadCount}</span>}
      </button>

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
                <h3>💬 Live Group Chat {!joined && '🔒'}</h3>
                <button type="button" className="chat-close-btn" onClick={() => setShowChat(false)}>✕</button>
              </div>

              {!joined ? (
                <div className="chat-locked-container">
                  <div className="chat-locked-icon">🔒</div>
                  <h4>Group Chat</h4>
                  <p>Join the group to view and participate in the conversation.</p>
                  <button
                    type="button"
                    className="join-feast-btn-green"
                    onClick={() => {
                      setShowChat(false);
                      const inputEl = document.querySelector('.join-name-input');
                      if (inputEl) {
                        inputEl.focus();
                        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                  >
                    Join Group Feast
                  </button>
                </div>
              ) : (
                <>
                  {/* Message Feed */}
                  <div className="chat-messages-container">
                    {loading ? (
                      <div className="chat-loading-state">
                        <p>Loading messages...</p>
                      </div>
                    ) : chatMessages.length === 0 ? (
                      <div className="chat-empty-state">
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => {
                        const isMe = msg.sender === currentName;
                        const isHostMsg = group?.members?.[0] && msg.sender === group.members[0].name;
                        const initials = msg.initials || (msg.sender ? msg.sender.charAt(0).toUpperCase() : '?');
                        const formattedTime = msg.timestamp
                          ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Just now';

                        return (
                          <div key={msg.messageId || msg._id || `msg-${idx}`} className={`chat-message-row user ${isMe ? 'me' : 'others'}`}>
                            {!isMe && (
                              <div className="msg-avatar">
                                {initials}
                              </div>
                            )}
                            <div className="msg-content-wrapper">
                              <div className="msg-info">
                                <span className={`msg-sender ${isHostMsg ? 'host-name' : ''}`}>
                                  {msg.sender} {isHostMsg && <span className="host-chat-badge">Host</span>}
                                </span>
                                <span className="msg-time">{formattedTime}</span>
                              </div>
                              <div className="msg-bubble">
                                <p>{msg.text}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
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
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default GroupOrder;
