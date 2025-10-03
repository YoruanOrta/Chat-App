import React, { useState } from 'react';
import './Login.css';

const TwoFactorInput = ({ onVerify, onBack }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (code.length !== 6) {
      setError('Code must be 6 digits');
      return;
    }
    
    onVerify(code);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Enter 2FA Code</h1>
        <p>Check your email for the verification code</p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit code"
            maxLength={6}
            autoFocus
            style={{ fontSize: '24px', textAlign: 'center', letterSpacing: '10px' }}
          />
          <button type="submit">Verify</button>
        </form>
        <p className="switch-form">
          <span onClick={onBack}>← Back to login</span>
        </p>
      </div>
    </div>
  );
};

export default TwoFactorInput;