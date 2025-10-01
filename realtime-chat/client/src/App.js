import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SidebarContainer, MessagesListContainer, AddMessageContainer } from './containers';
import Login from './components/Login';
import Register from './components/Register';
import AdminPanel from './components/AdminPanel';
import { sendRegister, sendLogin, sendAdminLogin, sendClearHistory } from './sagas';
import './App.css';

function App() {
  const dispatch = useDispatch();
  const isAdmin = useSelector(state => state.isAdmin);
  const authResponse = useSelector(state => state.authResponse);
  
  const [view, setView] = useState('login'); // 'login' or 'register'
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authError, setAuthError] = useState('');

  // Listen for auth responses
  useEffect(() => {
    if (authResponse) {
      if (authResponse.type === 'register') {
        if (authResponse.success) {
          alert('Registration successful! Please login.');
          setView('login');
        } else {
          setAuthError(authResponse.message);
        }
      }
      
      if (authResponse.type === 'login') {
        if (authResponse.success) {
          setUser(authResponse.user);
          setIsLoggedIn(true);
          localStorage.setItem('chatToken', authResponse.token);
        } else {
          setAuthError(authResponse.message);
        }
      }
      
      // Clear response after handling
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
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('chatToken');
    window.location.reload();
  };

  const handleAdminLogin = (password) => {
    sendAdminLogin(password);
  };

  const handleClearHistory = () => {
    sendClearHistory();
  };

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
      />
    );
  }

  // Show chat interface
  return (
    <div className="app-container">
      <div className="app-header">
        <h2>💬 Chat App</h2>
        <div className="user-info">
          <span className="username-display">
            👤 <strong>{user.username}</strong>
          </span>
          <AdminPanel 
            isAdmin={isAdmin}
            onAdminLogin={handleAdminLogin}
            onClearHistory={handleClearHistory}
          />
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>
      <div className="app-content">
        <SidebarContainer />
        <div className="chat-area">
          <MessagesListContainer />
          <AddMessageContainer username={user.username} />
        </div>
      </div>
    </div>
  );
}

export default App;