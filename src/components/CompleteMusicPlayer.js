import React, { useState, useRef, useEffect } from 'react';
import { usePlayer } from '../contexts/PlayerContext';

export default function CompleteMusicPlayer() {
  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    volume,
    togglePlay,
    nextSong,
    previousSong,
    seekTo,
    setVolume
  } = usePlayer();

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ y: 0 });
  const [position, setPosition] = useState({ y: 0 });
  const [isProgressDragging, setIsProgressDragging] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const playerRef = useRef(null);
  const progressRef = useRef(null);

  // Handle vertical dragging with Pointer Events
  const onPointerDown = (e) => {
    if (!e.target.closest('.drag-handle')) return;
    e.preventDefault();
    playerRef.current.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDragStart({ y: e.clientY - position.y });
  };

  const onPointerMove = (e) => {
    if (!playerRef.current?.hasPointerCapture(e.pointerId)) return;
    const newY = e.clientY - dragStart.y;
    const maxY = window.innerHeight - 300; // Keep player visible
    const minY = -100; // Allow some negative offset
    setPosition({
      y: Math.max(minY, Math.min(maxY, newY))
    });
  };

  const onPointerUp = (e) => {
    if (playerRef.current?.hasPointerCapture(e.pointerId)) {
      playerRef.current.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
  };

  // Progress bar handling
  const handleProgressClick = (e) => {
    if (duration > 0) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newProgress = (clickX / rect.width) * duration;
      seekTo(newProgress);
    }
  };

  const handleProgressMouseDown = (e) => {
    if (duration > 0) {
      setIsProgressDragging(true);
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newProgress = (clickX / rect.width) * duration;
      seekTo(newProgress);
    }
  };

  const handleProgressTouchStart = (e) => {
    if (duration > 0) {
      setIsProgressDragging(true);
      const rect = progressRef.current.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      const newProgress = (touchX / rect.width) * duration;
      seekTo(newProgress);
    }
  };

  useEffect(() => {
    const handleProgressMouseMove = (e) => {
      if (isProgressDragging && progressRef.current && duration > 0) {
        const rect = progressRef.current.getBoundingClientRect();
        const moveX = e.clientX - rect.left;
        const clampedX = Math.max(0, Math.min(rect.width, moveX));
        const newProgress = (clampedX / rect.width) * duration;
        seekTo(newProgress);
      }
    };

    const handleProgressTouchMove = (e) => {
      if (isProgressDragging && progressRef.current && duration > 0) {
        e.preventDefault();
        const rect = progressRef.current.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        const clampedX = Math.max(0, Math.min(rect.width, touchX));
        const newProgress = (clampedX / rect.width) * duration;
        seekTo(newProgress);
      }
    };

    const handleProgressEnd = () => {
      setIsProgressDragging(false);
    };

    if (isProgressDragging) {
      document.addEventListener('mousemove', handleProgressMouseMove);
      document.addEventListener('mouseup', handleProgressEnd);
      document.addEventListener('touchmove', handleProgressTouchMove, { passive: false });
      document.addEventListener('touchend', handleProgressEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleProgressMouseMove);
      document.removeEventListener('mouseup', handleProgressEnd);
      document.removeEventListener('touchmove', handleProgressTouchMove);
      document.removeEventListener('touchend', handleProgressEnd);
    };
  }, [isProgressDragging, duration, seekTo]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show placeholder when no song is playing
  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;
  const displaySong = currentSong || {
    title: 'No song playing',
    artist: 'Select a song to play',
    cover: '🎵'
  };

  // Always show player

  return (
    <div
      ref={playerRef}
      className="fixed bottom-20 left-4 right-4 z-50"
      style={{
        transform: `translateY(${position.y}px)`,
        backgroundColor: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(12px)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      {/* Drag Handle - Touch optimized */}
      <div
        className="drag-handle h-8 bg-gradient-to-r from-purple-500/40 to-yellow-500/40 cursor-grab active:cursor-grabbing rounded-t-lg flex items-center justify-center touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-yellow-500 rounded-full" />
      </div>
      
      {/* Main Player Container */}
      <div className="bg-black/85 backdrop-blur-xl border-t border-white/10 shadow-2xl rounded-lg">
        
        {/* Progress Bar - Top of player */}
        <div className="px-6 pt-2">
          <div
            ref={progressRef}
            className="w-full h-1 bg-white/20 rounded-full cursor-pointer relative group"
            onClick={handleProgressClick}
            onMouseDown={handleProgressMouseDown}
            onTouchStart={handleProgressTouchStart}
          >
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-yellow-500 rounded-full relative transition-all duration-200"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-lg transition-opacity" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex items-center justify-between p-4 gap-4">
          
          {/* Song Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-yellow-500 rounded-xl flex items-center justify-center text-lg font-bold shadow-lg flex-shrink-0">
              {displaySong.cover}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white font-medium text-sm truncate">
                {displaySong.title}
              </div>
              <div className="text-gray-400 text-xs truncate">
                {displaySong.artist}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6">
            
            {/* Previous */}
            <button
              onClick={previousSong}
              disabled={!currentSong}
              className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white disabled:text-white/30 transition-colors hover:scale-110 transform duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 16.811c0 .864-.933 1.406-1.683.977l-7.108-4.061a1.125 1.125 0 010-1.954l7.108-4.061A1.125 1.125 0 0121 8.688v8.123zM11.25 16.811c0 .864-.933 1.406-1.683.977l-7.108-4.061a1.125 1.125 0 010-1.954L9.567 7.712a1.125 1.125 0 011.683.977v8.122z" />
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              disabled={!currentSong}
              className="w-12 h-12 flex items-center justify-center border-2 border-white/40 hover:border-white/70 disabled:border-white/20 rounded-full text-white transition-all hover:scale-105 transform duration-200 disabled:text-white/30"
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                </svg>
              ) : (
                <svg className="w-6 h-6 ml-0.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                </svg>
              )}
            </button>

            {/* Next */}
            <button
              onClick={nextSong}
              disabled={!currentSong}
              className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white disabled:text-white/30 transition-colors hover:scale-110 transform duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z" />
              </svg>
            </button>
          </div>

          {/* Right Side - Time & Volume */}
          <div className="flex items-center gap-4 flex-shrink-0">
            
            {/* Time Display */}
            <div className="text-xs text-gray-400 font-mono min-w-fit">
              {formatTime(progress)} / {formatTime(duration)}
            </div>

            {/* Volume Control */}
            <div className="relative">
              <button
                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  {volume > 0.5 ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.59-.71-1.59-1.59V9.75c0-.88.71-1.59 1.59-1.59h2.24z" />
                  ) : volume > 0 ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25a5.25 5.25 0 010 7.5M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.59-.71-1.59-1.59V9.75c0-.88.71-1.59 1.59-1.59h2.24z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.59-.71-1.59-1.59V9.75c0-.88.71-1.59 1.59-1.59h2.24z" />
                  )}
                </svg>
              </button>
              
              {/* Volume Slider */}
              {showVolumeSlider && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-lg border border-white/10 rounded-lg p-3 w-32">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #8B5CF6 0%, #F59E0B ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%, rgba(255,255,255,0.2) 100%)`
                    }}
                  />
                  <div className="text-xs text-center text-gray-400 mt-1">
                    {Math.round(volume * 100)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}