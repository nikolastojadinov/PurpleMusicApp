import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthProvider.jsx';

// Fullscreen overlay showing auth intro video during Pi SDK authentication
export default function AuthIntroOverlay() {
  const { authIntro } = useAuth();
  const { visible, status } = authIntro || {};
  const [render, setRender] = useState(visible);
  const videoRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setRender(true);
      if (videoRef.current) {
        try {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
        } catch {}
      }
    } else if (!visible && render) {
      const t = setTimeout(() => setRender(false), 750);
      if (videoRef.current) {
        try { videoRef.current.pause(); } catch {}
      }
      return () => clearTimeout(t);
    }
  }, [visible, render]);

  if (!render) return null;
  const fadingOut = !visible && render;

  return (
    <div className={`auth-intro-overlay${fadingOut ? ' fade-out' : ''}`}> 
      <div className="auth-intro-video-wrapper">
        <video
          ref={videoRef}
          className="auth-intro-video"
          autoPlay
          muted
          playsInline
          src="/purplemusic-auth.mp4"
        />
        {status === 'error' && (
          <div className="auth-intro-error">Authentication failed…</div>
        )}
      </div>
    </div>
  );
}
