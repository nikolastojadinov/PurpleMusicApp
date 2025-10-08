import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Original flat black & white PurpleMusic footer (3 tabs)
export default function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/liked', label: 'Liked Songs', icon: HeartIcon },
    { path: '/create-playlist', label: 'Create Playlist', icon: PlusIcon }
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
    background: '#000',
    borderTop: '1px solid #181818',
    zIndex: 1100,
    padding: '8px 8px 10px',
    fontFamily: 'inherit'
  };

  const btnBase = (active) => ({
    flex: 1,
    height: '100%',
    background: 'transparent',
    border: 'none',
    color: active ? '#fff' : '#aaa',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    cursor: 'pointer',
    fontSize: 11.5,
    fontWeight: active ? 600 : 500,
    letterSpacing: '.4px',
    transition: 'color .3s, transform .35s',
    transform: active ? 'translateY(-1px)' : 'translateY(0)'
  });

  return (
    <nav style={barStyle} aria-label="Primary">
      {tabs.map(tab => {
        const active = location.pathname === tab.path;
        const Icon = tab.icon;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={btnBase(active)}
            aria-label={tab.label}
            aria-current={active ? 'page' : undefined}
            onKeyDown={(e)=>{ if(e.key==='Enter') navigate(tab.path); }}
          >
            <Icon active={active} />
            <span style={{opacity: active ? 0.95 : 0.7, textAlign:'center', maxWidth:100, lineHeight:1.1}}>{tab.label}</span>
          </button>
        );
      })}
      <style>{`
        @media (min-width: 900px){ nav[aria-label=Primary] { max-width: 760px; margin:0 auto; } }
        nav[aria-label=Primary] button:hover svg { transform:scale(1.14); }
        nav[aria-label=Primary] button:focus-visible { outline:2px solid #fff; outline-offset:2px; border-radius:18px; }
      `}</style>
    </nav>
  );
}

// Icon components (outline when inactive, filled when active)
function HomeIcon({ active }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" style={{transition:'transform .35s, fill .3s, stroke .3s', transform: active ? 'scale(1.18)' : 'scale(.96)'}} fill={active ? '#fff' : 'none'} stroke="#fff" strokeWidth={1.7} strokeLinejoin="round" strokeLinecap="round">
      <path d="M3 11.4 12 4l9 7.4" />
      <path d="M5.5 10.2V20h5.2v-5.1h2.6V20h5.2v-9.8" />
    </svg>
  );
}

function HeartIcon({ active }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" style={{transition:'transform .35s, fill .3s, stroke .3s', transform: active ? 'scale(1.18)' : 'scale(.96)'}} fill={active ? '#fff' : 'none'} stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20s-3.7-3.18-5.6-5.07C4.5 13.04 3.4 11.5 3.4 9.7 3.4 7.1 5.5 5 8.1 5c1.4 0 2.7.6 3.6 1.6.9-1 2.2-1.6 3.6-1.6 2.6 0 4.7 2.1 4.7 4.7 0 1.8-1.1 3.34-3 5.23C15.7 16.83 12 20 12 20Z" />
    </svg>
  );
}

function PlusIcon({ active }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" style={{transition:'transform .35s, fill .3s, stroke .3s', transform: active ? 'scale(1.18)' : 'scale(.96)'}} fill={active ? '#fff' : 'none'} stroke="#fff" strokeWidth={1.9} strokeLinecap="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}