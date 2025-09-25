import React from 'react';
import ProfileDropdown from './ProfileDropdown';

export default function Header() {
  return (
    <header className="header">
      <div className="header-logo">
        <img 
          src="/logo.png" 
          alt="PurpleMusic Logo" 
          className="logo-image"
        />
        <span className="logo-text">PurpleMusic</span>
      </div>
      
      <div className="header-profile">
        <ProfileDropdown />
      </div>
    </header>
  );
}