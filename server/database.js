const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const usersFile = path.join(__dirname, 'users.json');
const messagesFile = path.join(__dirname, 'messages.json');
const uploadsDir = path.join(__dirname, 'uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
const filesDir = path.join(uploadsDir, 'files');

// Create upload directories if they don't exist
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir);
if (!fs.existsSync(filesDir)) fs.mkdirSync(filesDir);

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
  
  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  const newUser = {
    id: Date.now().toString(),
    username,
    email,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
    notifications: true,
    isVerified: false,
    verificationToken,
    avatar: null // NEW: Avatar field
  };
  
  users.push(newUser);
  saveUsers(users);
  
  return { 
    success: true, 
    user: { 
      id: newUser.id, 
      username: newUser.username, 
      email: newUser.email,
      avatar: newUser.avatar
    },
    verificationToken
  };
}

// Verify email
function verifyEmail(token) {
  const users = loadUsers();
  const user = users.find(u => u.verificationToken === token);
  
  if (!user) {
    return { success: false, message: 'Invalid or expired verification token' };
  }
  
  if (user.isVerified) {
    return { success: false, message: 'Email already verified' };
  }
  
  // Mark user as verified
  user.isVerified = true;
  user.verificationToken = null;
  saveUsers(users);
  
  return { success: true, message: 'Email verified successfully!' };
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
  
  // Check if email is verified
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
      notifications: user.notifications,
      avatar: user.avatar // NEW: Include avatar
    }
  };
}

// NEW: Update user avatar
function updateUserAvatar(email, avatarFilename) {
  const users = loadUsers();
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return { success: false, message: 'User not found' };
  }
  
  // Delete old avatar if exists
  if (user.avatar) {
    const oldAvatarPath = path.join(avatarsDir, user.avatar);
    if (fs.existsSync(oldAvatarPath)) {
      fs.unlinkSync(oldAvatarPath);
    }
  }
  
  user.avatar = avatarFilename;
  saveUsers(users);
  
  return { 
    success: true, 
    avatar: avatarFilename,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar
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

// NEW: Save uploaded file
function saveUploadedFile(buffer, originalFilename) {
  const timestamp = Date.now();
  const ext = path.extname(originalFilename);
  const filename = `${timestamp}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  const filepath = path.join(filesDir, filename);
  
  fs.writeFileSync(filepath, buffer);
  
  return {
    filename,
    originalName: originalFilename,
    path: `/uploads/files/${filename}`,
    size: buffer.length
  };
}

module.exports = {
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
};