const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const http = require('http');
const url = require('url');
require('dotenv').config();

const { 
  registerUser,
  verifyEmail, 
  loginUser,
  getUsersWithNotifications,
  loadMessages,
  saveMessages
} = require('./database');
const { 
  sendVerificationEmail,
  sendNewMessageNotification 
} = require('./emailNotifier');

// Create HTTP server for verification endpoint
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  if (parsedUrl.pathname === '/verify') {
    const token = parsedUrl.query.token;
    
    if (!token) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end('<h1>Invalid verification link</h1>');
      return;
    }
    
    const result = verifyEmail(token);
    
    if (result.success) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <head>
            <style>
              body { font-family: Arial; text-align: center; padding: 50px; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); }
              .box { background: white; padding: 40px; border-radius: 10px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
              h1 { color: #28a745; }
              a { background: #FF6B35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="box">
              <h1>Email Verified!</h1>
              <p>Your email has been successfully verified.</p>
              <p>You can now login to the chat app.</p>
              <a href="http://localhost:3000">Go to Chat App</a>
            </div>
          </body>
        </html>
      `);
    } else {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <head>
            <style>
              body { font-family: Arial; text-align: center; padding: 50px; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); }
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
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const wss = new WebSocket.Server({ server });
const onlineUsers = new Map();
const voiceRooms = new Map();
const admins = new Set();
const MAX_MESSAGES = 200;
const ADMIN_PASSWORD = 'admin123';

let messages = loadMessages();

console.log('Server running on port 8989');
console.log('Loaded', messages.length, 'messages');

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      
      // User registration
      if (msg.type === 'register') {
        const result = await registerUser(msg.payload.username, msg.payload.email, msg.payload.password);
        
        if (result.success) {
          await sendVerificationEmail(msg.payload.email, msg.payload.username, result.verificationToken);
        }
        
        ws.send(JSON.stringify({ type: 'register_response', payload: result }));
      }
      
      // User login (simple - no 2FA)
      if (msg.type === 'login') {
        const result = await loginUser(msg.payload.email, msg.payload.password);
        
        if (result.success) {
          const token = jwt.sign(
            { userId: result.user.id, username: result.user.username, email: result.user.email },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
          );
          
          result.token = token;
          
          onlineUsers.set(ws, {
            userId: result.user.id,
            username: result.user.username,
            email: result.user.email
          });
          
          console.log('User logged in:', result.user.username);
          
          messages.forEach(m => {
            ws.send(JSON.stringify({ type: 'message', payload: m }));
          });
          
          broadcastOnlineUsers();
        }
        
        ws.send(JSON.stringify({ type: 'login_response', payload: result }));
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
      
      // New message
      if (msg.type === 'message') {
        const user = onlineUsers.get(ws);
        if (!user) {
          ws.send(JSON.stringify({ type: 'error', payload: { message: 'Not authenticated' } }));
          return;
        }
        
        const newMsg = {
          message: msg.payload.message,
          author: user.username,
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
        
        const usersWithNotifications = getUsersWithNotifications();
        const offlineUsers = usersWithNotifications.filter(u => {
          return !Array.from(onlineUsers.values()).find(ou => ou.email === u.email);
        });
        
        if (offlineUsers.length > 0) {
          sendNewMessageNotification(offlineUsers, newMsg.message, newMsg.author);
        }
      }
      
      // Voice channel join
      if (msg.type === 'join_voice') {
        const user = onlineUsers.get(ws);
        if (user) {
          voiceRooms.set(ws, { userId: user.userId, username: user.username });
          console.log('User joined voice:', user.username);
          broadcastVoiceUsers();
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
  const userList = Array.from(onlineUsers.values()).map(u => u.username);
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

server.listen(8989, () => {
  console.log('HTTP and WebSocket server listening on port 8989');
});