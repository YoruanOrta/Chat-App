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
          <h1 style="color: #8a2be2;">Welcome to Chat App! 👋</h1>
          <p>Hi <strong>${username}</strong>,</p>
          <p>Thanks for registering! Please verify your email address to activate your account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background: #8a2be2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
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

async function sendVoiceChannelNotification(recipients, username) {
  if (!transporter) {
    console.log('Email notifications disabled');
    return;
  }
  
  for (const recipient of recipients) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: recipient.email,
        subject: `🎙️ ${username} joined voice chat`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #8a2be2;">Voice Channel Activity</h2>
            <p><strong>${username}</strong> has joined the voice channel!</p>
            <div style="background: linear-gradient(135deg, #8a2be2 0%, #6a3c9b 100%); padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
              <p style="color: white; font-size: 18px; margin: 0;">🎙️ Join the conversation!</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000" 
                 style="background: #8a2be2; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Join Voice Chat
              </a>
            </div>
            <p style="color: #666; font-size: 12px; text-align: center; margin-top: 20px;">
              You received this notification because you have notifications enabled in Chat App.
            </p>
          </div>
        `
      });
      console.log('Voice notification sent to:', recipient.email);
    } catch (error) {
      console.error('Error sending voice notification:', error);
    }
  }
}

module.exports = { 
  sendVerificationEmail,
  sendVoiceChannelNotification
};