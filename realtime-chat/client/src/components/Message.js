import React from 'react';
import { config } from '../config';

const Message = ({ message, author, authorAvatar, file }) => {
  const avatarUrl = authorAvatar 
    ? `${config.API_URL}/uploads/avatars/${authorAvatar}`
    : null;

  const getInitials = (name) => {
    return name.charAt(0).toUpperCase();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    if (fileType.includes('word') || fileType.includes('doc')) return '📝';
    return '📎';
  };

  const isImage = file && file.type.startsWith('image/');
  const fileUrl = file ? `${config.API_URL}${file.path}` : null;

  return (
    <div className="message">
      <div className="message-avatar-container">
        {avatarUrl ? (
          <img src={avatarUrl} alt={author} className="message-avatar" />
        ) : (
          <div className="message-avatar message-avatar-placeholder">
            {getInitials(author)}
          </div>
        )}
      </div>
      
      <div className="message-body">
        <div className="message-header">
          <strong>{author}</strong>
        </div>
        
        {message && (
          <div className="message-content">{message}</div>
        )}
        
        {file && (
          <div className="message-file">
            {isImage ? (
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="message-image-link">
                <img 
                  src={fileUrl} 
                  alt={file.originalName}
                  className="message-image"
                  loading="lazy"
                />
              </a>
            ) : (
              <a 
                href={fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="message-file-download"
                download={file.originalName}
              >
                <span className="file-icon">{getFileIcon(file.type)}</span>
                <div className="file-info">
                  <span className="file-name">{file.originalName}</span>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                </div>
                <span className="download-icon">⬇️</span>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;