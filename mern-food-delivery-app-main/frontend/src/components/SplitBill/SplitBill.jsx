import React, { useMemo, useState } from 'react';
import './SplitBill.css';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiShare2, FiBell, FiDollarSign, FiCheckCircle, FiClock, FiStar, FiUser, FiActivity } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import logo from '../../assets/logo.png';

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
    const orderSummaryText = itemSummary.map((item) => {
      return `🍽 Item Name: ${item.food?.name || item.name || 'Food Item'}
Quantity: x${item.quantity}
Added By: ${item.addedBy}
Price: ₹${item.price}`;
    }).join('\n\n');

    const membersText = memberDetails.map((m) => {
      const memberAmount = equalSplit ? equalShare : m.finalAmount;
      const itemsList = m.items.map(item => `🍽 ${item.food?.name || item.name}`).join('\n') || 'No items';
      const statusEmoji = m.paymentStatus === 'Paid' ? '🟢 Paid' : '🟡 Pending';
      return `👤 ${m.name}

Items Ordered:
${itemsList}

Amount to Pay:
₹${memberAmount}

Payment Status:
${statusEmoji}`;
    }).join('\n\n\n');

    return `QuickBite Group Feast Receipt

FAST • FRESH • DELICIOUS 🚀

🆔 Group Code: ${groupCode}
📅 Date: ${new Date().toLocaleDateString()}

━━━━━━━━━━━━━━━━━━

🧾 ORDER SUMMARY

${orderSummaryText}

━━━━━━━━━━━━━━━━━━

💰 BILL SUMMARY

Subtotal: ₹${subtotal}
Delivery Charges: ₹${deliveryFee}
Taxes & Fees: ₹${(taxes + platformFee).toFixed(2)}
Group Discount: -₹${discountApplied}

💚 Grand Total: ₹${grandTotal}

━━━━━━━━━━━━━━━━━━

💳 SMART SPLIT DETAILS

Split Type:
${equalSplit ? 'Equal Split' : 'Order Based Split'}

👥 MEMBERS DETAILS

${membersText}

━━━━━━━━━━━━━━━━━━

🔗 Join QuickBite Feast:

${window.location.href}

Thank you for ordering with QuickBite ❤️`;
  };

  const getShortShareText = () => {
    const currentUserDetail = memberDetails.find(m => m.name === currentUser) || {};
    const currentUserShare = equalSplit ? equalShare : (currentUserDetail.finalAmount || 0);
    const currentUserStatus = currentUserDetail.paymentStatus === 'Paid' ? '🟢 Paid' : '🟡 Pending';

    return `QuickBite Bill

Group: ${groupCode}

Total Bill: ₹${grandTotal}

Your Share: ₹${currentUserShare}

Status:
${currentUserStatus}

Join Feast:
${window.location.href}`;
  };

  // PDF Generation via jsPDF
  const handleDownloadInvoice = () => {
    const img = new Image();
    img.src = logo;

    const drawRupee = (doc, x, y) => {
      const currentDrawColor = doc.getDrawColor();
      doc.setDrawColor(80, 80, 80);
      doc.setLineWidth(0.20);
      
      // Top bar
      doc.line(x, y - 2.5, x + 1.8, y - 2.5);
      // Middle bar
      doc.line(x, y - 1.6, x + 1.4, y - 1.6);
      // Downward loop (Devanagari र shape)
      doc.line(x + 0.3, y - 2.5, x + 0.3, y - 1.2);
      doc.line(x + 0.3, y - 2.5, x + 1.3, y - 2.5);
      doc.line(x + 1.3, y - 2.5, x + 1.3, y - 1.8);
      doc.line(x + 1.3, y - 1.8, x + 0.3, y - 1.2);
      // Diagonal leg
      doc.line(x + 0.6, y - 1.4, x + 1.5, y);
      
      // Restore default draw color
      doc.setDrawColor(0);
    };

    const drawRupeeText = (doc, amount, x, y, align = 'left') => {
      const isNegative = amount < 0;
      const absAmountVal = Math.abs(amount);
      const absAmountStr = absAmountVal.toFixed(2);
      const textWidth = doc.getTextWidth(absAmountStr);
      const symbolWidth = 2.4; // width in mm for symbol + gap
      
      if (align === 'right') {
        doc.text(absAmountStr, x, y, { align: 'right' });
        const symbolX = x - textWidth - symbolWidth;
        drawRupee(doc, symbolX, y);
        if (isNegative) {
          doc.text('-', symbolX - 1.8, y);
        }
      } else {
        let currentX = x;
        if (isNegative) {
          doc.text('-', currentX, y);
          currentX += 1.8;
        }
        drawRupee(doc, currentX, y);
        doc.text(absAmountStr, currentX + symbolWidth, y);
      }
    };
    
    const generatePDF = (logoImg) => {
      try {
        const doc = new jsPDF();

        // 1. Draw Header Gradient using Canvas
        const headerCanvas = document.createElement('canvas');
        headerCanvas.width = 2100;
        headerCanvas.height = 400;
        const headerCtx = headerCanvas.getContext('2d');
        const headerGrad = headerCtx.createLinearGradient(0, 0, 2100, 400);
        headerGrad.addColorStop(0, '#000000');
        headerGrad.addColorStop(0.5, '#39B54A');
        headerGrad.addColorStop(1, '#9DFF00');
        headerCtx.fillStyle = headerGrad;
        headerCtx.fillRect(0, 0, 2100, 400);
        const headerImgData = headerCanvas.toDataURL('image/png');
        doc.addImage(headerImgData, 'PNG', 0, 0, 210, 40);
        
        // Draw QuickBite Logo
        if (logoImg) {
          doc.addImage(logoImg, 'PNG', 14, 8, 24, 24);
        }
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(18);
        doc.text(equalSplit ? 'QuickBite Feast Receipt' : 'QuickBite Custom Split Receipt', 44, 18);
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('FAST \u2022 FRESH \u2022 DELICIOUS', 44, 24);
        doc.text(`Group Code: ${groupCode}  |  Date: ${new Date().toLocaleDateString()}`, 44, 30);

        doc.setTextColor(17, 24, 39);
        doc.setFontSize(13);
        doc.setFont('Helvetica', 'bold');
        doc.text('Order Summary', 14, 52);

        // Render Items Table Header
        doc.setFontSize(9);
        doc.setFont('Helvetica', 'bold');
        if (equalSplit) {
          doc.text('Item Name', 14, 62);
          doc.text('Added By', 95, 62);
          doc.text('Quantity', 140, 62);
          doc.text('Price', 165, 62);
          doc.text('Total', 190, 62, { align: 'right' });
        } else {
          doc.text('Item Name', 14, 62);
          doc.text('Ordered By', 95, 62);
          doc.text('Qty', 145, 62);
          doc.text('Amount', 190, 62, { align: 'right' });
        }

        doc.setDrawColor(22, 163, 74); // Green accent line
        doc.setLineWidth(0.5);
        doc.line(14, 65, 196, 65);

        let currentY = 72;
        doc.setFont('Helvetica', 'normal');
        itemSummary.forEach((item) => {
          if (currentY > 260) {
            doc.addPage();
            currentY = 20;
          }
          doc.text(String(item.food.name || item.itemId).substring(0, 38), 14, currentY);
          doc.text(String(item.addedBy), 95, currentY);
          doc.text(String(item.quantity), 145, currentY);
          if (equalSplit) {
            drawRupeeText(doc, item.price, 165, currentY);
            drawRupeeText(doc, item.lineTotal, 196, currentY, 'right');
          } else {
            drawRupeeText(doc, item.lineTotal, 196, currentY, 'right');
          }
          currentY += 8;
        });

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(14, currentY - 2, 196, currentY - 2);

        // Financials breakdown
        currentY += 4;
        doc.setFontSize(9);
        doc.text('Subtotal:', 130, currentY);
        drawRupeeText(doc, subtotal, 196, currentY, 'right');
        currentY += 6;
        doc.text('Delivery Charges:', 130, currentY);
        drawRupeeText(doc, deliveryFee, 196, currentY, 'right');
        currentY += 6;
        doc.text('Taxes & Fees:', 130, currentY);
        drawRupeeText(doc, taxes + platformFee, 196, currentY, 'right');
        currentY += 6;
        doc.text('Group Discount:', 130, currentY);
        drawRupeeText(doc, -discountApplied, 196, currentY, 'right');
        currentY += 8;

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(22, 163, 74); // QuickBite Green
        doc.text('Grand Total:', 130, currentY);
        drawRupeeText(doc, grandTotal, 196, currentY, 'right');
        
        // Individual Summary Table Header
        currentY += 15;
        doc.setTextColor(17, 24, 39);
        doc.setFontSize(13);
        doc.text('Smart Split Details', 14, currentY);
        
        currentY += 6;
        doc.setFontSize(9.5);
        doc.setFont('Helvetica', 'normal');
        doc.text('Split Mode:', 14, currentY);
        doc.setFont('Helvetica', 'bold');
        doc.text(equalSplit ? 'Equal Split' : 'Custom Split', 34, currentY);
        
        // Payment Completion Progress & Paid Count
        currentY += 8;
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text(`Payment Progress: ${paidCount} of ${memberCount} Paid (${Math.round((paidCount / memberCount) * 100)}%)`, 14, currentY);
        
        if (discountApplied > 0) {
          doc.setTextColor(22, 163, 74);
          doc.text('Group Savings:', 130, currentY);
          drawRupeeText(doc, discountApplied, 196, currentY, 'right');
        }
        
        // Progress Bar Background
        currentY += 3;
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(14, currentY, 182, 4, 2, 2, 'F');
        
        // Progress Bar Gradient Fill using Canvas
        const ratio = paidCount / memberCount;
        if (ratio > 0) {
          const progressCanvas = document.createElement('canvas');
          const pWidth = Math.max(1, Math.round(1820 * ratio));
          progressCanvas.width = pWidth;
          progressCanvas.height = 40;
          const pCtx = progressCanvas.getContext('2d');
          const pGrad = pCtx.createLinearGradient(0, 0, pWidth, 0);
          pGrad.addColorStop(0, '#16A34A');
          pGrad.addColorStop(0.5, '#39B54A');
          pGrad.addColorStop(1, '#9DFF00');
          pCtx.fillStyle = pGrad;
          pCtx.fillRect(0, 0, pWidth, 40);
          const pImgData = progressCanvas.toDataURL('image/png');
          doc.addImage(pImgData, 'PNG', 14, currentY, 182 * ratio, 4);
        }
        
        currentY += 12;
        doc.setTextColor(17, 24, 39);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Members:', 14, currentY);
        
        currentY += 6;

        // Members list loop
        if (equalSplit) {
          members.forEach((member) => {
            const cardHeight = 48; // Spaced height
            if (currentY + cardHeight > 275) {
              doc.addPage();
              currentY = 15;
            }
            
            // Draw card background
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(14, currentY, 182, cardHeight, 4, 4, 'F');
            
            // Left accent bar (#39B54A)
            doc.setFillColor(57, 181, 74);
            doc.rect(14, currentY, 3, cardHeight, 'F');
            
            // Member Name
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(10.5);
            doc.setTextColor(17, 24, 39);
            doc.text(member.name, 22, currentY + 8);
            
            // Role
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(107, 114, 128);
            doc.text('Role:', 22, currentY + 15);
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(30, 64, 175);
            doc.text('Member', 32, currentY + 15);
            
            // Split Type
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(107, 114, 128);
            doc.text('Split Type:', 22, currentY + 22);
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(55, 65, 81);
            doc.text('Equal Split', 38, currentY + 22);
            
            // Amount to Pay
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.setTextColor(17, 24, 39);
            doc.text('Amount To Pay:', 22, currentY + 32);
            doc.setTextColor(22, 163, 74);
            drawRupeeText(doc, equalShare, 190, currentY + 32, 'right');
            
            // Payment Status
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(107, 114, 128);
            doc.text('Payment Status:', 22, currentY + 40);
            
            // Status Badge
            const isPaid = member.paymentStatus === 'Paid';
            doc.setFillColor(isPaid ? 240 : 254, isPaid ? 253 : 243, isPaid ? 244 : 199);
            doc.roundedRect(165, currentY + 36, 25, 6, 2, 2, 'F');
            doc.setFontSize(7.5);
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(isPaid ? 34 : 245, isPaid ? 197 : 158, isPaid ? 94 : 11);
            doc.text(isPaid ? 'PAID' : 'PENDING', 177.5, currentY + 40, { align: 'center' });
            
            currentY += cardHeight + 8;
          });
        } else {
          memberDetails.forEach((member) => {
            const itemsCount = member.items.length;
            const itemsHeight = itemsCount * 6;
            const cardHeight = 74 + itemsHeight; // Spaced dynamic height
            
            if (currentY + cardHeight > 275) {
              doc.addPage();
              currentY = 15;
            }
            
            // Draw card background
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(14, currentY, 182, cardHeight, 4, 4, 'F');
            
            // Left accent bar (#39B54A)
            doc.setFillColor(57, 181, 74);
            doc.rect(14, currentY, 3, cardHeight, 'F');
            
            // Member Name
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(10.5);
            doc.setTextColor(17, 24, 39);
            doc.text(member.name, 22, currentY + 8);
            
            // Role
            const isSpender = itemsCount > 0;
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(107, 114, 128);
            doc.text('Role:', 22, currentY + 15);
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(isSpender ? 30 : 55, isSpender ? 64 : 65, isSpender ? 175 : 81);
            doc.text(isSpender ? 'Spender' : 'Member', 32, currentY + 15);
            
            // Split Type
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(107, 114, 128);
            doc.text('Split Type:', 22, currentY + 22);
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(55, 65, 81);
            doc.text('Custom Split', 38, currentY + 22);
            
            // Items Ordered Header
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(55, 65, 81);
            doc.text('Items Ordered:', 22, currentY + 30);
            
            // Items List
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(55, 65, 81);
            let itemY = currentY + 35;
            member.items.forEach((item) => {
              doc.text(`${item.food.name || item.name} x${item.quantity}`, 26, itemY);
              drawRupeeText(doc, item.lineTotal, 190, itemY, 'right');
              itemY += 6;
            });
            
            // Calculations
            const itemTotalAmount = member.items.reduce((sum, i) => sum + i.lineTotal, 0);
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(107, 114, 128);
            doc.text('Item Total:', 22, itemY);
            drawRupeeText(doc, itemTotalAmount, 190, itemY, 'right');
            
            itemY += 6;
            doc.text('Delivery Share:', 22, itemY);
            drawRupeeText(doc, member.deliveryFeeShare, 190, itemY, 'right');
            
            itemY += 6;
            doc.text('Taxes Share:', 22, itemY);
            drawRupeeText(doc, member.taxShare + member.platformFeeShare, 190, itemY, 'right');
            
            itemY += 6;
            doc.text('Discount Applied:', 22, itemY);
            drawRupeeText(doc, -member.discountShare, 190, itemY, 'right');
            
            // Final Amount to Pay
            itemY += 8;
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.setTextColor(17, 24, 39);
            doc.text('Final Amount To Pay:', 22, itemY);
            doc.setTextColor(22, 163, 74);
            drawRupeeText(doc, member.finalAmount, 190, itemY, 'right');
            
            // Payment Status Section
            itemY += 8;
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(107, 114, 128);
            doc.text('Payment Status:', 22, itemY);
            
            // Status Badge
            const isPaid = member.paymentStatus === 'Paid';
            doc.setFillColor(isPaid ? 240 : 254, isPaid ? 253 : 243, isPaid ? 244 : 199);
            doc.roundedRect(165, itemY - 4, 25, 6, 2, 2, 'F');
            doc.setFontSize(7.5);
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(isPaid ? 34 : 245, isPaid ? 197 : 158, isPaid ? 94 : 11);
            doc.text(isPaid ? 'PAID' : 'PENDING', 177.5, itemY, { align: 'center' });
            
            currentY += cardHeight + 8;
          });
        }

        // Invite Link
        currentY += 6;
        if (currentY > 260) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(22, 163, 74); // Green label #16A34A
        doc.text('Join QuickBite Feast:', 14, currentY);
        
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(37, 99, 235); // Blue link #2563EB
        const linkText = window.location.href;
        doc.text(linkText, 52, currentY);
        
        // Link underline
        const linkWidth = doc.getTextWidth(linkText);
        doc.setDrawColor(37, 99, 235);
        doc.setLineWidth(0.15);
        doc.line(52, currentY + 0.8, 52 + linkWidth, currentY + 0.8);

        // Draw Footer Card using Canvas
        const footerHeight = 42;
        if (currentY + footerHeight > 275) {
          doc.addPage();
          currentY = 20;
        } else {
          currentY += 12;
        }
        
        // Render Footer Gradient Card via memory canvas
        const footerCanvas = document.createElement('canvas');
        footerCanvas.width = 1820;
        footerCanvas.height = 420;
        const fCtx = footerCanvas.getContext('2d');
        
        // Draw rounded rectangle path on canvas
        fCtx.beginPath();
        fCtx.moveTo(40, 0);
        fCtx.arcTo(1820, 0, 1820, 420, 40);
        fCtx.arcTo(1820, 420, 0, 420, 40);
        fCtx.arcTo(0, 420, 0, 0, 40);
        fCtx.arcTo(0, 0, 1820, 0, 40);
        fCtx.closePath();
        fCtx.clip();
        
        const fGrad = fCtx.createLinearGradient(0, 0, 1820, 420);
        fGrad.addColorStop(0, '#064E3B');
        fGrad.addColorStop(0.5, '#16A34A');
        fGrad.addColorStop(1, '#84CC16');
        fCtx.fillStyle = fGrad;
        fCtx.fillRect(0, 0, 1820, 420);
        
        const footerImgData = footerCanvas.toDataURL('image/png');
        doc.addImage(footerImgData, 'PNG', 14, currentY, 182, footerHeight);
        
        // White text content on green footer card
        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Thank you for ordering with QuickBite!', 105, currentY + 10, { align: 'center' });
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text('We hope you enjoyed your Group Feast.', 105, currentY + 18, { align: 'center' });
        doc.text('Share more meals, split smarter, and eat happier.', 105, currentY + 24, { align: 'center' });
        
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text('FAST \u2022 FRESH \u2022 DELICIOUS', 105, currentY + 34, { align: 'center' });

        doc.save(equalSplit ? 'QuickBite_Equal_Split_Receipt.pdf' : 'QuickBite_Custom_Split_Receipt.pdf');
        toast.success('Invoice downloaded!');
      } catch (error) {
        console.error(error);
        toast.error('Unable to generate invoice PDF.');
      }
    };

    img.onload = () => generatePDF(img);
    img.onerror = () => generatePDF(null);
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
