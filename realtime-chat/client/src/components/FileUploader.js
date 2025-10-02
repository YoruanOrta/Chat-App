import React, { useState, useRef } from 'react';
import './FileUploader.css';

const FileUploader = ({ onFileSelected }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File must be less than 10MB');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    // Pass file to parent component
    if (onFileSelected) {
      onFileSelected(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onFileSelected) {
      onFileSelected(null);
    }
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

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="file-uploader">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
      />
      
      {!selectedFile ? (
        <button
          className="attach-file-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
          type="button"
        >
          📎
        </button>
      ) : (
        <div className="file-preview">
          {preview ? (
            <div className="image-preview">
              <img src={preview} alt="Preview" />
              <button className="remove-file-btn" onClick={handleRemoveFile} type="button">
                ✕
              </button>
            </div>
          ) : (
            <div className="file-info">
              <span className="file-icon">{getFileIcon(selectedFile.type)}</span>
              <div className="file-details">
                <span className="file-name">{selectedFile.name}</span>
                <span className="file-size">{formatFileSize(selectedFile.size)}</span>
              </div>
              <button className="remove-file-btn" onClick={handleRemoveFile} type="button">
                ✕
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploader;