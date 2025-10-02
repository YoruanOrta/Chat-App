import React from 'react';

const generateAvatar = (username) => {
  // Opciones de estilos: 'adventurer', 'avataaars', 'bottts', 'fun-emoji', 'lorelei', 'micah', 'miniavs', 'notionists', 'personas'
  return `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(username)}`;
};

const Message = ({ message, author }) => (
  <div className="message">
    <div className="message-header">
      <img 
        src={generateAvatar(author)} 
        alt={author} 
        className="message-avatar"
      />
      <strong>{author}:</strong>
    </div>
    <div className="message-content">{message}</div>
  </div>
);

export default Message;