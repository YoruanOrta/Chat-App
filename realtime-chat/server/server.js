const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const express = require('express');
require('dotenv').config();

const { 
  registerUser,
  verifyEmail, 
  loginUser,
  updateUserAvatar,
  getUserByEmail,
  getUsersWithNotifications,
  loadMessages,
  saveMessages,
  saveUploadedFile,
  avatarsDir,
  filesDir
} = require('./database');
const { 
  sendVerificationEmail,
  sendVoiceChannelNotification
} = require('./emailNotifier');

// Create Express app
const app = express();

// Middleware para JSON
app.use(express.json());

// Servir archivos estáticos en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// Email verification endpoint
app.get('/verify', (req, res) => {
  const token = req.query.token;
  
  if (!token) {
    res.status(400).send('<h1>Invalid verification link</h1>');
    return;
  }
  
  const result = verifyEmail(token);
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  
  if (result.success) {
    res.send(`
      <html>
        <head>
          <style>
            body { font-family: Arial; text-align: center; padding: 50px; background: linear-gradient(135deg, #1a0033 0%, #2d1b4e 50%, #4a2c6b 100%); }
            .box { background: white; padding: 40px; border-radius: 10px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
            h1 { color: #8a2be2; }
            a { background: #8a2be2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="box">
            <h1>Email Verified!</h1>
            <p>Your email has been successfully verified.</p>
            <p>You can now login to the chat app.</p>
            <a href="${clientUrl}">Go to Chat App</a>
          </div>
        </body>
      </html>
    `);
  } else {
    res.status(400).send(`
      <html>
        <head>
          <style>
            body { font-family: Arial; text-align: center; padding: 50px; background: linear-gradient(135deg, #1a0033 0%, #2d1b4e 50%, #4a2c6b 100%); }
            .box { background: white; padding: 40px; border-radius: 10px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
            h1 { color: #dc3545; }
          </style>
        </head>
        <body>
          <div class="box">
            <h1>Verification Failed</h1>
            <p>${result.message}</p>
          </div>
        </body>
      </html>
    `);
  }
});

// Serve uploaded files (avatars and chat files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Catch all handler para React en producción
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Create HTTP server
const server = http.createServer(app);

const wss = new WebSocket.Server({ server });
const onlineUsers = new Map();
const voiceRooms = new Map();
const admins = new Set();
const MAX_MESSAGES = 200;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let messages = loadMessages();

const PORT = process.env.PORT || 8989;
console.log(`Server running on port ${PORT}`);
console.log('Loaded', messages.length, 'messages');

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', async (data) => {
    try {
      // Try to parse as JSON first (for text messages)
      let msg;
      let isFileUpload = false;
      
      try {
        msg = JSON.parse(data.toString());
      } catch (e) {
        // If not JSON, it might be binary file data
        isFileUpload = true;
      }
      
      // Handle file upload (binary data)
      if (isFileUpload) {
        // File format: first 4 bytes = metadata length, then metadata JSON, then file data
        const metadataLength = data.readUInt32BE(0);
        const metadataBuffer = data.slice(4, 4 + metadataLength);
        const fileBuffer = data.slice(4 + metadataLength);
        
        const metadata = JSON.parse(metadataBuffer.toString());
        
        if (metadata.type === 'avatar_upload') {
          // Save avatar
          const timestamp = Date.now();
          const ext = path.extname(metadata.filename);
          const avatarFilename = `${metadata.userId}-${timestamp}${ext}`;
          const avatarPath = path.join(avatarsDir, avatarFilename);
          
          fs.writeFileSync(avatarPath, fileBuffer);
          
          const result = updateUserAvatar(metadata.email, avatarFilename);
          
          // Update avatar in onlineUsers
          if (result.success) {
            const userEntry = Array.from(onlineUsers.entries()).find(([_, user]) => user.email === metadata.email);
            if (userEntry) {
              userEntry[1].avatar = avatarFilename;
              broadcastOnlineUsers();
            }
          }
          
          ws.send(JSON.stringify({ 
            type: 'avatar_upload_response', 
            payload: result 
          }));
        } else if (metadata.type === 'file_message') {
          // Save chat file
          const fileInfo = saveUploadedFile(fileBuffer, metadata.filename);
          
          const user = onlineUsers.get(ws);
          if (!user) {
            ws.send(JSON.stringify({ type: 'error', payload: { message: 'Not authenticated' } }));
            return;
          }
          
          const newMsg = {
            message: metadata.message || '',
            author: user.username,
            authorAvatar: user.avatar,
            timestamp: Date.now(),
            file: {
              filename: fileInfo.filename,
              originalName: fileInfo.originalName,
              path: fileInfo.path,
              size: fileInfo.size,
              type: metadata.fileType
            }
          };
          
          messages.push(newMsg);
          
          if (messages.length > MAX_MESSAGES) {
            messages = messages.slice(-MAX_MESSAGES);
          }
          
          saveMessages(messages);
          
          // Broadcast to all clients
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'message', payload: newMsg }));
            }
          });
        }
        return;
      }
      
      // User registration
      if (msg.type === 'register') {
        const result = await registerUser(msg.payload.username, msg.payload.email, msg.payload.password);
        
        if (result.success) {
          await sendVerificationEmail(msg.payload.email, msg.payload.username, result.verificationToken);
        }
        
        ws.send(JSON.stringify({ 
          type: 'register_response', 
          payload: result 
        }));
      }
      
      // User login
      if (msg.type === 'login') {
        const result = await loginUser(msg.payload.email, msg.payload.password);
        
        if (result.success) {
          const token = jwt.sign(
            { email: msg.payload.email, userId: result.user.id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
          );
          
          onlineUsers.set(ws, {
            userId: result.user.id,
            username: result.user.username,
            email: msg.payload.email,
            avatar: result.user.avatar
          });
          
          broadcastOnlineUsers();
          
          ws.send(JSON.stringify({ 
            type: 'login_response', 
            payload: { 
              success: true, 
              token,
              user: result.user
            }
          }));
          
          messages.forEach(msg => {
            ws.send(JSON.stringify({ type: 'message', payload: msg }));
          });
        } else {
          ws.send(JSON.stringify({ 
            type: 'login_response', 
            payload: result 
          }));
        }
      }
      
      // Token-based login (auto-login)
      if (msg.type === 'token_login') {
        try {
          const decoded = jwt.verify(msg.payload.token, process.env.JWT_SECRET || 'your-secret-key');
          const user = getUserByEmail(msg.payload.email);
          
          if (user && user.isVerified) {
            onlineUsers.set(ws, {
              userId: user.id,
              username: user.username,
              email: user.email,
              avatar: user.avatar
            });
            
            broadcastOnlineUsers();
            
            ws.send(JSON.stringify({ 
              type: 'token_login_response', 
              payload: { 
                success: true,
                user: {
                  id: user.id,
                  username: user.username,
                  email: user.email,
                  avatar: user.avatar
                }
              }
            }));
            
            messages.forEach(msg => {
              ws.send(JSON.stringify({ type: 'message', payload: msg }));
            });
          } else {
            ws.send(JSON.stringify({ 
              type: 'token_login_response', 
              payload: { success: false, message: 'Invalid token' }
            }));
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          ws.send(JSON.stringify({ 
            type: 'token_login_response', 
            payload: { success: false, message: 'Token expired or invalid' }
          }));
        }
      }
      
      // Admin login
      if (msg.type === 'admin_login') {
        if (msg.payload.password === ADMIN_PASSWORD) {
          admins.add(ws);
          console.log('Admin login successful');
          ws.send(JSON.stringify({ type: 'admin_status', payload: { isAdmin: true } }));
        } else {
          ws.send(JSON.stringify({ type: 'admin_status', payload: { isAdmin: false } }));
        }
      }
      
      // New text message
      if (msg.type === 'message') {
        const user = onlineUsers.get(ws);
        if (!user) {
          ws.send(JSON.stringify({ type: 'error', payload: { message: 'Not authenticated' } }));
          return;
        }
        
        const newMsg = {
          message: msg.payload.message,
          author: user.username,
          authorAvatar: user.avatar,
          timestamp: Date.now()
        };
        
        messages.push(newMsg);
        
        if (messages.length > MAX_MESSAGES) {
          messages = messages.slice(-MAX_MESSAGES);
        }
        
        saveMessages(messages);
        
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'message', payload: newMsg }));
          }
        });
      }
      
      // Typing indicators
      if (msg.type === 'typing_start') {
        const user = onlineUsers.get(ws);
        if (user) {
          wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'typing_start',
                payload: { username: user.username }
              }));
            }
          });
        }
      }

      if (msg.type === 'typing_stop') {
        const user = onlineUsers.get(ws);
        if (user) {
          wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'typing_stop',
                payload: { username: user.username }
              }));
            }
          });
        }
      }
      
      // Voice channel join
      if (msg.type === 'join_voice') {
        const user = onlineUsers.get(ws);
        if (user) {
          voiceRooms.set(ws, { userId: user.userId, username: user.username });
          console.log('User joined voice:', user.username);
          broadcastVoiceUsers();
          
          // Send email notifications to offline users
          const usersWithNotifications = getUsersWithNotifications();
          const offlineUsers = usersWithNotifications.filter(u => {
            return !Array.from(onlineUsers.values()).find(ou => ou.email === u.email);
          });
          
          if (offlineUsers.length > 0) {
            sendVoiceChannelNotification(offlineUsers, user.username);
          }
        }
      }
      
      // Voice channel leave
      if (msg.type === 'leave_voice') {
        const user = onlineUsers.get(ws);
        if (user) {
          voiceRooms.delete(ws);
          console.log('User left voice:', user.username);
          broadcastVoiceUsers();
        }
      }
      
      // WebRTC signaling for voice
      if (msg.type === 'voice_signal') {
        const fromUser = onlineUsers.get(ws);
        
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN && voiceRooms.has(client)) {
            client.send(JSON.stringify({
              type: 'voice_signal',
              payload: {
                from: fromUser?.userId,
                fromUsername: fromUser?.username,
                signal: msg.payload.signal
              }
            }));
          }
        });
      }
      
      // Clear history
      if (msg.type === 'clear_history') {
        if (admins.has(ws)) {
          messages = [];
          saveMessages(messages);
          console.log('Message history cleared');
          
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'clear_messages' }));
            }
          });
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    const user = onlineUsers.get(ws);
    if (user) {
      console.log('User disconnected:', user.username);
      onlineUsers.delete(ws);
      admins.delete(ws);
      voiceRooms.delete(ws);
      broadcastOnlineUsers();
      broadcastVoiceUsers();
    }
  });
});

function broadcastOnlineUsers() {
  const userList = Array.from(onlineUsers.values()).map(u => ({
    username: u.username,
    avatar: u.avatar
  }));
  console.log('Online users:', userList);
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'users', payload: userList }));
    }
  });
}

function broadcastVoiceUsers() {
  const voiceUserList = Array.from(voiceRooms.values()).map(u => u.username);
  console.log('Voice users:', voiceUserList);
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'voice_users', payload: voiceUserList }));
    }
  });
}

server.listen(PORT, () => {
  console.log(`HTTP and WebSocket server listening on port ${PORT}`);
});