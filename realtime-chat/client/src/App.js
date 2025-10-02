import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SidebarContainer, MessagesListContainer, AddMessageContainer } from './containers';
import Login from './components/Login';
import Register from './components/Register';
import AdminPanel from './components/AdminPanel';
import VoiceChannel from './components/VoiceChannel';
import ProfileSettings from './components/ProfileSettings';
import { sendRegister, sendLogin, sendTokenLogin, sendAdminLogin, sendClearHistory } from './sagas';
import logo from './logo.jpg';
import './App.css';

function App() {
  const dispatch = useDispatch();
  const isAdmin = useSelector(state => state.isAdmin);
  const authResponse = useSelector(state => state.authResponse);
  
  const [view, setView] = useState('login');
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Check for saved token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('chatToken');
    const savedUser = localStorage.getItem('chatUser');
    
    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        // Auto-login with saved token
        setUser(userData);
        setIsLoggedIn(true);
        // Connect to websocket with saved credentials
        sendTokenLogin(userData.email, savedToken);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('chatToken');
        localStorage.removeItem('chatUser');
      }
    }
    setIsCheckingAuth(false);
  }, []);

  useEffect(() => {
    if (authResponse) {
      if (authResponse.type === 'register') {
        if (authResponse.success) {
          alert('Registration successful! Please check your email to verify your account before logging in.');
          setView('login');
          setAuthError('');
        } else {
          setAuthError(authResponse.message);
        }
      }
      
      if (authResponse.type === 'login') {
        if (authResponse.success) {
          // Save token and user data to localStorage
          localStorage.setItem('chatToken', authResponse.token);
          localStorage.setItem('chatUser', JSON.stringify(authResponse.user));
          
          setUser(authResponse.user);
          setIsLoggedIn(true);
          setAuthError('');
        } else {
          setAuthError(authResponse.message || 'Invalid email or password');
        }
      }
      
      dispatch({ type: 'CLEAR_AUTH_RESPONSE' });
    }
  }, [authResponse, dispatch]);

  const handleRegister = (username, email, password) => {
    setAuthError('');
    sendRegister(username, email, password);
  };

  const handleLogin = (email, password) => {
    setAuthError('');
    sendLogin(email, password);
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('chatToken');
    localStorage.removeItem('chatUser');
    
    setIsLoggedIn(false);
    setUser(null);
    setAuthError('');
    window.location.reload();
  };

  const handleAdminLogin = (password) => {
    sendAdminLogin(password);
  };

  const handleClearHistory = () => {
    sendClearHistory();
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
    // Update localStorage with new user data
    localStorage.setItem('chatUser', JSON.stringify(updatedUser));
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  // Show login/register screen
  if (!isLoggedIn) {
    if (view === 'register') {
      return (
        <Register 
          onRegister={handleRegister}
          onBackToLogin={() => {
            setView('login');
            setAuthError('');
          }}
          error={authError}
        />
      );
    }
    
    return (
      <Login 
        onLogin={handleLogin}
        onSwitchToRegister={() => {
          setView('register');
          setAuthError('');
        }}
        error={authError}
      />
    );
  }

  // Show chat interface
  return (
    <div className="app-container">
      <div className="app-header">
        <div className="app-logo-section">
          <img src={logo} alt="Logo" className="app-logo" />
          <h2>Chat App</h2>
        </div>
        <div className="user-info">
          <div className="user-avatar-section" onClick={() => setShowSettings(true)}>
            {user.avatar ? (
              <img 
                src={`http://localhost:8989/uploads/avatars/${user.avatar}`} 
                alt="Avatar" 
                className="user-avatar-header"
                title="Click to edit profile"
              />
            ) : (
              <div className="user-avatar-placeholder" title="Click to add avatar">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="username-display">
              <strong>{user.username}</strong>
            </span>
          </div>
          <button onClick={() => setShowSettings(true)} className="settings-btn" title="Settings">
            ⚙️
          </button>
          <AdminPanel 
            isAdmin={isAdmin}
            onAdminLogin={handleAdminLogin}
            onClearHistory={handleClearHistory}
          />
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>
      <div className="app-content">
        <div className="sidebar-voice-container">
          <SidebarContainer />
          <VoiceChannel username={user.username} />
        </div>
        <div className="chat-area">
          <MessagesListContainer />
          <AddMessageContainer username={user.username} />
        </div>
      </div>
      
      {showSettings && (
        <ProfileSettings 
          user={user}
          onClose={() => setShowSettings(false)}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
}

export default App;