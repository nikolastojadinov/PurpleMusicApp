import React, { useRef, useState, useEffect } from 'react';
import { checkSongLiked, likeSong, unlikeSong, isUserLoggedIn } from '../services/likeService';

const demoSong = {
  id: 'demo_night_owl',
  title: 'Night Owl',
  artist: 'Annie Walker',
  cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=facearea&w=64&h=64',
  src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  duration: 205
};

export default function ModernAudioPlayer({ song = demoSong, autoPlay = false, onClose = null }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(song.duration);
  const [volume, setVolume] = useState(0.8);
  const [dragOffset, setDragOffset] = useState(0);
  const [playerBottom, setPlayerBottom] = useState(120); // default offset from bottom - above footer
  const [translateY, setTranslateY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [startY, setStartY] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showPremiumPopup, setShowPremiumPopup] = useState(false);

  // Premium check function - for demo purposes, simulate some premium users
  const isPremium = () => {
    // For demo: Check if user has set premium in localStorage for testing
    // In real app, this would check actual subscription/payment status
    const userId = localStorage.getItem('user_id');
    return localStorage.getItem('premium_demo') === 'true' || 
           (userId && userId.includes('premium')); // demo premium users
  };

  // Play/Pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Mute/Unmute
  const toggleMute = () => {
    setIsMuted((prev) => {
      if (audioRef.current) audioRef.current.muted = !prev;
      return !prev;
    });
  };

  // Progress
  const handleTimeUpdate = () => {
    setProgress(audioRef.current.currentTime);
  };
  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };
  const handleSeek = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.nativeEvent.clientX - rect.left;
    const percent = x / rect.width;
    const seekTime = percent * duration;
    audioRef.current.currentTime = seekTime;
    setProgress(seekTime);
  };

  // Volume
  const handleVolumeChange = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.nativeEvent.clientX - rect.left;
    const percent = Math.min(Math.max(x / rect.width, 0), 1);
    setVolume(percent);
    if (audioRef.current) audioRef.current.volume = percent;
  };

  // Mouse Drag & Drop
  const handleDragStart = (e) => {
    setDragging(true);
    setStartY(e.clientY);
    document.body.style.overflow = 'hidden';
  };
  const handleDrag = (e) => {
    if (!dragging) return;
    const offset = e.clientY - startY;
    setTranslateY(offset);
  };
  const handleDragEnd = () => {
    if (!dragging) return;
    const offset = translateY;
    const maxOffset = window.innerHeight - 180;
    const newBottom = Math.max(0, Math.min(playerBottom - offset, maxOffset));
    setPlayerBottom(newBottom);
    setDragging(false);
    setStartY(null);
    setTranslateY(0);
    document.body.style.overflow = '';
  };

  // Touch Drag & Drop
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setDragging(true);
      setTouchStartY(e.touches[0].clientY);
      document.body.style.overflow = 'hidden';
    }
  };
  const handleTouchMove = (e) => {
    if (!dragging || e.touches.length !== 1) return;
    e.preventDefault();
    const offset = e.touches[0].clientY - touchStartY;
    setTranslateY(offset);
  };
  const handleTouchEnd = () => {
    if (!dragging) return;
    const offset = translateY;
    const maxOffset = window.innerHeight - 180;
    const newBottom = Math.max(0, Math.min(playerBottom - offset, maxOffset));
    setPlayerBottom(newBottom);
    setDragging(false);
    setTouchStartY(null);
    setTranslateY(0);
    document.body.style.overflow = '';
  };

  // Format time
  const formatTime = (s) => {
    if (!s) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // Like/Unlike functionality
  const toggleLike = async () => {
    if (!isUserLoggedIn()) {
      alert('Please log in to like songs!');
      return;
    }
    
    if (!isPremium()) {
      setShowPremiumPopup(true);
      return;
    }
    
    try {
      if (isLiked) {
        const success = await unlikeSong(song.id);
        if (success) {
          setIsLiked(false);
        }
      } else {
        const success = await likeSong(song);
        if (success) {
          setIsLiked(true);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };
  
  // Check if song is liked on component mount
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (song?.id && isUserLoggedIn()) {
        const liked = await checkSongLiked(song.id);
        setIsLiked(liked);
      }
    };
    
    checkLikeStatus();
  }, [song?.id]);

  // Skip functionality with premium check
  const handlePrev = () => {
    if (!isPremium()) {
      setShowPremiumPopup(true);
      return;
    }
    // Premium functionality: actual skip to previous track
    audioRef.current.currentTime = 0;
    setProgress(0);
  };
  const handleNext = () => {
    if (!isPremium()) {
      setShowPremiumPopup(true);
      return;
    }
    // Premium functionality: actual skip to next track
    audioRef.current.currentTime = duration;
    setProgress(duration);
  };

  const closePremiumPopup = () => {
    setShowPremiumPopup(false);
  };

  // Attach drag listeners
  React.useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      return () => {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [dragging, startY, touchStartY]);

  // Auto play when song changes if requested
  React.useEffect(() => {
    if (autoPlay && audioRef.current) {
      // slight timeout to ensure metadata loads
      const t = setTimeout(() => {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }, 50);
      return () => clearTimeout(t);
    }
  }, [song?.src, autoPlay]);

  return (
    <div
      className="fixed z-50"
      style={{
        left: 0,
        right: 0,
        margin: '0 auto',
        bottom: `${playerBottom}px`,
        transform: `translateY(${translateY}px)`,
        transition: dragging ? 'none' : 'bottom 0.2s',
        maxWidth: 420,
        width: '96vw',
        cursor: dragging ? 'grabbing' : 'grab',
        boxSizing: 'border-box',
        touchAction: 'none',
      }}
      onMouseDown={handleDragStart}
      onTouchStart={handleTouchStart}
    >
      <audio
        ref={audioRef}
        src={song.src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        volume={volume}
      />
      <div className="backdrop-blur-md bg-gradient-to-br from-[#1a1a1a]/80 to-[#2d0036]/80 rounded-2xl shadow-lg border border-white/10 flex flex-col px-4 py-3 select-none w-full relative" style={{minWidth:'0'}}>
        {/* Top right controls: Close only */}
        {onClose && (
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }} 
            className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full border border-white/40 hover:border-white/80 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition"
            aria-label="Close player"
          >
            ×
          </button>
        )}
        
        {/* Bottom left control: Like */}
        {song?.id && (
          <button 
            onClick={e => { e.stopPropagation(); toggleLike(); }} 
            className="absolute bottom-2 left-2 z-10 p-1 group"
            title={!isUserLoggedIn() ? 'Please log in to like songs' : !isPremium() ? 'Premium Feature - Like songs' : isLiked ? 'Unlike song' : 'Like song'}
          >
            <svg width="20" height="20" fill={isLiked ? "#e53e3e" : "none"} stroke="currentColor" strokeWidth="2" className={`${isLiked ? 'text-red-500' : 'text-white/80'} group-hover:text-red-400 transition ${!isUserLoggedIn() ? 'opacity-50' : ''}`}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        )}
        
        {/* Bottom right control: Mute */}
        <button onClick={e => { e.stopPropagation(); toggleMute(); }} className="absolute bottom-2 right-2 z-10 p-1 group">
          {isMuted ? (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/80 group-hover:text-white transition">
              <path d="M11 5L6 9H2V15H6L11 19V5Z"/>
              <line x1="23" y1="9" x2="17" y2="15"/>
              <line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
          ) : (
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/80 group-hover:text-white transition">
              <path d="M11 5L6 9H2V15H6L11 19V5Z"/>
              <path d="M19.07 4.93A10 10 0 0122 12A10 10 0 0119.07 19.07M15.54 8.46A5 5 0 0117 12A5 5 0 0115.54 15.54"/>
            </svg>
          )}
        </button>
        
        {/* Song info */}
        <div className="flex items-center gap-3 mb-3 pr-16">
          <img src={song.cover} alt="cover" className="w-12 h-12 rounded-lg object-cover shadow-lg" />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-white font-semibold truncate text-sm leading-tight">{song.title}</span>
            <span className="text-white/70 text-sm truncate">{song.artist}</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-white/70 w-10 text-left">{formatTime(progress)}</span>
          <div className="relative flex-1 h-2 group cursor-pointer" onClick={e => { e.stopPropagation(); handleSeek(e); }}>
            <div className="absolute w-full h-1 bg-white/20 rounded-full top-0.5" />
            <div className="absolute h-1 bg-white rounded-full top-0.5" style={{ width: `${(progress / duration) * 100}%` }} />
            <div 
              className="absolute w-3 h-3 bg-white rounded-full shadow-lg transform -translate-y-1 opacity-0 group-hover:opacity-100 transition-opacity" 
              style={{ left: `calc(${(progress / duration) * 100}% - 6px)` }}
            />
          </div>
          <span className="text-sm text-white/70 w-10 text-right">{formatTime(duration)}</span>
        </div>
        {/* Main Controls - Centered */}
        <div className="flex items-center justify-center gap-6">
          <button onClick={e => { e.stopPropagation(); handlePrev(); }} className="p-2 group" title="Premium Feature - Skip Previous">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/80 group-hover:text-white transition">
              <path d="M19 20L9 12L19 4V20Z"/>
              <line x1="5" y1="19" x2="5" y2="5"/>
            </svg>
          </button>
          
          <button onClick={e => { e.stopPropagation(); togglePlay(); }} className="p-3 group bg-white/10 rounded-full hover:bg-white/20 transition">
            {isPlaying ? (
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white group-hover:text-white transition">
                <rect x="14" y="4" width="4" height="16" rx="2"/>
                <rect x="6" y="4" width="4" height="16" rx="2"/>
              </svg>
            ) : (
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white group-hover:text-white transition">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            )}
          </button>
          
          <button onClick={e => { e.stopPropagation(); handleNext(); }} className="p-2 group" title="Premium Feature - Skip Next">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/80 group-hover:text-white transition">
              <path d="M5 4L15 12L5 20V4Z"/>
              <line x1="19" y1="5" x2="19" y2="19"/>
            </svg>
          </button>
        </div>
        
        {/* Volume Control */}
        <div className="flex items-center justify-center mt-3">
          <div className="relative w-24 h-2 flex items-center group cursor-pointer" onClick={e => { e.stopPropagation(); handleVolumeChange(e); }}>
            <div className="absolute w-full h-1 bg-white/20 rounded-full" />
            <div className="absolute h-1 bg-white/60 rounded-full" style={{ width: `${volume * 100}%` }} />
            <div 
              className="absolute w-3 h-3 bg-white rounded-full shadow-lg transform -translate-y-1 opacity-0 group-hover:opacity-100 transition-opacity" 
              style={{ left: `calc(${volume * 100}% - 6px)` }}
            />
          </div>
        </div>
      </div>

      {/* Premium Popup */}
      {showPremiumPopup && (
        <div className="premium-popup-overlay" onClick={closePremiumPopup}>
          <div className="premium-popup" onClick={(e) => e.stopPropagation()}>
            <div className="premium-header">
              <h2>🎵 Premium Feature</h2>
              <button className="close-btn" onClick={closePremiumPopup}>×</button>
            </div>
            <div className="premium-content">
              <div className="premium-icon">⭐</div>
              <h3>Enhanced Music Controls</h3>
              <p>Like songs and skip tracks with premium controls that give you full control over your music experience.</p>
              
              <div className="premium-price">
                <span className="price">3.14π</span>
                <span className="period">Premium Membership</span>
              </div>
              
              <div className="premium-features">
                <div className="feature">✓ Like and save favorite songs</div>
                <div className="feature">✓ Skip to next/previous tracks</div>
                <div className="feature">✓ Advanced audio controls</div>
                <div className="feature">✓ Create custom playlists</div>
              </div>
              
              <div className="premium-buttons">
                <button className="upgrade-btn">Upgrade to Premium</button>
                <button className="cancel-btn" onClick={closePremiumPopup}>Maybe Later</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
