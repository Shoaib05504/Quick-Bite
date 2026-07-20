import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';
import { FaUsers } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { groupOrderAPI } from '../../services/groupOrderService';
import './GroupOrderModal.css';

const QUICK_CHIPS = [
  { label: '🥗 Veg Only', text: 'Veg Only 🥗' },
  { label: '🌶️ Spicy', text: 'Spicy 🌶️' },
  { label: '💸 Budget', text: 'Budget 💸' },
  { label: '🥜 No Nuts', text: 'No peanuts please! 🥜' },
  { label: '🎉 Treat', text: 'Treat 🎉' }
];

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
      staggerChildren: 0.06,
      delayChildren: 0.05
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 30,
    transition: { duration: 0.2 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      duration: 0.3, 
      ease: 'easeOut',
      staggerChildren: 0.06
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' }
  }
};

const pinnedCardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      delay: 0.5,
      duration: 0.3, 
      ease: 'easeOut' 
    }
  }
};

const GroupOrderModal = ({ cartLines, onClose }) => {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);

  // Setup form states
  const [groupName, setGroupName] = useState('');
  const [noteToGroup, setNoteToGroup] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(5);
  const [groupExpiry, setGroupExpiry] = useState('30 Minutes');
  const [isExpiryDropdownOpen, setIsExpiryDropdownOpen] = useState(false);

  const handleDecrement = () => {
    setMaxParticipants((prev) => Math.max(1, prev - 1));
  };
  
  const handleIncrement = () => {
    setMaxParticipants((prev) => Math.min(100, prev + 1));
  };

  const handleChipClick = (chipText) => {
    if (noteToGroup.includes(chipText)) {
      setNoteToGroup((prev) => prev.replace(chipText, '').replace(/\s+/g, ' ').trim());
    } else {
      setNoteToGroup((prev) => {
        const clean = prev.trim();
        if (!clean) return chipText;
        return `${clean} ${chipText}`.slice(0, 100);
      });
    }
  };

  const cartItemsPayload = useMemo(
    () =>
      cartLines.map((item) => ({
        itemId: item._id,
        quantity: item.quantity,
        addedBy: item.name,
        price: item.price,
      })),
    [cartLines]
  );

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast('⚠️ Please enter a group name to start your feast', {
        position: 'top-right',
        duration: 3000,
        style: {
          background: 'rgba(6, 95, 70, 0.85)',
          color: '#ffffff',
          border: '1px solid rgba(209, 250, 229, 0.25)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '14px',
          padding: '12px 18px',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)',
        }
      });
      return;
    }
    setGenerating(true);
    const response = await groupOrderAPI.createGroupOrder({ 
      cartItems: [],
      groupName: groupName,
      note: noteToGroup,
      maxParticipants: maxParticipants,
      expiry: groupExpiry
    });
    setGenerating(false);

    if (response.success) {
      toast.success('Group Feast Created! 🚀');
      onClose(); // Close modal immediately
      navigate(`/group-order/${response.groupOrder.groupCode}`); // Navigate directly to live Group Room
    } else {
      toast.error(response.message || 'Unable to create group order');
    }
  };

  return (
    <div className="group-order-modal-overlay">
      <motion.div
        className="group-order-modal setup-mode"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <button className="modal-close" type="button" onClick={onClose} title="Close">
          ✕
        </button>

        <div className="setup-container">
          {/* Ambient Background glows */}
          <div className="ambient-glow glow-top-right" />
          <div className="ambient-glow glow-bottom-left" />

          {/* Header */}
          <motion.div className="setup-header" variants={itemVariants}>
            <motion.div 
              className="setup-emoji-icon"
              animate={{ y: [0, -8, 0] }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut",
                repeatType: "reverse"
              }}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <FaUsers style={{ color: '#c84fff', fontSize: '3.5rem' }} />
            </motion.div>
            <h1 className="setup-title">QuickBite Group Feast</h1>
            <p className="setup-subtitle">Order together with friends using a shared smart cart</p>
          </motion.div>

          {/* Frosted Glass Card */}
          <motion.div className="frosted-glass-card" variants={cardVariants}>
            {/* 1. Group Name field */}
            <motion.div className="form-field" variants={itemVariants}>
              <label className="field-label">Group Name</label>
              <input 
                type="text" 
                className="field-input" 
                value={groupName} 
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
              />
            </motion.div>

            {/* 2. Note to Group field */}
            <motion.div className="form-field" variants={itemVariants}>
              <label className="field-label">📝 Note to Group</label>
              <div className="textarea-container">
                <textarea 
                  className="field-textarea" 
                  value={noteToGroup} 
                  onChange={(e) => setNoteToGroup(e.target.value.slice(0, 100))}
                  placeholder="Add instructions for your group (optional)"
                  maxLength={100}
                />
                <span className="char-counter">{noteToGroup.length}/100</span>
              </div>
              
              {/* Horizontal scrollable row of quick chips */}
              <div className="chips-row">
                {QUICK_CHIPS.map((chip) => {
                  const active = noteToGroup.includes(chip.text);
                  return (
                    <motion.button
                      key={chip.label}
                      type="button"
                      className={`quick-chip ${active ? 'active' : ''}`}
                      onClick={() => handleChipClick(chip.text)}
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ 
                        hover: { duration: 0.15 },
                        tap: { duration: 0.08 }
                      }}
                    >
                      {chip.label}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* 3. Maximum Participants stepper */}
            <motion.div className="form-field stepper-field" variants={itemVariants}>
              <label className="field-label">Maximum Participants</label>
              <div className="stepper-row">
                <motion.button 
                  type="button" 
                  className="stepper-btn"
                  onClick={handleDecrement}
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ duration: 0.15 }}
                >
                  <svg width="14" height="2" viewBox="0 0 14 2" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1H13" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </motion.button>
                
                <div className="stepper-number-container">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={maxParticipants}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1.1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 12 }}
                      className="stepper-number"
                    >
                      {maxParticipants}
                    </motion.span>
                  </AnimatePresence>
                </div>

                <motion.button 
                  type="button" 
                  className="stepper-btn"
                  onClick={handleIncrement}
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ duration: 0.15 }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 1V13M1 7H13" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </motion.button>
              </div>
            </motion.div>

            {/* 4. Group Expiry field */}
            <motion.div className="form-field expiry-field" variants={itemVariants}>
              <label className="field-label">Group Expiry</label>
              <div 
                className={`expiry-row-clickable ${isExpiryDropdownOpen ? 'open' : ''}`}
                onClick={() => setIsExpiryDropdownOpen(!isExpiryDropdownOpen)}
              >
                <span className="expiry-value">{groupExpiry}</span>
                <FiChevronDown className="chevron-icon" size={22} />
              </div>
              
              <AnimatePresence>
                {isExpiryDropdownOpen && (
                  <motion.div
                    className="expiry-dropdown"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {['15 Minutes', '30 Minutes', '1 Hour', '2 Hours'].map((opt) => (
                      <div
                        key={opt}
                        className={`expiry-option ${groupExpiry === opt ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setGroupExpiry(opt);
                          setIsExpiryDropdownOpen(false);
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Divider */}
          <motion.div className="setup-divider" variants={itemVariants} />

          {/* Start Group Order Button */}
          <motion.div className="btn-container-wrapper" variants={itemVariants}>
            <motion.button
              type="button"
              className="start-feast-btn"
              onClick={handleCreateGroup}
              disabled={generating}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.97, y: 0 }}
            >
              {generating ? 'Starting Feast...' : '🚀 Start Group Order'}
            </motion.button>
          </motion.div>

          {/* Cancel Button */}
          <motion.div className="btn-container-wrapper" variants={itemVariants}>
            <motion.button
              type="button"
              className="cancel-feast-btn"
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
          </motion.div>

          {/* Pinned Note Card (compact) */}
          <motion.div 
            className="pinned-note-card"
            variants={pinnedCardVariants}
          >
            <span>📌 "{noteToGroup || 'No instructions added'} — Host"</span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default GroupOrderModal;
