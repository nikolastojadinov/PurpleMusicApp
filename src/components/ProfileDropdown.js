import React, { useState, useRef, useEffect } from 'react';

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePiNetworkLogin = () => {
    alert('Login with Pi Network clicked!');
    setIsOpen(false);
  };

  const handleGoPremium = () => {
    alert('Go Premium clicked!');
    setIsOpen(false);
  };

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      {/* Profile Icon */}
      <div 
        className="profile-icon"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>👤</span>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="profile-dropdown-menu">
          <div className="dropdown-arrow"></div>
          
          <div className="dropdown-content">
            {/* Pi Network Login Button */}
            <button
              onClick={handlePiNetworkLogin}
              className="dropdown-button pi-network"
            >
              <div className="button-icon pi-icon">π</div>
              <div className="button-text">
                <div className="button-title">Login with Pi Network</div>
                <div className="button-subtitle">Connect your Pi account</div>
              </div>
            </button>

            {/* Divider */}
            <div className="dropdown-divider"></div>

            {/* Go Premium Button */}
            <button
              onClick={handleGoPremium}
              className="dropdown-button premium"
            >
              <div className="button-icon premium-icon">⭐</div>
              <div className="button-text">
                <div className="button-title">Go Premium</div>
                <div className="button-subtitle">Upgrade your experience</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}