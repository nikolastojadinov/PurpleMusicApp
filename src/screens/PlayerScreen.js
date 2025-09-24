import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function PlayerScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { song } = location.state || { song: { title: 'Unknown', artist: 'Unknown', cover: '🎵' } };
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(45);
  const [duration] = useState(180);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = Math.min(Math.max((currentTime / duration) * 100, 0), 100);

  return (
    <div className="player-container">
      <div className="header">
        <button className="header-back" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h2 className="header-subtitle">Now Playing</h2>
        <div></div>
      </div>

      <div className="player-cover-section">
        <div className="player-cover">
          <span>{song.cover}</span>
        </div>
      </div>

      <div className="player-info">
        <h1 className="player-title">{song.title}</h1>
        <p className="player-artist">{song.artist}</p>
      </div>

      <div className="player-progress">
        <div className="progress-bar">
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
          <span className="time-text">{formatTime(currentTime)}</span>
          <span className="time-text">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player-controls">
        <button className="control-button">
          ⏮
        </button>

        <button className="play-button" onClick={togglePlayPause}>
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button className="control-button">
          ⏭
        </button>
      </div>

      <div className="player-bottom">
        <button className="icon-button">
          🔀
        </button>
        <button className="icon-button">
          🔁
        </button>
        <button className="icon-button">
          🤍
        </button>
      </div>
    </div>
  );
}