import React from 'react';

export default function LikedSongsScreen() {
  const likedSongs = [
    {
      id: 1,
      title: 'Anti-Hero',
      artist: 'Taylor Swift',
      album: 'Midnights',
      duration: '3:20',
      cover: '💚'
    },
    {
      id: 2,
      title: 'Flowers',
      artist: 'Miley Cyrus',
      album: 'Endless Summer Vacation',
      duration: '3:21',
      cover: '🌸'
    },
    {
      id: 3,
      title: 'As It Was',
      artist: 'Harry Styles',
      album: 'Harry\'s House',
      duration: '2:47',
      cover: '🎵'
    },
    {
      id: 4,
      title: 'unholy',
      artist: 'Sam Smith (feat. Kim Petras)',
      album: 'Gloria',
      duration: '2:36',
      cover: '🖤'
    },
    {
      id: 5,
      title: 'Shivers',
      artist: 'Ed Sheeran',
      album: '=',
      duration: '3:27',
      cover: '❄️'
    }
  ];

  return (
    <div className="liked-songs-screen">
      <div className="liked-header">
        <div className="liked-cover">
          <span className="liked-icon">💚</span>
        </div>
        <div className="liked-info">
          <p className="liked-type">Playlist</p>
          <h1 className="liked-title">Liked Songs</h1>
          <p className="liked-count">{likedSongs.length} songs</p>
        </div>
      </div>

      <div className="liked-controls">
        <button className="play-all-btn">
          <span>▶</span>
          Play
        </button>
        <button className="shuffle-btn">
          🔀
        </button>
      </div>

      <div className="songs-list">
        {likedSongs.map((song, index) => (
          <div key={song.id} className="song-item">
            <div className="song-number">{index + 1}</div>
            <div className="song-cover">
              <span>{song.cover}</span>
            </div>
            <div className="song-details">
              <h3 className="song-title">{song.title}</h3>
              <p className="song-artist">{song.artist}</p>
            </div>
            <div className="song-duration">{song.duration}</div>
            <button className="song-menu">⋯</button>
          </div>
        ))}
      </div>
    </div>
  );
}