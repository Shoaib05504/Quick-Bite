# QuickBite Email Setup Guide

## 🚨 ISSUE: No emails are being received

The email system is implemented but Gmail authentication is failing because it requires an **App Password** instead of your regular password.

## 🔧 SOLUTION: Choose one of the options below

### Option 1: Gmail with App Password (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account:
   - Go to: https://myaccount.google.com/security
   - Sign in to your Gmail account
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Go to: https://support.google.com/accounts/answer/185833
   - Sign in to your Google Account
   - Select "Mail" as the app
   - Select "Other" as the device
   - Enter "QuickBite" as the custom name
   - Click "Generate"
   - Copy the 16-character password

3. **Update your .env file**:
   ```env
   EMAIL=your_email@gmail.com
   EMAIL_PASSWORD=your_16_character_app_password
   ```

4. **Test the email**:
   ```bash
   cd backend
   node testEmail.js
   ```

### Option 2: Use Outlook/Hotmail (Easier)

1. **Create an Outlook account** (if you don't have one):
   - Go to: https://outlook.com

2. **Update your .env file**:
   ```env
   EMAIL=your_email@outlook.com
   EMAIL_PASSWORD=your_regular_password
   ```

3. **Test the email**:
   ```bash
   cd backend
   node testEmail.js
   ```

## 🧪 Testing Your Setup

Run the test command:
```bash
cd backend
node testEmail.js
```

**Expected Output (Success):**
```
✅ SUCCESS: Email sent successfully!
📧 Message ID: <abc123@example.com>
📬 Check your inbox (and spam folder) for the test email.
```

**If you see authentication errors**, follow the setup steps above.

## 📧 Email Features

Once configured, the system will automatically send:
- ✅ Order confirmation emails after payment
- ✅ Professional HTML template with QuickBite branding
- ✅ Complete order details (items, prices, delivery info)
- ✅ Invoice number and order tracking
- ✅ Modern, responsive design

## 🔍 Troubleshooting

1. **Check spam/junk folder** - Emails might go there initially
2. **Verify .env file** - Make sure EMAIL_PASSWORD is correct
3. **Test with the script** - Use `node testEmail.js` to diagnose issues
4. **Check server logs** - Look for email-related console messages

## 📞 Need Help?

If you're still having issues:
1. Run the test script and share the error message
2. Check that your email credentials are correct
3. Try the Outlook option if Gmail setup is difficult