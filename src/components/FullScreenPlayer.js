import React, { useState, useEffect } from 'react';
import { usePlayer } from '../contexts/PlayerContext';

export default function FullScreenPlayer() {
  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    volume,
    isShuffle,
    repeatMode,
    isFullScreen,
    togglePlay,
    nextSong,
    previousSong,
    toggleShuffle,
    toggleRepeat,
    seekTo,
    setVolume,
    closeFullScreen
  } = usePlayer();

  const [isDragging, setIsDragging] = useState(false);
  const [showVolume, setShowVolume] = useState(false);

  // Simulate progress when playing
  useEffect(() => {
    let interval;
    if (isPlaying && !isDragging) {
      interval = setInterval(() => {
        seekTo(prev => {
          const newProgress = prev + 1;
          if (newProgress >= duration) {
            if (repeatMode === 'one') {
              return 0;
            } else if (repeatMode === 'all') {
              nextSong();
              return 0;
            } else {
              // Stop playing at end
              return duration;
            }
          }
          return newProgress;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isDragging, duration, repeatMode, nextSong, seekTo]);

  if (!isFullScreen || !currentSong) return null;

  const progressPercentage = (progress / duration) * 100;
  const volumePercentage = volume * 100;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = (clickX / rect.width) * duration;
    seekTo(newProgress);
  };

  const handleVolumeClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newVolume = clickX / rect.width;
    setVolume(Math.max(0, Math.min(1, newVolume)));
  };

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'all': return '🔁';
      case 'one': return '🔂';
      default: return '🔁';
    }
  };

  return (
    <div className="fullscreen-player">
      <div className="player-header">
        <button className="player-back-btn" onClick={closeFullScreen}>
          ⌄
        </button>
        <div className="player-header-info">
          <div className="player-header-title">Now Playing</div>
          <div className="player-header-subtitle">From {currentSong.album || 'Unknown Album'}</div>
        </div>
        <button className="player-menu-btn">⋯</button>
      </div>

      <div className="player-artwork">
        <div className="player-cover">
          <span>{currentSong.cover}</span>
        </div>
      </div>

      <div className="player-info">
        <div className="player-song-title">{currentSong.title}</div>
        <div className="player-song-artist">{currentSong.artist}</div>
      </div>

      <div className="player-progress">
        <div 
          className="progress-bar" 
          onClick={handleProgressClick}
        >
          <div 
            className="progress-fill" 
            style={{ width: `${progressPercentage}%` }}
          />
          <div 
            className="progress-thumb" 
            style={{ left: `${progressPercentage}%` }}
          />
        </div>
        <div className="progress-time">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player-controls">
        <button 
          className={`control-btn ${isShuffle ? 'active' : ''}`}
          onClick={toggleShuffle}
        >
          🔀
        </button>
        <button className="control-btn" onClick={previousSong}>
          ⏮️
        </button>
        <button className="play-btn" onClick={togglePlay}>
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <button className="control-btn" onClick={nextSong}>
          ⏭️
        </button>
        <button 
          className={`control-btn ${repeatMode !== 'off' ? 'active' : ''}`}
          onClick={toggleRepeat}
        >
          {getRepeatIcon()}
        </button>
      </div>

      <div className="player-bottom">
        <button className="bottom-btn">💚</button>
        <div className="volume-control">
          <button 
            className="bottom-btn"
            onClick={() => setShowVolume(!showVolume)}
          >
            🔊
          </button>
          {showVolume && (
            <div className="volume-slider" onClick={handleVolumeClick}>
              <div 
                className="volume-fill" 
                style={{ width: `${volumePercentage}%` }}
              />
            </div>
          )}
        </div>
        <button className="bottom-btn">📱</button>
      </div>
    </div>
  );
}