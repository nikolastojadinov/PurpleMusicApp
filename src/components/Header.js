import React from 'react';

export default function Header() {
  return (
    <header className="header">
      <div className="header-logo">
        <span className="logo-icon">♪</span>
        <span className="logo-text">Spotify</span>
      </div>
      
      <div className="header-profile">
        <div className="profile-icon">
          <span>👤</span>
        </div>
      </div>
    </header>
  );
}