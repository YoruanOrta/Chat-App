import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin, onSwitchToRegister, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!email.trim() || !password) {
      return;
    }
    
    onLogin(email.trim(), password);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Welcome Back</h1>
        <p>Login to continue chatting</p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoFocus
          />
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <button type="submit">Login</button>
        </form>
        <p className="switch-form">
          Don't have an account? <span onClick={onSwitchToRegister}>Register here</span>
        </p>
      </div>
    </div>
  );
};

export default Login;