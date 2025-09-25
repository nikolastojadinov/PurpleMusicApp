import React from 'react';

export default function PlaylistsScreen() {
  const playlists = [
    {
      id: 1,
      name: 'My Playlist #1',
      songCount: 23,
      cover: '🎶',
      lastUpdated: '2 days ago'
    },
    {
      id: 2,
      name: 'Chill Vibes',
      songCount: 45,
      cover: '😌',
      lastUpdated: '1 week ago'
    },
    {
      id: 3,
      name: 'Workout Mix',
      songCount: 32,
      cover: '💪',
      lastUpdated: '3 days ago'
    },
    {
      id: 4,
      name: 'Road Trip',
      songCount: 67,
      cover: '🚗',
      lastUpdated: '5 days ago'
    },
    {
      id: 5,
      name: 'Late Night',
      songCount: 28,
      cover: '🌙',
      lastUpdated: '1 day ago'
    }
  ];

  return (
    <div className="playlists-screen">
      <div className="playlists-header">
        <h1 className="screen-title">My Playlists</h1>
        <button className="create-playlist-btn">
          <span>+</span>
          Create Playlist
        </button>
      </div>

      <div className="quick-access">
        <div className="quick-item liked-songs">
          <span className="quick-icon">💚</span>
          <span className="quick-text">Liked Songs</span>
        </div>
        <div className="quick-item downloaded">
          <span className="quick-icon">⬇️</span>
          <span className="quick-text">Downloaded</span>
        </div>
      </div>

      <div className="playlists-list">
        <h2 className="section-title">Made by you</h2>
        {playlists.map((playlist) => (
          <div key={playlist.id} className="playlist-item">
            <div className="playlist-cover">
              <span>{playlist.cover}</span>
            </div>
            <div className="playlist-details">
              <h3 className="playlist-name">{playlist.name}</h3>
              <p className="playlist-info">{playlist.songCount} songs • {playlist.lastUpdated}</p>
            </div>
            <button className="playlist-menu">⋯</button>
          </div>
        ))}
      </div>
    </div>
  );
}