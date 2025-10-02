import React from 'react';
import Message from './Message';

const MessagesList = ({ messages }) => (
  <div className="messages-list">
    <h2>Messages</h2>
    <div className="messages-container">
      {messages.map(msg => (
        <Message
          key={msg.id || msg.timestamp}
          message={msg.message}
          author={msg.author}
          authorAvatar={msg.authorAvatar}
        />
      ))}
    </div>
  </div>
);

export default MessagesList;