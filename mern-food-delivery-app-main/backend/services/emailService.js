import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';

// ── HTML escape helper — prevents XSS in email templates ─────────────────────
const escHtml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

// ── Email transporter ─────────────────────────────────────────────────────────
const createTransporter = () => {
  const email = process.env.EMAIL;
  const password = process.env.EMAIL_PASSWORD;

  if (!email || !password) {
    throw new Error('EMAIL and EMAIL_PASSWORD environment variables must be set.');
  }

  const emailService = process.env.EMAIL_SERVICE || 'gmail';
  const isOutlook = emailService === 'outlook' ||
    email.includes('outlook.com') ||
    email.includes('hotmail.com');

  return nodemailer.createTransport({
    service: isOutlook ? 'outlook' : 'gmail',
    auth: { user: email, pass: password },
  });
};

let transporter;
try {
  transporter = createTransporter();
} catch (err) {
  console.warn('⚠️  Email transporter not configured:', err.message);
}

const fetchImageBuffer = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    return null;
  }
};

const generateInvoicePdfBuffer = async ({ orderData, invoiceNumber, formattedDate, formattedTime, paymentMethod }) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));
  const pdfBufferPromise = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const pageWidth = 595.28;
  const usableWidth = pageWidth - 80;
  const leftX = 40;

  const items = Array.isArray(orderData.items) ? orderData.items : [];
  const customerName = `${orderData.address?.firstName || ''} ${orderData.address?.lastName || ''}`.trim() || 'Customer';
  const customerEmail = orderData.address?.email || 'No email provided';
  const customerAddress = `${orderData.address?.street || ''}, ${orderData.address?.city || ''}, ${orderData.address?.state || ''} ${orderData.address?.zipcode || ''}`.replace(/(^[ ,]+|[ ,]+$)/g, '') || 'Address not available';
  const orderStatus = orderData.status || 'Processing';
  const totalAmount = Number(orderData.amount || 0).toFixed(2);

  // Header with gradient-style background and logo
  doc.save();
  doc.roundedRect(leftX, 40, usableWidth, 120, 18).fill('#1f2937');
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(18).text('QuickBite', leftX + 20, 58, { continued: true });
  doc.fontSize(10).fillColor('#e2e8f0').text('  •  Premium Food Delivery', { continued: false, baseline: 'bottom' });
  doc.fontSize(14).fillColor('#f8fafc').text('INVOICE RECEIPT', leftX + 20, 90);
  doc.fontSize(9).fillColor('#cbd5e1').text('Order receipt generated from QuickBite', leftX + 20, 112);

  const logoUrl = 'https://i.ibb.co/XfKp5T6r/logo-png.jpg';
  const logoBuffer = await fetchImageBuffer(logoUrl);
  const logoX = leftX + usableWidth - 95;
  const logoY = 52;

  if (logoBuffer) {
    doc.image(logoBuffer, logoX, logoY, { fit: [70, 70], align: 'right' });
  } else {
    doc.roundedRect(logoX, logoY, 70, 70, 14).fill('#ffffff20');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(32).text('Q', logoX + 20, logoY + 12);
    doc.fillColor('#e2e8f0').fontSize(8).text('QuickBite', logoX + 10, logoY + 48, { width: 50, align: 'center' });
  }

  doc.restore();

  let y = 180;

  // Section cards row
  const cardHeight = 96;
  const cardGap = 16;
  const cardWidth = (usableWidth - cardGap) / 2;

  const cardColor = '#ffffff';
  const cardBorder = '#e2e8f0';
  const headingColor = '#111827';
  const textColor = '#4b5563';

  const drawCard = (x, y, width, height) => {
    doc.roundedRect(x, y, width, height, 14).fill(cardColor).strokeColor(cardBorder).lineWidth(0.5).stroke();
  };

  drawCard(leftX, y, cardWidth, cardHeight);
  drawCard(leftX + cardWidth + cardGap, y, cardWidth, cardHeight);

  doc.fillColor(headingColor).font('Helvetica-Bold').fontSize(11).text('Billing Details', leftX + 16, y + 16);
  doc.fillColor(textColor).font('Helvetica').fontSize(9).text(customerName, leftX + 16, y + 34);
  doc.text(customerEmail, leftX + 16, doc.y + 4);
  doc.text(customerAddress, leftX + 16, doc.y + 4, { width: cardWidth - 32 });

  doc.fillColor(headingColor).font('Helvetica-Bold').fontSize(11).text('Order Information', leftX + cardWidth + cardGap + 16, y + 16);
  doc.fillColor(textColor).font('Helvetica').fontSize(9).text(`Invoice: ${invoiceNumber}`, leftX + cardWidth + cardGap + 16, y + 34);
  doc.text(`Order ID: ${orderData._id}`, { continued: false });
  doc.text(`Date: ${formattedDate}`, leftX + cardWidth + cardGap + 16, doc.y + 4);
  doc.text(`Time: ${formattedTime}`, leftX + cardWidth + cardGap + 16, doc.y + 4);

  y += cardHeight + cardGap;

  drawCard(leftX, y, usableWidth, cardHeight);
  doc.fillColor(headingColor).font('Helvetica-Bold').fontSize(11).text('Payment Details', leftX + 16, y + 16);
  doc.fillColor(textColor).font('Helvetica').fontSize(9).text(`Payment Method: ${paymentMethod}`, leftX + 16, y + 34);
  doc.text(`Payment Status: ${orderData.payment ? 'Completed' : 'Pending'}`, leftX + 16, doc.y + 4);
  doc.text(`Delivery Status: ${orderStatus}`, leftX + 16, doc.y + 4);
  doc.text(`Delivery Address:`, leftX + 16, doc.y + 12);
  doc.text(customerAddress, leftX + 16, doc.y + 4, { width: usableWidth - 32 });

  y += cardHeight + 36;

  // Items table header
  const tableTop = y;
  const rowHeight = 24;
  const tableColumns = [leftX + 16, leftX + 16 + 240, leftX + 16 + 360, leftX + 16 + 450];

  doc.roundedRect(leftX, tableTop - 10, usableWidth, 34 + rowHeight * (items.length + 1), 14).fill('#ffffff').strokeColor('#e5e7eb').lineWidth(0.5).stroke();
  doc.fillColor(headingColor).font('Helvetica-Bold').fontSize(10).text('Item', tableColumns[0], tableTop, { width: 240 });
  doc.text('Qty', tableColumns[1], tableTop, { width: 80, align: 'right' });
  doc.text('Price', tableColumns[2], tableTop, { width: 80, align: 'right' });
  doc.text('Total', tableColumns[3], tableTop, { width: 80, align: 'right' });

  doc.moveTo(leftX + 16, tableTop + 16).lineTo(leftX + usableWidth - 16, tableTop + 16).strokeColor('#e5e7eb').lineWidth(0.5).stroke();

  doc.font('Helvetica').fontSize(9).fillColor(textColor);
  let currentY = tableTop + 24;
  items.forEach((item, index) => {
    const itemName = item.name || item.title || 'Item';
    const quantity = item.quantity || 1;
    const price = Number(item.price || 0);
    const total = price * quantity;

    doc.text(itemName, tableColumns[0], currentY, { width: 240 });
    doc.text(quantity.toString(), tableColumns[1], currentY, { width: 80, align: 'right' });
    doc.text(`₹${price.toFixed(2)}`, tableColumns[2], currentY, { width: 80, align: 'right' });
    doc.text(`₹${total.toFixed(2)}`, tableColumns[3], currentY, { width: 80, align: 'right' });

    currentY += rowHeight;
    if (index < items.length - 1) {
      doc.strokeColor('#f3f4f6').lineWidth(0.5).moveTo(leftX + 16, currentY - 8).lineTo(leftX + usableWidth - 16, currentY - 8).stroke();
    }
  });

  // Total box
  const totalBoxWidth = 240;
  const totalBoxHeight = 64;
  const totalBoxX = leftX + usableWidth - totalBoxWidth;
  const totalBoxY = currentY + 8;
  doc.roundedRect(totalBoxX, totalBoxY, totalBoxWidth, totalBoxHeight, 12).fill('#1f2937');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(12).text('Grand Total', totalBoxX + 16, totalBoxY + 16);
  doc.font('Helvetica-Bold').fontSize(18).text(`₹${totalAmount}`, totalBoxX + 16, totalBoxY + 34);

  // Footer
  const footerY = totalBoxY + totalBoxHeight + 30;
  doc.moveTo(leftX, footerY).lineTo(leftX + usableWidth, footerY).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(11).text('Thank you for ordering from QuickBite 🍔', leftX, footerY + 16);
  doc.font('Helvetica').fontSize(9).fillColor('#6b7280').text('For support, write to quickbite.support@gmail.com', leftX, footerY + 34);

  doc.end();

  return pdfBufferPromise;
};

// Function to send order confirmation email
export const sendOrderConfirmationEmail = async (orderData) => {
  try {
    console.log('🔄 Attempting to send order confirmation email...');
    console.log('📧 To:', orderData.address.email);
    console.log('🆔 Order ID:', orderData._id);

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const orderDate = new Date(orderData.date || Date.now());
    const formattedDate = orderDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const formattedTime = orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const paymentMethod = orderData.paymentMethod || 'Online Payment';
    const orderStatus = orderData.status || 'Processing';
    const trackUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/track/${orderData._id}`;

    // Create HTML email template
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - QuickBite</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            background-color: #f8f8f8;
            padding: 20px 0;
          }
          
          .wrapper {
            max-width: 600px;
            margin: 0 auto;
            background-color: #f8f8f8;
            padding: 20px;
          }
          
          .container {
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
          }
          
          .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
            color: white;
            padding: 35px 25px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: -30px;
            right: -60px;
            width: 150px;
            height: 150px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 50%;
          }
          
          .header::after {
            content: '';
            position: absolute;
            bottom: -40px;
            left: -40px;
            width: 120px;
            height: 120px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 50%;
          }
          
          .logo-section {
            margin-bottom: 16px;
            position: relative;
            z-index: 1;
          }
          
          .logo-img {
            width: 60px;
            height: 60px;
            border-radius: 12px;
            object-fit: contain;
            background-color: rgba(255, 255, 255, 0.1);
            padding: 6px;
            display: inline-block;
          }
          
          .header h1 {
            margin: 12px 0 6px;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.3px;
          }
          
          .header p {
            margin: 0;
            opacity: 0.9;
            font-size: 14px;
            line-height: 1.4;
            letter-spacing: 0.2px;
          }
          
          .content {
            padding: 24px;
          }
          
          .section {
            margin-bottom: 20px;
          }
          
          .section-title {
            color: #1e40af;
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .card-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          
          .card {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 14px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          }
          
          .card:hover {
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
          }
          
          .card-label {
            display: block;
            font-size: 11px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            margin-bottom: 5px;
          }
          
          .card-value {
            color: #1f2937;
            font-size: 13px;
            font-weight: 600;
            line-height: 1.4;
            word-break: break-word;
          }
          
          .items-section {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 16px;
            margin-bottom: 18px;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          
          .items-table thead {
            background-color: #f3f4f6;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .items-table th {
            padding: 10px;
            text-align: left;
            font-weight: 700;
            font-size: 12px;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          
          .items-table td {
            padding: 10px;
            border-bottom: 1px solid #f0f0f0;
            font-size: 13px;
            color: #1f2937;
          }
          
          .items-table tbody tr:last-child td {
            border-bottom: none;
          }
          
          .total-row {
            background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
            color: white;
            font-weight: 700;
          }
          
          .total-row td {
            padding: 12px 10px;
            border-bottom: none;
          }
          
          .total-amount {
            font-size: 15px;
            color: white;
            font-weight: 700;
          }
          
          .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 7px 14px;
            background-color: #dcfce7;
            border: 1px solid #86efac;
            border-radius: 18px;
            color: #166534;
            font-size: 12px;
            font-weight: 600;
            margin: 10px 0 16px;
          }
          
          .delivery-info {
            background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%);
            border: 1px solid #bae6fd;
            border-radius: 10px;
            padding: 14px;
            margin-bottom: 16px;
          }
          
          .delivery-info h3 {
            color: #0c4a6e;
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 5px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          .delivery-info p {
            color: #0c4a6e;
            font-size: 12px;
            line-height: 1.4;
            margin: 3px 0;
          }
          
          .track-button {
            display: block;
            width: 100%;
            padding: 12px 20px;
            background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
            color: white;
            text-align: center;
            text-decoration: none;
            font-weight: 700;
            font-size: 14px;
            border-radius: 24px;
            box-shadow: 0 6px 20px rgba(255, 107, 53, 0.3);
            transition: all 0.3s ease;
            margin-bottom: 14px;
            cursor: pointer;
            border: none;
          }
          
          .track-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 8px 24px rgba(255, 107, 53, 0.35);
          }
          
          .delivery-success {
            background-color: #dcfce7;
            border: 1px solid #86efac;
            border-radius: 10px;
            padding: 14px;
            color: #166534;
            font-size: 13px;
            font-weight: 600;
            text-align: center;
            margin-bottom: 14px;
            line-height: 1.4;
          }
          
          .footer {
            background-color: #f3f4f6;
            border-top: 1px solid #e5e7eb;
            padding: 20px 24px;
            text-align: center;
          }
          
          .footer-title {
            font-size: 16px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 6px;
          }
          
          .footer-text {
            color: #6b7280;
            font-size: 12px;
            margin: 6px 0;
            line-height: 1.5;
          }
          
          .footer-email {
            color: #ff6b35;
            font-weight: 700;
            text-decoration: none;
          }
          
          .footer-disclaimer {
            color: #9ca3af;
            font-size: 11px;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #e5e7eb;
          }
          
          @media only screen and (max-width: 600px) {
            .wrapper {
              padding: 10px;
            }
            
            .content {
              padding: 18px;
            }
            
            .header {
              padding: 25px 18px;
            }
            
            .header h1 {
              font-size: 24px;
            }
            
            .header p {
              font-size: 13px;
            }
            
            .logo-img {
              width: 50px;
              height: 50px;
            }
            
            .card-grid {
              grid-template-columns: 1fr;
            }
            
            .items-table th,
            .items-table td {
              padding: 8px 6px;
              font-size: 12px;
            }
            
            .track-button {
              padding: 11px 18px;
              font-size: 13px;
            }
            
            .section-title {
              font-size: 15px;
            }
            
            .footer {
              padding: 18px;
            }
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <!-- Header Section -->
            <div class="header">
              <div class="logo-section">
                <img class="logo-img" src="https://i.ibb.co/XfKp5T6r/logo-png.jpg" alt="QuickBite Logo" />
              </div>
              <h1>Order Confirmed!</h1>
              <p>Your delicious meal is being prepared and will arrive soon.</p>
            </div>

            <!-- Main Content -->
            <div class="content">
              <!-- Order Summary Section -->
              <div class="section">
                <div class="section-title">🧾 Order Summary</div>
                <div class="card-grid">
                  <div class="card">
                    <span class="card-label">Order ID</span>
                    <div class="card-value">${orderData._id}</div>
                  </div>
                  <div class="card">
                    <span class="card-label">Invoice Number</span>
                    <div class="card-value">${invoiceNumber}</div>
                  </div>
                  <div class="card">
                    <span class="card-label">Order Date</span>
                    <div class="card-value">${formattedDate}</div>
                  </div>
                  <div class="card">
                    <span class="card-label">Order Time</span>
                    <div class="card-value">${formattedTime}</div>
                  </div>
                </div>
              </div>

              <!-- Customer Details Section -->
              <div class="section">
                <div class="section-title">👤 Customer Details</div>
                <div class="card-grid">
                  <div class="card">
                    <span class="card-label">Customer Name</span>
                    <div class="card-value">${orderData.address.firstName} ${orderData.address.lastName}</div>
                  </div>
                  <div class="card">
                    <span class="card-label">Customer Email</span>
                    <div class="card-value">${orderData.address.email}</div>
                  </div>
                </div>
              </div>

              <!-- Delivery Address Section -->
              <div class="section">
                <div class="section-title">📍 Delivery Address</div>
                <div class="card">
                  <span class="card-label">Full Address</span>
                  <div class="card-value">${orderData.address.street}, ${orderData.address.city}, ${orderData.address.state} - ${orderData.address.zipcode}</div>
                </div>
              </div>

              <!-- Payment Status Section -->
              <div class="section">
                <div class="section-title">💳 Payment Status</div>
                <div class="card">
                  <span class="card-label">Payment Method</span>
                  <div class="card-value">${paymentMethod}</div>
                </div>
                <div class="status-badge">
                  💰 ${orderData.payment ? 'Payment Completed' : 'Payment Pending'}
                </div>
              </div>

              <!-- Ordered Items Section -->
              <div class="items-section">
                <div class="section-title">🍔 Ordered Items</div>
                <table class="items-table">
                  <thead>
                    <tr>
                      <th style="width: 50%;">Item</th>
                      <th style="width: 15%; text-align: center;">Qty</th>
                      <th style="width: 18%; text-align: right;">Price</th>
                      <th style="width: 17%; text-align: right;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${orderData.items.map(item => `
                      <tr>
                        <td>${escHtml(item.name)}</td>
                        <td style="text-align: center;">${escHtml(item.quantity)}</td>
                        <td style="text-align: right;">₹${Number(item.price || 0).toFixed(2)}</td>
                        <td style="text-align: right;">₹${(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}</td>
                      </tr>
                    `).join('')}
                    <tr class="total-row">
                      <td colspan="3" style="text-align: right; padding: 14px 12px;">Total Amount:</td>
                      <td style="text-align: right; padding: 14px 12px;"><span class="total-amount">₹${orderData.amount}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Delivery Information -->
              <div class="delivery-info">
                <h3>🚚 Estimated Delivery</h3>
                <p>25-35 minutes depending on traffic and location</p>
                <p style="margin-top: 8px; font-size: 12px; color: #7f8c8d;">Track your order in real-time on our app!</p>
              </div>

              ${orderStatus.toLowerCase().includes('deliv') ? `
                <div class="delivery-success">
                  🎉 Your order has been delivered successfully! Enjoy your meal 🍽️
                </div>
              ` : ''}

              <!-- Track Order Button -->
              <a href="${trackUrl}" class="track-button">📱 Track Your Order</a>
              <p style="margin-top: 16px; font-size: 13px; color: #6b7280; text-align: center;">Your invoice receipt is attached to this email as a PDF.</p>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="footer-title">Thank you for choosing QuickBite!</div>
              <div class="footer-text">
                If you need any help, please reach out to us at<br>
                <a href="mailto:quickbite.support@gmail.com" class="footer-email">quickbite.support@gmail.com</a>
              </div>
              <div class="footer-disclaimer">
                This is an automated email. Please do not reply directly to this email.
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Generate invoice PDF attachment
    const invoicePdfBuffer = await generateInvoicePdfBuffer({
      orderData,
      invoiceNumber,
      formattedDate,
      formattedTime,
      paymentMethod,
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL,
      to: orderData.address.email, // Customer's email from order data
      subject: `🍕 Order Confirmed - QuickBite #${orderData._id}`,
      html: emailHtml,
      attachments: [
        {
          filename: `QuickBite-Invoice-${invoiceNumber}.pdf`,
          content: invoicePdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Order confirmation email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📧 To:', orderData.address.email);
    console.log('🆔 Order ID:', orderData._id);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Error sending order confirmation email:');
    console.error('📧 To:', orderData.address.email);
    console.error('🆔 Order ID:', orderData._id);
    console.error('🔍 Error details:', error.message);

    // Provide helpful troubleshooting info
    if (error.code === 'EAUTH') {
      console.error('🔐 AUTHENTICATION FAILED: Please check your Gmail App Password setup!');
      console.error('📋 Gmail App Password Setup: https://support.google.com/accounts/answer/185833');
    }

    return { success: false, error: error.message };
  }
};