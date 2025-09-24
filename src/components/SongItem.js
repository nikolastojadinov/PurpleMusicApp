import React from 'react';

export default function SongItem({ song, onPress }) {
  return (
    <div className="song-item" onClick={onPress}>
      <div className="song-cover">
        <span>{song.cover}</span>
      </div>
      
      <div className="song-text">
        <div className="song-title">
          {song.title}
        </div>
        <div className="song-artist">
          {song.artist}
        </div>
      </div>
      
      <div className="song-play-indicator">
        <span className="song-play-icon">▶</span>
      </div>
    </div>
  );
}