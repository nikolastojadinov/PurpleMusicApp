import React from 'react';
import { usePlayer } from '../contexts/PlayerContext';

export default function MiniPlayer() {
  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    togglePlay,
    nextSong,
    openFullScreen
  } = usePlayer();

  if (!currentSong) return null;

  const progressPercentage = (progress / duration) * 100;
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mini-player" onClick={openFullScreen}>
      <div className="mini-progress-bar">
        <div 
          className="mini-progress-fill" 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      <div className="mini-player-content">
        <div className="mini-song-info">
          <div className="mini-song-cover">
            <span>{currentSong.cover}</span>
          </div>
          <div className="mini-song-details">
            <div className="mini-song-title">{currentSong.title}</div>
            <div className="mini-song-artist">{currentSong.artist}</div>
          </div>
        </div>

        <div className="mini-player-controls">
          <button 
            className="mini-control-btn"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <button 
            className="mini-control-btn"
            onClick={(e) => {
              e.stopPropagation();
              nextSong();
            }}
          >
            ⏭️
          </button>
        </div>
      </div>
    </div>
  );
}