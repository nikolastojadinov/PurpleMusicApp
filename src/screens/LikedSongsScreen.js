import React, { useState, useEffect } from 'react';
import { getLikedSongsSupabase } from '../services/likedSongsSupabase';
import { getCurrentUser } from '../services/userService';

export default function LikedSongsScreen() {
  // ...existing code...
  
  const [likedSongs, setLikedSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();
  
  useEffect(() => {
    const loadLikedSongs = async () => {
      if (!user || !user.pi_user_uid) {
        setLikedSongs([]);
        setLoading(false);
        return;
      }
      try {
        const songs = await getLikedSongsSupabase();
        setLikedSongs(songs);
      } catch (error) {
        console.error('Error loading liked songs:', error);
      } finally {
        setLoading(false);
      }
    };
    loadLikedSongs();
  }, [user]);

  const handlePlaySong = (song, index) => {
    // Play liked song
    alert('Play: ' + song.title + ' - This will integrate with player later');
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
      </div>

      <div className="songs-list">
        {loading ? (
          <div className="loading-message">
            <p>Loading liked songs...</p>
          </div>
        ) : !user ? (
          <div className="not-logged-in">
            <p>Please log in to see your liked songs</p>
          </div>
        ) : likedSongs.length === 0 ? (
          <div className="no-liked-songs">
            <p>No liked songs yet. Start liking songs from the player!</p>
          </div>
        ) : (
          likedSongs.map((song, index) => (
            <div key={song.track_url} className="song-item" onClick={() => handlePlaySong(song, index)}>
              <div className="song-number">{index + 1}</div>
              <div className="song-cover">
                <img src={song.cover_url} alt={song.title} className="cover-image" />
              </div>
              <div className="song-details">
                <h3 className="song-title">{song.title}</h3>
                <p className="song-artist">{song.artist}</p>
              </div>
              <div className="song-date">
                {song.liked_at ? new Date(song.liked_at).toLocaleDateString() : ''}
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