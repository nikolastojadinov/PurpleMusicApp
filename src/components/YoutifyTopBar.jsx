import React from 'react';
import ProfileDropdown from './ProfileDropdown';

export default function YoutifyTopBar() {
  return (
    <header className="y-top">
      <div className="y-logo">
        <img src="/logo.png" alt="PurpleMusic" />
        <span>PurpleMusic</span>
      </div>
      <div className="y-actions">
        <ProfileDropdown />
      </div>
    </header>
  );
}
