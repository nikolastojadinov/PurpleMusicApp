import React from 'react';
import ProfileDropdown from './ProfileDropdown';

export default function Header() {
  return (
    <header className="header">
      <div className="header-logo">
        <span className="logo-icon">♪</span>
        <span className="logo-text">Spotify</span>
      </div>
      
      <div className="header-profile">
        <ProfileDropdown />
      </div>
    </header>
  );
}