const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { 
  registerUser, 
  loginUser, 
  getUsersWithNotifications,
  loadMessages,
  saveMessages
} = require('./database');
const { sendNewMessageNotification } = require('./emailNotifier');

const wss = new WebSocket.Server({ port: 8989 });
const onlineUsers = new Map(); // ws -> { userId, username, email }
const admins = new Set();
const MAX_MESSAGES = 200;
const ADMIN_PASSWORD = 'admin123'; // CHANGE THIS!

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
        ws.send(JSON.stringify({ type: 'register_response', payload: result }));
      }
      
      // User login
      if (msg.type === 'login') {
        const result = await loginUser(msg.payload.email, msg.payload.password);
        if (result.success) {
          // Generate JWT token
          const token = jwt.sign(
            { userId: result.user.id, username: result.user.username, email: result.user.email },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
          );
          result.token = token;
          
          // Add to online users
          onlineUsers.set(ws, {
            userId: result.user.id,
            username: result.user.username,
            email: result.user.email
          });
          
          console.log('User logged in:', result.user.username);
          
          // Send message history
          messages.forEach(m => {
            ws.send(JSON.stringify({ type: 'message', payload: m }));
          });
          
          // Broadcast updated online users list
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
        
        // Broadcast to all online users
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'message', payload: newMsg }));
          }
        });
        
        // Send email notifications to offline users
        const usersWithNotifications = getUsersWithNotifications();
        const offlineUsers = usersWithNotifications.filter(u => {
          return !Array.from(onlineUsers.values()).find(ou => ou.email === u.email);
        });
        
        if (offlineUsers.length > 0) {
          sendNewMessageNotification(offlineUsers, newMsg.message, newMsg.author);
        }
      }
      
      // Clear history (admin only)
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
      broadcastOnlineUsers();
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