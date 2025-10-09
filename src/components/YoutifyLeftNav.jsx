import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function YoutifyLeftNav({ onNavigate }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const go = (path) => {
    navigate(path);
    onNavigate && onNavigate(path);
  };

  const Item = ({ path, icon, label, onClick }) => {
    const active = path ? pathname === path : false;
    const handle = () => {
      if (onClick) onClick();
      if (path) go(path);
    };
    return (
      <button className={`y-left-item${active ? ' active' : ''}`} onClick={handle} aria-current={active ? 'page' : undefined}>
        <span className="y-left-icon" aria-hidden>{icon}</span>
        <span className="y-left-label">{label}</span>
      </button>
    );
  };

  return (
    <nav className="y-left-nav" aria-label="Sections">
      <Item path="/" icon="🏠" label="Home" />
      <Item path="/profile" icon="👤" label="Profile" />
      <Item onClick={() => window.dispatchEvent(new CustomEvent('pm:openPremiumModal', { detail: { source: 'leftnav' } }))} icon="⭐" label="Premium" />
      <div className="y-left-sep" />
      <Item path="/privacy" icon="🔒" label="Privacy" />
      <Item path="/terms" icon="📄" label="Terms" />
    </nav>
  );
}
