import React, { useState, useEffect } from 'react';
import { getLikedSongs, isUserLoggedIn } from '../services/likeService';

export default function LikedSongsScreen() {
  // ...existing code...
  
  const [likedSongs, setLikedSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadLikedSongs = async () => {
      if (!isUserLoggedIn()) {
        setLikedSongs([]);
        setLoading(false);
        return;
      }
      
      try {
        const songs = await getLikedSongs();
        setLikedSongs(songs);
      } catch (error) {
        console.error('Error loading liked songs:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadLikedSongs();
  }, []);

  const handlePlaySong = (song, index) => {
    // Convert liked song back to song format for player
    const songData = {
      id: song.song_id,
      title: song.song_title,
      artist: song.song_artist,
      cover: song.song_cover,
      src: song.song_src
    };
    alert('Play: ' + song.song_title + ' - This will integrate with player later');
  };

  const handlePlayAll = () => {
    alert('Play all liked songs');
  };

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
        <button className="play-all-btn" onClick={handlePlayAll}>
          <span>▶</span>
          Play
        </button>
        <button className="shuffle-btn">
          🔀
        </button>
      </div>

      <div className="songs-list">
        {loading ? (
          <div className="loading-message">
            <p>Loading liked songs...</p>
          </div>
        ) : !isUserLoggedIn() ? (
          <div className="not-logged-in">
            <p>Please log in to see your liked songs</p>
          </div>
        ) : likedSongs.length === 0 ? (
          <div className="no-liked-songs">
            <p>No liked songs yet. Start liking songs from the player!</p>
          </div>
        ) : (
          likedSongs.map((song, index) => (
            <div key={song.id} className="song-item" onClick={() => handlePlaySong(song, index)}>
              <div className="song-number">{index + 1}</div>
              <div className="song-cover">
                <img src={song.song_cover} alt={song.song_title} className="cover-image" />
              </div>
              <div className="song-details">
                <h3 className="song-title">{song.song_title}</h3>
                <p className="song-artist">{song.song_artist}</p>
              </div>
              <div className="song-date">
                {new Date(song.created_at).toLocaleDateString()}
              </div>
              <button 
                className="song-menu"
                onClick={(e) => e.stopPropagation()}
              >
                ❤️
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}