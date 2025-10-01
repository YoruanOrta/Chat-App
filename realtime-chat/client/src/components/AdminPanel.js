import React, { useState } from 'react';
import './AdminPanel.css';

const AdminPanel = ({ isAdmin, onAdminLogin, onClearHistory }) => {
  const [password, setPassword] = useState('');
  const [showPanel, setShowPanel] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    onAdminLogin(password);
    setPassword('');
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear ALL chat history? This cannot be undone!')) {
      onClearHistory();
    }
  };

  return (
    <div className="admin-panel">
      <button 
        className="admin-toggle"
        onClick={() => setShowPanel(!showPanel)}
      >
        {isAdmin ? '👑 Admin' : '🔒 Admin'}
      </button>

      {showPanel && !isAdmin && (
        <div className="admin-login">
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
            />
            <button type="submit">Login</button>
          </form>
        </div>
      )}

      {showPanel && isAdmin && (
        <div className="admin-controls">
          <p className="admin-badge">✅ Admin Access</p>
          <button onClick={handleClear} className="clear-btn">
            🗑️ Clear All Messages
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;