const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const usersFile = path.join(__dirname, 'users.json');
const messagesFile = path.join(__dirname, 'messages.json');

// Load users
function loadUsers() {
  try {
    if (fs.existsSync(usersFile)) {
      return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
  return [];
}

// Save users
function saveUsers(users) {
  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
  }
}

// Register new user
async function registerUser(username, email, password) {
  const users = loadUsers();
  
  // Check if user exists
  if (users.find(u => u.email === email)) {
    return { success: false, message: 'Email already registered' };
  }
  
  if (users.find(u => u.username === username)) {
    return { success: false, message: 'Username already taken' };
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const newUser = {
    id: Date.now().toString(),
    username,
    email,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
    notifications: true
  };
  
  users.push(newUser);
  saveUsers(users);
  
  return { success: true, user: { id: newUser.id, username: newUser.username, email: newUser.email } };
}

// Login user
async function loginUser(email, password) {
  const users = loadUsers();
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return { success: false, message: 'Invalid email or password' };
  }
  
  const validPassword = await bcrypt.compare(password, user.password);
  
  if (!validPassword) {
    return { success: false, message: 'Invalid email or password' };
  }
  
  // NEW: Check if email is verified
  if (!user.isVerified) {
    return { 
      success: false, 
      message: 'Please verify your email before logging in. Check your inbox for the verification link.' 
    };
  }
  
  return { 
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      notifications: user.notifications
    }
  };
}

// Get user by email
function getUserByEmail(email) {
  const users = loadUsers();
  return users.find(u => u.email === email);
}

// Get all users with notifications enabled
function getUsersWithNotifications() {
  const users = loadUsers();
  return users.filter(u => u.notifications);
}

// Load messages
function loadMessages() {
  try {
    if (fs.existsSync(messagesFile)) {
      return JSON.parse(fs.readFileSync(messagesFile, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading messages:', error);
  }
  return [];
}

// Save messages
function saveMessages(messages) {
  try {
    fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
  } catch (error) {
    console.error('Error saving messages:', error);
  }
}

module.exports = {
  registerUser,
  loginUser,
  getUserByEmail,
  getUsersWithNotifications,
  loadMessages,
  saveMessages
};