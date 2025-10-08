import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  // removed unused getIcon helper

  const navItems = [
    { path: '/', label: 'Home', icon: 'home' },
    { path: '/trends', label: 'Trends', icon: 'trends' },
    { path: '/yt', label: 'YouTube', icon: 'yt' },
    { path: '/playlists', label: 'Library', icon: 'lib' }
  ];

  const iconSvg = (icon) => {
    switch(icon){
      case 'home': return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>);
      case 'trends': return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>);
      case 'yt': return (<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M10 15.5v-7l6 3.5-6 3.5Z"/><path d="M21.6 7.2c-.2-.9-.9-1.6-1.8-1.8C18 5 12 5 12 5s-6 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 9 2 12 2 12s0 3 .4 4.8c.2.9.9 1.6 1.8 1.8C6 19 12 19 12 19s6 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.8.4-4.8.4-4.8s0-3-.4-4.8Z"/></svg>);
      case 'lib': return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>);
      default: return null;
    }
  };

  return (
    <nav className="bottom-navigation">
      {navItems.map((item) => (
        <button
          key={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="nav-icon" style={{display:'flex',alignItems:'center',justifyContent:'center',width:40,height:26,position:'relative'}}>
            <span style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',color: location.pathname===item.path ? '#E91E63' : '#B3B3B3', transition:'color .3s'}}>{iconSvg(item.icon)}</span>
          </span>
          <span className="nav-label" style={{color: location.pathname===item.path ? '#fff' : '#B3B3B3'}}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}