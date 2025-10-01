import React from 'react';

const Message = ({ message, author }) => (
  <div className="message">
    <strong>{author}:</strong> {message}
  </div>
);

export default Message;