const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

async function sendVerificationEmail(email, username, token) {
  if (!transporter) {
    console.log('Email disabled - Verification token:', token);
    return { success: false, message: 'Email service not configured' };
  }
  
  const verificationLink = `http://localhost:8989/verify?token=${token}`;
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '✅ Verify Your Chat App Email',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #FF6B35;">Welcome to Chat App! 👋</h1>
          <p>Hi <strong>${username}</strong>,</p>
          <p>Thanks for registering! Please verify your email address to activate your account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Verify Email
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">Or copy this link: ${verificationLink}</p>
        </div>
      `
    });
    console.log('Verification email sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, message: 'Failed to send email' };
  }
}

async function sendNewMessageNotification(recipients, message, author) {
  if (!transporter) {
    console.log('Email notifications disabled');
    return;
  }
  
  for (const recipient of recipients) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: recipient.email,
        subject: `💬 New message from ${author}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FF6B35;">New message in Chat App</h2>
            <p><strong>${author}</strong> says:</p>
            <blockquote style="background: #f0f0f0; padding: 15px; border-left: 4px solid #FF6B35; margin: 20px 0;">
              ${message}
            </blockquote>
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000" 
                 style="background: #FF6B35; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Go to Chat
              </a>
            </div>
          </div>
        `
      });
      console.log('Notification sent to:', recipient.email);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}

module.exports = { 
  sendVerificationEmail,
  sendNewMessageNotification 
};