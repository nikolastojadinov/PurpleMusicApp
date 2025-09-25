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
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Modern Player Container - matching the design */}
      <div className="bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-4 shadow-2xl">
        
        {/* Main Player Row */}
        <div className="flex items-center space-x-4">
          
          {/* Playback Controls - Left */}
          <div className="flex items-center space-x-3">
            <button
              onClick={previousSong}
              disabled={!currentSong}
              className="text-white/80 hover:text-white transition-colors disabled:text-white/30"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>
            
            <button
              onClick={togglePlay}
              disabled={!currentSong}
              className="text-white hover:text-white/80 transition-colors disabled:text-white/30"
            >
              {isPlaying ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
            
            <button
              onClick={nextSong}
              disabled={!currentSong}
              className="text-white/80 hover:text-white transition-colors disabled:text-white/30"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
          </div>

          {/* Album Cover */}
          <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center text-xl overflow-hidden flex-shrink-0">
            {displaySong.cover && displaySong.cover !== '🎵' ? (
              <span>{displaySong.cover}</span>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-500 to-amber-700 rounded-lg"></div>
            )}
          </div>

          {/* Song Info - Center */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white text-base font-medium truncate">
              {displaySong.title}
            </h3>
            <p className="text-gray-400 text-sm truncate">
              {displaySong.artist}
            </p>
          </div>

          {/* Volume Controls - Right */}
          <div className="relative">
            <button
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
            </button>
            
            {showVolumeSlider && (
              <div className="absolute bottom-full right-0 mb-2 bg-gray-800/90 backdrop-blur-xl rounded-lg p-3 border border-gray-700/50">
                <div className="h-20 w-1 bg-white/20 rounded-full relative">
                  <div 
                    className="absolute bottom-0 w-full bg-white rounded-full transition-all duration-200"
                    style={{ height: `${volume * 100}%` }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar Row */}
        <div className="flex items-center space-x-3 mt-4">
          <span className="text-gray-400 text-xs font-medium w-8 text-left">
            {formatTime(progress)}
          </span>
          
          <div className="flex-1">
            <div
              ref={progressRef}
              className="w-full h-1 bg-gray-600 rounded-full cursor-pointer relative group"
              onClick={handleProgressClick}
              onMouseDown={handleProgressMouseDown}
              onTouchStart={handleProgressTouchStart}
            >
              <div 
                className="h-full bg-white rounded-full transition-all duration-200"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          
          <span className="text-gray-400 text-xs font-medium w-8 text-right">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}