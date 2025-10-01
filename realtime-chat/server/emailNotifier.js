const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

// Only create transporter if email credentials are provided
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

async function sendNewMessageNotification(recipients, message, author) {
  if (!transporter) {
    console.log('Email notifications disabled (no credentials)');
    return;
  }
  
  for (const recipient of recipients) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: recipient.email,
        subject: `New message from ${author}`,
        html: `
          <h2>New message in Chat App</h2>
          <p><strong>${author}</strong> says:</p>
          <blockquote style="background: #f0f0f0; padding: 15px; border-left: 4px solid #667eea;">
            ${message}
          </blockquote>
          <p><a href="http://localhost:3000">Go to Chat</a></p>
        `
      });
      console.log('Notification sent to:', recipient.email);
    } catch (error) {
      console.error('Error sending notification to', recipient.email, error);
    }
  }
}

module.exports = { sendNewMessageNotification };