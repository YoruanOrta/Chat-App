import React, { useEffect, useRef, useState } from 'react';
import Message from './Message';
import TypingIndicator from './TypingIndicator';

const MessagesList = ({ messages }) => {
  const messagesEndRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  useEffect(() => {
    // Listen for typing events
    const handleTyping = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'typing_start') {
          setTypingUsers(prev => {
            if (!prev.includes(data.payload.username)) {
              return [...prev, data.payload.username];
            }
            return prev;
          });
        }
        
        if (data.type === 'typing_stop') {
          setTypingUsers(prev => prev.filter(u => u !== data.payload.username));
        }
      } catch (err) {
        // Ignore non-JSON messages
      }
    };

    if (window.chatWebSocket) {
      window.chatWebSocket.addEventListener('message', handleTyping);
    }

    return () => {
      if (window.chatWebSocket) {
        window.chatWebSocket.removeEventListener('message', handleTyping);
      }
    };
  }, []);

  return (
    <div className="messages-list">
      <h2>Messages</h2>
      <div className="messages-container">
        {messages.map((msg, index) => (
          <Message 
            key={index} 
            message={msg.message} 
            author={msg.author}
            authorAvatar={msg.authorAvatar}
            file={msg.file}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <TypingIndicator typingUsers={typingUsers} />
    </div>
  );
};

export default MessagesList;