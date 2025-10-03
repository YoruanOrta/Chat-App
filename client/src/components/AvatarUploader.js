import React, { useState } from 'react';
import { config } from '../config';
import './AvatarUploader.css';

const AvatarUploader = ({ currentAvatar, userId, email, onAvatarUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    await uploadAvatar(file);
  };

  const uploadAvatar = async (file) => {
    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target.result;
        
        const metadata = {
          type: 'avatar_upload',
          userId: userId,
          email: email,
          filename: file.name
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

  const avatarUrl = preview || (currentAvatar ? `${config.API_URL}/uploads/avatars/${currentAvatar}` : null);

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