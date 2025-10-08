import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Reverted simplified PurpleMusic footer navigation (original style) with three tabs
export default function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/liked', label: 'Liked', icon: '💜' },
    { path: '/create-playlist', label: 'New', icon: '➕' }
  ];

  const barStyle = {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    background: 'linear-gradient(90deg,#b566f1,#c792f5)',
    boxShadow: '0 -4px 14px -2px rgba(0,0,0,0.35)',
    zIndex: 1100,
    padding: '8px 8px 10px',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    fontFamily: 'inherit'
  };

  const btnBase = (active) => ({
    flex: 1,
    height: '100%',
    background: 'transparent',
    border: 'none',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: active ? 600 : 500,
    letterSpacing: '.4px',
    transition: 'color .25s, transform .25s',
    transform: active ? 'translateY(-2px)' : 'translateY(0)',
    textShadow: active ? '0 2px 6px rgba(0,0,0,0.35)' : 'none'
  });

  const iconStyle = (active) => ({
    fontSize: 26,
    lineHeight: 1,
    transition: 'transform .28s cubic-bezier(.4,1.6,.4,1)',
    transform: active ? 'scale(1.15)' : 'scale(.92)',
    filter: active ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))' : 'none'
  });

  return (
    <nav style={barStyle} aria-label="Primary">
      {tabs.map(tab => {
        const active = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={btnBase(active)}
            aria-label={tab.label}
            aria-current={active ? 'page' : undefined}
            onKeyDown={(e)=>{ if(e.key==='Enter') navigate(tab.path); }}
          >
            <span style={iconStyle(active)}>{tab.icon}</span>
            <span style={{opacity: active ? 1 : 0.85}}>{tab.label}</span>
          </button>
        );
      })}
      <style>{`
        @media (min-width: 900px){ nav[aria-label=Primary] { max-width: 760px; margin:0 auto; border-radius:26px 26px 0 0; } }
        nav[aria-label=Primary] button:hover span:first-child { transform:scale(1.18); }
        nav[aria-label=Primary] button:focus-visible { outline:2px solid rgba(255,255,255,0.9); outline-offset:2px; border-radius:18px; }
      `}</style>
    </nav>
  );
}