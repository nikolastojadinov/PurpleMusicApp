import React, { useState, useRef } from 'react';
import { useGlobalModal } from '../context/GlobalModalContext.jsx';

export default function ViewProfileScreen() {
  const [profilePicture, setProfilePicture] = useState(null);
  const { show } = useGlobalModal();
  const [username, setUsername] = useState('Music Lover');
  const [email, setEmail] = useState('user@example.com');
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfilePicture(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSaveProfile = () => {
    setIsEditing(false);
    // Here you would save to backend/Supabase
    show('Profile updated successfully!', { type: 'success', autoClose: 2500 });
  };

  return (
    <div className="view-profile-screen">
      <div className="profile-header">
        <h1 className="screen-title">Profile</h1>
        <button 
          className="edit-profile-btn"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="profile-content">
        {/* Profile Picture Section */}
        <div className="profile-picture-section">
          <div className="profile-picture-container" onClick={isEditing ? triggerFileInput : undefined}>
            {profilePicture ? (
              <img 
                src={profilePicture} 
                alt="Profile" 
                className="profile-picture"
              />
            ) : (
              <div className="profile-picture-placeholder">
                <span className="profile-icon-large">👤</span>
              </div>
            )}
            {isEditing && (
              <div className="profile-picture-overlay">
                <span className="camera-icon">📷</span>
                <span className="upload-text">Change Photo</span>
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleProfilePictureChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>

        {/* Profile Information */}
        <div className="profile-info-section">
          <div className="profile-field">
            <label className="field-label">Username</label>
            {isEditing ? (
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="field-input"
                placeholder="Enter username"
              />
            ) : (
              <div className="field-value">{username}</div>
            )}
          </div>

          <div className="profile-field">
            <label className="field-label">Email</label>
            {isEditing ? (
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field-input"
                placeholder="Enter email"
              />
            ) : (
              <div className="field-value">{email}</div>
            )}
          </div>

          <div className="profile-field">
            <label className="field-label">Member Since</label>
            <div className="field-value">September 2024</div>
          </div>

          <div className="profile-field">
            <label className="field-label">Premium Status</label>
            <div className="field-value premium-status">
              <span className="status-badge free">Free Plan</span>
              <button className="upgrade-badge">Upgrade to Premium</button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        {isEditing && (
          <div className="profile-actions">
            <button className="save-profile-btn" onClick={handleSaveProfile}>
              Save Changes
            </button>
          </div>
        )}

        {/* Stats Section */}
        <div className="profile-stats">
          <h3 className="stats-title">Your Music Stats</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">42</div>
              <div className="stat-label">Liked Songs</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">12</div>
              <div className="stat-label">Playlists</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">156</div>
              <div className="stat-label">Hours Listened</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}