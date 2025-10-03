import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import FileUploader from './FileUploader';

const AddMessage = ({ onSubmit, username }) => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const emojiPickerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Send typing indicator
  const handleTyping = (value) => {
    setMessage(value);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing start if not already typing
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      if (window.chatWebSocket && window.chatWebSocket.readyState === WebSocket.OPEN) {
        window.chatWebSocket.send(JSON.stringify({
          type: 'typing_start',
          payload: { username }
        }));
      }
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (window.chatWebSocket && window.chatWebSocket.readyState === WebSocket.OPEN) {
        window.chatWebSocket.send(JSON.stringify({
          type: 'typing_stop',
          payload: { username }
        }));
      }
    }, 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() && !selectedFile) {
      return;
    }

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      if (window.chatWebSocket && window.chatWebSocket.readyState === WebSocket.OPEN) {
        window.chatWebSocket.send(JSON.stringify({
          type: 'typing_stop',
          payload: { username }
        }));
      }
    }

    setUploading(true);

    try {
      if (selectedFile) {
        await uploadFileWithMessage(selectedFile, message.trim());
        setMessage('');
        setSelectedFile(null);
      } else {
        onSubmit(message);
        setMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setUploading(false);
    }
  };

  const uploadFileWithMessage = async (file, text) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const arrayBuffer = e.target.result;
        
        const metadata = {
          type: 'file_message',
          filename: file.name,
          fileType: file.type,
          message: text
        };
        
        const metadataStr = JSON.stringify(metadata);
        const metadataBuffer = new TextEncoder().encode(metadataStr);
        
        const combinedBuffer = new Uint8Array(4 + metadataBuffer.length + arrayBuffer.byteLength);
        
        const view = new DataView(combinedBuffer.buffer);
        view.setUint32(0, metadataBuffer.length, false);
        
        combinedBuffer.set(metadataBuffer, 4);
        combinedBuffer.set(new Uint8Array(arrayBuffer), 4 + metadataBuffer.length);
        
        if (window.chatWebSocket && window.chatWebSocket.readyState === WebSocket.OPEN) {
          window.chatWebSocket.send(combinedBuffer);
          setTimeout(() => resolve(), 300);
        } else {
          reject(new Error('Not connected to server'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const onEmojiClick = (emojiData) => {
    setMessage(message + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <form onSubmit={handleSubmit} className="add-message">
      <FileUploader onFileSelected={setSelectedFile} />
      
      <div className="emoji-picker-container" ref={emojiPickerRef}>
        <button
          type="button"
          className="emoji-btn"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          😊
        </button>
        {showEmojiPicker && (
          <div className="emoji-picker-wrapper">
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              theme="dark"
              width={320}
              height={400}
            />
          </div>
        )}
      </div>

      <textarea
        value={message}
        onChange={(e) => handleTyping(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={selectedFile ? "Add a caption (optional)..." : "Type your message..."}
        disabled={uploading}
        rows={1}
      />
      <button type="submit" disabled={uploading || (!message.trim() && !selectedFile)}>
        {uploading ? '⏳' : '📤'}
      </button>
    </form>
  );
};

export default AddMessage;