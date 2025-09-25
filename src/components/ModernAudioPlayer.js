import React, { useState, useRef, useEffect } from 'react';
import { usePlayer } from '../contexts/PlayerContext';

export default function ModernAudioPlayer() {
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
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVolumeVisible, setIsVolumeVisible] = useState(false);
  const playerRef = useRef(null);
  const progressRef = useRef(null);

  // Handle dragging
  const handleMouseDown = (e) => {
    if (e.target.classList.contains('draggable-area')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // Progress bar handling
  const handleProgressClick = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = (clickX / rect.width) * duration;
    seekTo(newProgress);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentSong) return null;

  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div
      ref={playerRef}
      className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 select-none"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      {/* Main Player Container */}
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Draggable Area */}
        <div className="draggable-area h-2 bg-gradient-to-r from-purple-500/20 to-yellow-500/20 cursor-grab active:cursor-grabbing" />
        
        {/* Player Content */}
        <div className="p-4">
          
          {/* Song Info */}
          <div className="flex items-center mb-4 space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-yellow-500 rounded-xl flex items-center justify-center text-lg font-bold shadow-lg">
              {currentSong.cover}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-medium text-sm truncate">
                {currentSong.title}
              </div>
              <div className="text-gray-400 text-xs truncate">
                {currentSong.artist}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div
              ref={progressRef}
              className="w-full h-1 bg-white/20 rounded-full cursor-pointer relative group"
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-yellow-500 rounded-full relative"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-lg transition-opacity" />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            
            {/* Left Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={previousSong}
                className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors hover:scale-110 transform duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={togglePlay}
                className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-105 transform duration-200"
              >
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a2 2 0 011.414.586L14.828 13.414a2 2 0 01.586 1.414V16M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1" />
                  </svg>
                )}
              </button>
              
              <button
                onClick={nextSong}
                className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors hover:scale-110 transform duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Right Controls */}
            <div className="relative">
              <button
                onClick={() => setIsVolumeVisible(!isVolumeVisible)}
                className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M6 10H4a2 2 0 00-2 2v0a2 2 0 002 2h2l4 4V6l-4 4z" />
                </svg>
              </button>
              
              {/* Volume Slider */}
              {isVolumeVisible && (
                <div className="absolute bottom-10 right-0 bg-black/90 backdrop-blur-lg border border-white/10 rounded-lg p-3 w-32">
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