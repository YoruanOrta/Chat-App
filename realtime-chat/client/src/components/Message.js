import React from 'react';

const Message = ({ message, author, authorAvatar }) => {
  console.log('Message props:', { author, authorAvatar, message }); // Debug
  
  const avatarUrl = authorAvatar 
    ? `http://localhost:8989/uploads/avatars/${authorAvatar}`
    : null;

  return (
    <div className="message">
      {avatarUrl ? (
        <img 
          src={avatarUrl} 
          alt={author} 
          className="message-avatar"
          onError={(e) => {
            console.error('Avatar failed to load:', avatarUrl);
            e.target.onerror = null; // Prevent infinite loop
            e.target.style.display = 'none';
            // Create placeholder
            if (!e.target.nextSibling || !e.target.nextSibling.classList.contains('message-avatar-placeholder')) {
              const placeholder = document.createElement('div');
              placeholder.className = 'message-avatar-placeholder';
              placeholder.textContent = author.charAt(0).toUpperCase();
              e.target.parentNode.insertBefore(placeholder, e.target.nextSibling);
            }
          }}
        />
      ) : (
        <div className="message-avatar-placeholder">
          {author.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="message-body">
        <div className="message-header">
          <strong>{author}</strong>
        </div>
        <div className="message-content">{message}</div>
      </div>
    </div>
  );
};

export default Message;