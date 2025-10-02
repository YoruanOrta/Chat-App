import React, { useState } from 'react';
import AvatarUploader from './AvatarUploader';
import './ProfileSettings.css';

const ProfileSettings = ({ user, onClose, onProfileUpdate }) => {
  const [notifications, setNotifications] = useState(user.notifications);

  const handleAvatarUpdate = (newAvatar) => {
    // Update user object with new avatar
    onProfileUpdate({ ...user, avatar: newAvatar });
  };

  const handleNotificationsToggle = () => {
    setNotifications(!notifications);
    // TODO: Send to server to update notification preference
  };

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Profile Settings</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        
        <div className="settings-content">
          <div className="settings-section">
            <h3>Profile Picture</h3>
            <AvatarUploader 
              currentAvatar={user.avatar}
              userId={user.id}
              email={user.email}
              onAvatarUpdate={handleAvatarUpdate}
            />
          </div>

          <div className="settings-section">
            <h3>Account Information</h3>
            <div className="info-row">
              <label>Username:</label>
              <span>{user.username}</span>
            </div>
            <div className="info-row">
              <label>Email:</label>
              <span>{user.email}</span>
            </div>
          </div>

          <div className="settings-section">
            <h3>Preferences</h3>
            <div className="preference-row">
              <label>
                <input 
                  type="checkbox" 
                  checked={notifications}
                  onChange={handleNotificationsToggle}
                />
                <span>Email notifications for new messages</span>
              </label>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button onClick={onClose} className="done-btn">Done</button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;