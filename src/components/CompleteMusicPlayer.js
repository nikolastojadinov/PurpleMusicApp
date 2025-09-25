import React from 'react';
import { usePlayer } from '../contexts/PlayerContext';

export default function CompleteMusicPlayer() {
  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    togglePlay,
    nextSong,
    previousSong,
    seekTo
  } = usePlayer();

  // Time formatting
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't show player if no song is selected
  if (!currentSong) {
    return null;
  }

  return (
    <div style={{ padding: '10px', backgroundColor: '#1a1a1a', borderTop: '1px solid #333' }}>
      
      {/* Song Info */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '20px', marginRight: '10px' }}>{currentSong.cover}</span>
        <div>
          <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>
            {currentSong.title}
          </div>
          <div style={{ color: '#888', fontSize: '12px' }}>
            {currentSong.artist}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <input
        type="range"
        min="0"
        max={duration}
        value={progress}
        onChange={(e) => seekTo(parseFloat(e.target.value))}
        style={{ width: '100%', marginBottom: '10px' }}
      />

      {/* Controls and Time */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={previousSong} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
            ⏮️
          </button>
          
          <button onClick={togglePlay} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '20px' }}>
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          
          <button onClick={nextSong} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
            ⏭️
          </button>
        </div>

        {/* Time */}
        <div style={{ color: '#888', fontSize: '12px' }}>
          {formatTime(progress)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );
}