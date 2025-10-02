import React, { useState } from 'react';
import './AvatarUploader.css';

const AvatarUploader = ({ currentAvatar, userId, email, onAvatarUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload
    await uploadAvatar(file);
  };

  const uploadAvatar = async (file) => {
    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target.result;
        
        // Create metadata
        const metadata = {
          type: 'avatar_upload',
          userId: userId,
          email: email,
          filename: file.name
        };
        
        const metadataStr = JSON.stringify(metadata);
        const metadataBuffer = new TextEncoder().encode(metadataStr);
        
        // Create combined buffer: [4 bytes length][metadata][file data]
        const combinedBuffer = new Uint8Array(4 + metadataBuffer.length + arrayBuffer.byteLength);
        
        // Write metadata length
        const view = new DataView(combinedBuffer.buffer);
        view.setUint32(0, metadataBuffer.length, false);
        
        // Write metadata
        combinedBuffer.set(metadataBuffer, 4);
        
        // Write file data
        combinedBuffer.set(new Uint8Array(arrayBuffer), 4 + metadataBuffer.length);
        
        // Send via WebSocket
        if (window.chatWebSocket && window.chatWebSocket.readyState === WebSocket.OPEN) {
          window.chatWebSocket.send(combinedBuffer);
          
          // Wait for response
          const handleResponse = (event) => {
            try {
              const data = JSON.parse(event.data);
              if (data.type === 'avatar_upload_response') {
                if (data.payload.success) {
                  onAvatarUpdate(data.payload.avatar);
                  alert('Avatar updated successfully!');
                } else {
                  alert('Failed to update avatar: ' + data.payload.message);
                }
                window.chatWebSocket.removeEventListener('message', handleResponse);
                setUploading(false);
              }
            } catch (err) {
              // Ignore non-JSON messages
            }
          };
          
          window.chatWebSocket.addEventListener('message', handleResponse);
        } else {
          alert('Not connected to server');
          setUploading(false);
        }
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar');
      setUploading(false);
    }
  };

  const avatarUrl = preview || (currentAvatar ? `http://localhost:8989/uploads/avatars/${currentAvatar}` : null);

  return (
    <div className="avatar-uploader">
      <div className="avatar-preview">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="avatar-img" />
        ) : (
          <div className="avatar-placeholder">
            <span>No Avatar</span>
          </div>
        )}
      </div>
      <label className="avatar-upload-btn">
        {uploading ? 'Uploading...' : 'Change Avatar'}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          style={{ display: 'none' }}
        />
      </label>
    </div>
  );
};

export default AvatarUploader;