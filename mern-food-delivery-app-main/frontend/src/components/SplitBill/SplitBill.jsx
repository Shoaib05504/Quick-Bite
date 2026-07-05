import React, { useMemo, useState } from 'react';
import './SplitBill.css';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiShare2, FiBell, FiDollarSign, FiCheckCircle, FiClock, FiStar, FiUser, FiActivity } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';

const SplitBill = ({ items, members, foodList, equalSplit, onToggleEqual, groupCode, currentUser, isHost, socket }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  // calculate base amounts
  const itemSummary = useMemo(() => {
    return items.map((item) => {
      const food = foodList.find((product) => product._id === item.itemId) || {};
      const price = Number(food.price || item.price || 0);
      const lineTotal = price * Number(item.quantity || 0);
      return {
        ...item,
        food,
        price,
        lineTotal,
      };
    });
  }, [items, foodList]);

  const subtotal = useMemo(() => {
    return itemSummary.reduce((sum, item) => sum + item.lineTotal, 0);
  }, [itemSummary]);

  // Static pricing rules (INR)
  const deliveryFee = subtotal > 0 ? 40 : 0;
  const taxes = Number((subtotal * 0.05).toFixed(2)); // 5% GST
  const platformFee = subtotal > 0 ? 10 : 0;
  const discountApplied = Number((subtotal * 0.1).toFixed(2)); // 10% coupon savings
  const grandTotal = Number((subtotal + deliveryFee + taxes + platformFee - discountApplied).toFixed(2));

  // Option 1: Equal Split calculations
  const memberCount = members.length || 1;
  const equalShare = Number((grandTotal / memberCount).toFixed(2));

  // Option 2: Order-based Split calculations
  const memberDetails = useMemo(() => {
    return members.map((member) => {
      const userItems = itemSummary.filter((item) => item.addedBy === member.name);
      const userSubtotal = userItems.reduce((sum, item) => sum + item.lineTotal, 0);

      const proportion = subtotal > 0 ? userSubtotal / subtotal : 0;
      const userDelivery = Number((deliveryFee * proportion).toFixed(2));
      const userTaxes = Number((taxes * proportion).toFixed(2));
      const userPlatform = Number((platformFee * proportion).toFixed(2));
      const userDiscount = Number((discountApplied * proportion).toFixed(2));
      const userFinalTotal = Number((userSubtotal + userDelivery + userTaxes + userPlatform - userDiscount).toFixed(2));

      return {
        name: member.name,
        items: userItems,
        subtotal: userSubtotal,
        deliveryFeeShare: userDelivery,
        taxShare: userTaxes,
        platformFeeShare: userPlatform,
        discountShare: userDiscount,
        finalAmount: userFinalTotal,
        paymentStatus: member.paymentStatus || 'Pending',
      };
    });
  }, [members, itemSummary, subtotal, deliveryFee, taxes, platformFee, discountApplied]);

  // Identify biggest spender
  const maxSpender = useMemo(() => {
    if (memberDetails.length === 0) return null;
    return [...memberDetails].sort((a, b) => b.subtotal - a.subtotal)[0];
  }, [memberDetails]);

  // Payment progress calculations
  const paidCount = members.filter((m) => m.paymentStatus === 'Paid').length;
  const paymentProgress = Math.round((paidCount / memberCount) * 100);

  // Toggle payment status
  const handlePaymentToggle = (memberName, currentStatus) => {
    const nextStatus = currentStatus === 'Paid' ? 'Pending' : 'Paid';
    if (!socket?.connected) {
      toast.error('Real-time session disconnected');
      return;
    }
    socket.emit('group:updatePayment', { groupCode, name: memberName, paymentStatus: nextStatus }, (res) => {
      if (res?.success) {
        toast.success(`${memberName} marked as ${nextStatus}`);
      } else {
        toast.error('Failed to update status');
      }
    });
  };

  // Remind unpaid members
  const handleSendReminder = () => {
    if (!socket?.connected) {
      toast.error('Real-time session disconnected');
      return;
    }
    socket.emit('group:remindUnpaid', { groupCode, senderName: currentUser }, (res) => {
      if (res?.success) {
        toast.success('Payment reminders sent!');
      } else {
        toast.error('Failed to send reminder');
      }
    });
  };

  // Open premium sharing modal
  const handleShareInvoice = () => {
    setShowShareModal(true);
  };

  const getShareText = () => {
    const orderSummaryText = itemSummary.map((item, idx) => {
      return `${idx + 1}. ${item.food?.name || item.name || 'Food Item'}\nQuantity: x${item.quantity}\nAdded By: ${item.addedBy}\nAmount: ₹${item.lineTotal}`;
    }).join('\n\n');

    const membersText = memberDetails.map((m) => {
      const memberAmount = equalSplit ? equalShare : m.finalAmount;
      const itemsList = m.items.map(item => item.food?.name || item.name).join(', ') || 'No items';
      return `👤 ${m.name}\nItems Ordered: ${itemsList}\nAmount to Pay: ₹${memberAmount}\nPayment Status: ${m.paymentStatus}`;
    }).join('\n\n');

    return `🍔 QuickBite Group Feast Receipt

Group Code: ${groupCode}
Date: ${new Date().toLocaleDateString()}

--------------------------------

🧾 Order Summary:

${orderSummaryText}

--------------------------------

💰 Bill Details:

Subtotal: ₹${subtotal}
Delivery Charges: ₹${deliveryFee}
Taxes & Fees: ₹${(taxes + platformFee).toFixed(2)}
Group Discount: -₹${discountApplied}

Grand Total: ₹${grandTotal}

--------------------------------

💳 Split Details:

Split Type:
${equalSplit ? 'Equal Split' : 'Order Based Split'}

Members:

${membersText}

--------------------------------

🔗 Join QuickBite Feast:
${window.location.href}

FAST • FRESH • DELICIOUS 🚀`;
  };

  const getShortShareText = () => {
    const currentUserDetail = memberDetails.find(m => m.name === currentUser) || {};
    const currentUserShare = equalSplit ? equalShare : (currentUserDetail.finalAmount || 0);
    const currentUserStatus = currentUserDetail.paymentStatus || 'Pending';

    return `🍔 QuickBite Bill
Group: ${groupCode}
Total: ₹${grandTotal}
Your Share: ₹${currentUserShare}
Status: ${currentUserStatus}
Join: ${window.location.href}`;
  };

  // PDF Generation via jsPDF
  const handleDownloadInvoice = () => {
    try {
      const doc = new jsPDF();

      // QuickBite Branding Header
      doc.setFillColor(37, 99, 235); // Royal Blue
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('QuickBite Feast Receipt', 14, 26);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Group Code: ${groupCode}  |  Date: ${new Date().toLocaleDateString()}`, 14, 33);

      doc.setTextColor(17, 24, 39);
      doc.setFontSize(14);
      doc.setFont('Helvetica', 'bold');
      doc.text('Order Summary', 14, 52);

      // Render Items Table
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'bold');
      doc.text('Item', 14, 62);
      doc.text('Added By', 95, 62);
      doc.text('Qty', 145, 62);
      doc.text('Price', 170, 62);
      doc.text('Total', 190, 62, { align: 'right' });

      doc.setDrawColor(226, 232, 240);
      doc.line(14, 65, 196, 65);

      let currentY = 71;
      doc.setFont('Helvetica', 'normal');
      itemSummary.forEach((item) => {
        if (currentY > 260) {
          doc.addPage();
          currentY = 20;
        }
        doc.text(String(item.food.name || item.itemId).substring(0, 38), 14, currentY);
        doc.text(String(item.addedBy), 95, currentY);
        doc.text(String(item.quantity), 145, currentY);
        doc.text(`₹${item.price}`, 170, currentY);
        doc.text(`₹${item.lineTotal}`, 196, currentY, { align: 'right' });
        currentY += 8;
      });

      doc.line(14, currentY - 2, 196, currentY - 2);

      // Financials breakdown
      currentY += 4;
      doc.text('Subtotal:', 140, currentY);
      doc.text(`₹${subtotal}`, 196, currentY, { align: 'right' });
      currentY += 6;
      doc.text('Delivery Charges:', 140, currentY);
      doc.text(`₹${deliveryFee}`, 196, currentY, { align: 'right' });
      currentY += 6;
      doc.text('Taxes (5% GST):', 140, currentY);
      doc.text(`₹${taxes}`, 196, currentY, { align: 'right' });
      currentY += 6;
      doc.text('Platform Fee:', 140, currentY);
      doc.text(`₹${platformFee}`, 196, currentY, { align: 'right' });
      currentY += 6;
      doc.text('Discount Applied:', 140, currentY);
      doc.text(`-₹${discountApplied}`, 196, currentY, { align: 'right' });
      currentY += 8;

      doc.setFont('Helvetica', 'bold');
      doc.text('Grand Total:', 140, currentY);
      doc.text(`₹${grandTotal}`, 196, currentY, { align: 'right' });
      
      // Individual Summary Table
      currentY += 15;
      doc.setFontSize(14);
      doc.text('Individual Share Breakdown', 14, currentY);
      currentY += 8;

      doc.setFontSize(10);
      doc.text('Member', 14, currentY);
      doc.text('Items Ordered', 70, currentY);
      doc.text('Amount Owed', 150, currentY);
      doc.text('Status', 180, currentY);
      
      doc.line(14, currentY + 3, 196, currentY + 3);
      currentY += 9;

      doc.setFont('Helvetica', 'normal');
      if (equalSplit) {
        members.forEach((member) => {
          doc.text(member.name, 14, currentY);
          doc.text('Equal Split Share', 70, currentY);
          doc.text(`₹${equalShare}`, 150, currentY);
          doc.text(member.paymentStatus || 'Pending', 180, currentY);
          currentY += 8;
        });
      } else {
        memberDetails.forEach((member) => {
          doc.text(member.name, 14, currentY);
          const itemNames = member.items.map((i) => `${i.food.name} x${i.quantity}`).join(', ');
          doc.text(itemNames.length > 35 ? itemNames.substring(0, 32) + '...' : itemNames, 70, currentY);
          doc.text(`₹${member.finalAmount}`, 150, currentY);
          doc.text(member.paymentStatus, 180, currentY);
          currentY += 8;
        });
      }

      // Branding Footer
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text('Thank you for ordering with QuickBite. Hope to feed you again soon!', 105, 280, { align: 'center' });

      doc.save(`QuickBite_Feast_${groupCode}.pdf`);
      toast.success('Invoice downloaded!');
    } catch (error) {
      console.error(error);
      toast.error('Unable to generate invoice PDF.');
    }
  };

  return (
    <div className="split-bill-card glass-card animate-card">
      {/* HEADER SECTION */}
      <div className="split-header">
        <div>
          <h2>Smart Split Billing</h2>
          <p className="split-subtitle">Dynamic real-time shared calculations</p>
        </div>
        <div className="tab-buttons">
          <button
            type="button"
            className={`tab-btn ${!equalSplit ? 'active' : ''}`}
            onClick={() => { if (equalSplit) onToggleEqual(); }}
          >
            Custom Split
          </button>
          <button
            type="button"
            className={`tab-btn ${equalSplit ? 'active' : ''}`}
            onClick={() => { if (!equalSplit) onToggleEqual(); }}
          >
            Equal Split
          </button>
        </div>
      </div>

      {/* PAYMENT PROGRESS COMPLETION BAR */}
      <div className="payment-progress-container">
        <div className="progress-labels">
          <span>Payment Completion</span>
          <span>{paidCount} of {memberCount} Paid (<span className="progress-green-text">{paymentProgress}%</span>)</span>
        </div>
        <div className="progress-bar-track">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${paymentProgress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="progress-bar-fill"
          />
        </div>
      </div>

      {/* HIGHLIGHT COUPON SAVINGS */}
      {discountApplied > 0 && (
        <div className="coupon-banner">
          🎁 Group Discount Active! Total Savings: <strong>₹{discountApplied}</strong> (10% off)
        </div>
      )}

      {/* DETAILS VIEW COMPONENT */}
      <div className="split-grid">
        {equalSplit ? (
          <div className="equal-split-view">
            <div className="equal-stat-box">
              <div className="stat-item">
                <p>Total Bill</p>
                <h3>₹{grandTotal}</h3>
              </div>
              <div className="stat-separator" />
              <div className="stat-item">
                <p>Members</p>
                <h3>{memberCount}</h3>
              </div>
              <div className="stat-separator" />
              <div className="stat-item highlight-item">
                <p>Each Pays</p>
                <h3>₹{equalShare}</h3>
              </div>
            </div>

            <div className="member-list">
              {members.map((member) => {
                const isSelf = member.name === currentUser;
                return (
                  <div key={member.name} className={`member-payment-row ${member.paymentStatus === 'Paid' ? 'paid-row' : ''}`}>
                    <div className="member-info">
                      <div className="member-avatar">
                        <FiUser />
                      </div>
                      <div>
                        <span className="member-name-tag">{member.name} {isSelf && '(You)'}</span>
                        <span className={`status-pill ${member.paymentStatus.toLowerCase()}`}>
                          {member.paymentStatus}
                        </span>
                      </div>
                    </div>

                    <div className="member-actions">
                      <span className="member-amount">₹{equalShare}</span>
                      {(isHost || isSelf) ? (
                        <button
                          type="button"
                          className={`pay-share-btn ${member.paymentStatus === 'Paid' ? 'paid' : ''}`}
                          onClick={() => handlePaymentToggle(member.name, member.paymentStatus)}
                        >
                          {member.paymentStatus === 'Paid' ? 'Paid ✓' : isSelf ? 'Pay Share' : 'Toggle'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="individual-split-view">
            {memberDetails.map((member) => {
              const isSpender = maxSpender && maxSpender.name === member.name && member.subtotal > 0;
              const isSelf = member.name === currentUser;
              return (
                <div
                  key={member.name}
                  className={`member-section-card ${member.paymentStatus === 'Paid' ? 'paid-card' : ''} ${isSpender ? 'biggest-spender' : ''}`}
                >
                  <div className="member-section-header">
                    <div className="member-title-group">
                      <div className="member-avatar">
                        <FiUser />
                      </div>
                      <div>
                        <h4>
                          {member.name} {isSelf && '(You)'}
                          {isSpender && <span className="crown-badge" title="Biggest Spender">👑 Spender</span>}
                        </h4>
                        <span className={`status-pill ${member.paymentStatus.toLowerCase()}`}>
                          {member.paymentStatus}
                        </span>
                      </div>
                    </div>
                    <div className="member-section-bill">
                      <span className="sub-owes">Owes</span>
                      <span className="owes-amount">₹{member.finalAmount}</span>
                    </div>
                  </div>

                  <div className="member-items-list">
                    {member.items.map((item, idx) => (
                      <div key={idx} className="split-item-row">
                        <span>{item.food.name || item.itemId} x{item.quantity}</span>
                        <span>₹{item.lineTotal}</span>
                      </div>
                    ))}
                    {member.items.length === 0 && (
                      <p className="no-items-placeholder">No items added to shared cart</p>
                    )}
                  </div>

                  <div className="member-share-breakdown">
                    <div className="breakdown-row">
                      <span>Delivery share (proportional)</span>
                      <span>₹{member.deliveryFeeShare}</span>
                    </div>
                    <div className="breakdown-row">
                      <span>Taxes & fees share</span>
                      <span>₹{(member.taxShare + member.platformFeeShare).toFixed(2)}</span>
                    </div>
                    {member.discountShare > 0 && (
                      <div className="breakdown-row discount-row">
                        <span>Group savings share</span>
                        <span>-₹{member.discountShare}</span>
                      </div>
                    )}
                  </div>

                  {(isHost || isSelf) && (
                    <div className="member-card-footer">
                      <button
                        type="button"
                        className={`pay-share-btn ${member.paymentStatus === 'Paid' ? 'paid' : ''}`}
                        onClick={() => handlePaymentToggle(member.name, member.paymentStatus)}
                      >
                        {member.paymentStatus === 'Paid' ? 'Paid ✓' : isSelf ? 'Pay Share' : 'Toggle Payment'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BILL TOTAL SUMMARY & ACTIONS */}
      <div className="split-bill-footer">
        <div className="summary-total-banner">
          <div>
            <span className="total-label">Subtotal: ₹{subtotal} | Delivery: ₹{deliveryFee} | Taxes: ₹{taxes}</span>
            <h3>Grand Total: ₹{grandTotal}</h3>
          </div>
          <div className="footer-action-buttons">
            <button type="button" className="footer-btn share-btn" onClick={handleShareInvoice}>
              <FiShare2 /> Share Bill
            </button>
            <button type="button" className="footer-btn download-btn" onClick={handleDownloadInvoice}>
              <FiDownload /> Download PDF
            </button>
            {isHost && paidCount < memberCount && (
              <button type="button" className="footer-btn remind-btn" onClick={handleSendReminder}>
                <FiBell /> Remind Unpaid
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Premium Sharing Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="share-modal-overlay" onClick={() => setShowShareModal(false)}>
            <motion.div
              className="share-modal-content"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div className="share-modal-header">
                <h3>📤 Share QuickBite Bill</h3>
                <p>🍔 QuickBite Group Feast</p>
                <span>Share your split bill with friends</span>
              </div>
              
              <div className="share-modal-divider" />
              
              <div className="share-options-list">
                <button
                  type="button"
                  className="share-option-btn whatsapp-opt"
                  onClick={() => {
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(getShareText())}`, '_blank');
                  }}
                >
                  <span className="option-icon">🟢</span>
                  <div className="option-text">
                    <strong>WhatsApp</strong>
                    <span>Send bill directly to group</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="share-option-btn gmail-opt"
                  onClick={() => {
                    window.open(`mailto:?subject=${encodeURIComponent("QuickBite Group Feast Bill - " + groupCode)}&body=${encodeURIComponent(getShareText())}`, '_blank');
                  }}
                >
                  <span className="option-icon">📧</span>
                  <div className="option-text">
                    <strong>Gmail</strong>
                    <span>Share receipt by email</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="share-option-btn messages-opt"
                  onClick={() => {
                    window.open(`sms:?&body=${encodeURIComponent(getShortShareText())}`, '_blank');
                  }}
                >
                  <span className="option-icon">💬</span>
                  <div className="option-text">
                    <strong>Messages</strong>
                    <span>Send as text message</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="share-option-btn copy-opt"
                  onClick={() => {
                    navigator.clipboard.writeText(getShareText()).then(() => {
                      toast.success("✅ QuickBite bill copied successfully");
                    });
                  }}
                >
                  <span className="option-icon">🔗</span>
                  <div className="option-text">
                    <strong>Copy Link</strong>
                    <span>Copy invite + bill details</span>
                  </div>
                </button>
              </div>

              <div className="share-modal-divider" />

              <button
                type="button"
                className="share-modal-cancel"
                onClick={() => setShowShareModal(false)}
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SplitBill;
