import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGlobalModal } from '../context/GlobalModalContext.jsx';
import { useAuth } from '../context/AuthProvider.jsx';

export default function ViewProfileScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [profilePicture, setProfilePicture] = useState(null);
  const { show } = useGlobalModal();
  const [username, setUsername] = useState(t('profile_view.default_username', { defaultValue: 'Music Lover' }));
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
  show(t('profile_view.updated_success'), { type: 'success', autoClose: 2500 });
  };

  return (
    <div className="view-profile-screen">
      <div className="profile-header">
  <h1 className="screen-title">{t('profile_view.title')}</h1>
        <button 
          className="edit-profile-btn"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? t('profile_view.cancel') : t('profile_view.edit')}
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
                <span className="upload-text">{t('profile_view.change_photo')}</span>
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
            <label className="field-label">{t('profile_view.username')}</label>
            {isEditing ? (
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="field-input"
                placeholder={t('profile_view.enter_username')}
              />
            ) : (
              <div className="field-value">{username}</div>
            )}
          </div>

          <div className="profile-field">
            <label className="field-label">{t('profile_view.email')}</label>
            {isEditing ? (
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field-input"
                placeholder={t('profile_view.enter_email')}
              />
            ) : (
              <div className="field-value">{email}</div>
            )}
          </div>

          <div className="profile-field">
            <label className="field-label">{t('profile_view.member_since')}</label>
            <div className="field-value">September 2024</div>
          </div>

          <div className="profile-field">
            <label className="field-label">{t('profile_view.premium_status')}</label>
            <div className="field-value premium-status">
              <span className="status-badge free">{t('profile_view.free_plan')}</span>
              <button className="upgrade-badge">{t('profile_view.upgrade_premium')}</button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        {isEditing && (
          <div className="profile-actions">
            <button className="save-profile-btn" onClick={handleSaveProfile}>
              {t('profile_view.save_changes')}
            </button>
          </div>
        )}

        {/* Stats Section */}
        <div className="profile-stats">
          <h3 className="stats-title">{t('profile_view.stats_title')}</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">42</div>
              <div className="stat-label">{t('profile_view.stats_liked')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">12</div>
              <div className="stat-label">{t('profile_view.stats_playlists')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">156</div>
              <div className="stat-label">{t('profile_view.stats_hours')}</div>
            </div>
          </div>
          {/* Spotify connect placeholder */}
          <div style={{marginTop:16, display:'flex', justifyContent:'center'}}>
            <button
              onClick={() => {
                try {
                  const base = process.env.REACT_APP_API_URL || '';
                  const u = new URL((base.replace(/\/$/, '')) + '/api/auth/spotify/login');
                  const id = user?.id; const pi_uid = user?.pi_uid || user?.pi_user_uid;
                  if (id) u.searchParams.set('id', id);
                  if (pi_uid) u.searchParams.set('pi_uid', pi_uid);
                  window.open(u.toString(), '_self');
                } catch (e) { console.warn('Spotify login open failed', e); }
              }}
              style={{
                background: '#1DB954',
                color: '#000',
                border: 'none',
                padding: '10px 16px',
                borderRadius: 24,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Connect Spotify
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}