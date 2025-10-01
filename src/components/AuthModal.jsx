import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthProvider.jsx';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AuthModal() {
  const { authModal, hideAuthModal, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { visible, type, message, dismissible } = authModal;

  useEffect(() => {
    if (visible && type === 'success') {
      const t = setTimeout(() => {
        if (location.pathname !== '/') navigate('/');
        hideAuthModal();
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [visible, type, hideAuthModal, navigate, location.pathname]);

  if (!visible) return null;

  return (
    <div className="auth-modal-overlay">
      <div className={`auth-modal auth-modal-${type}`}> 
        <div className="auth-modal-content">
          <div className="auth-modal-message">{message}</div>
          {type === 'error' && (
            <button className="auth-modal-btn" onClick={hideAuthModal}>Close</button>
          )}
        </div>
        {dismissible && type !== 'success' && (
          <button className="auth-modal-close" onClick={hideAuthModal}>×</button>
        )}
      </div>
    </div>
  );
}
