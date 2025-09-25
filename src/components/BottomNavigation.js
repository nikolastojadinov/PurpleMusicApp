import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const getIcon = (path) => {
    const isActive = location.pathname === path;
    
    switch (path) {
      case '/':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9,22 9,12 15,12 15,22"/>
          </svg>
        );
      case '/search':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        );
      case '/liked':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        );
      case '/playlists':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4"/>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3V3c0-1.66 4-3 9-3s9 1.34 9 3v9z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/search', label: 'Search' },
    { path: '/liked', label: 'Liked Songs' },
    { path: '/playlists', label: 'My Playlists' }
  ];

  return (
    <nav className="bottom-navigation">
      {navItems.map((item) => (
        <button
          key={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="nav-icon">{getIcon(item.path)}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}