import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGlobalModal } from '../context/GlobalModalContext.jsx';
import { getLikedSongsSupabase } from '../services/likedSongsSupabase';
import { getCurrentUser } from '../services/userService';

export default function LikedSongsScreen() {
  // ...existing code...
  
  const [likedSongs, setLikedSongs] = useState([]);
  const { t } = useTranslation();
  const { show } = useGlobalModal();
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
  show(t('liked.play_one_demo', { title: song.title }), { type: 'info', autoClose: 2500 });
  };

  const handlePlayAll = () => {
  show(t('liked.play_all_demo'), { type: 'info', autoClose: 2500 });
  };

  return (
    <div className="liked-songs-screen">
      <div className="liked-header">
        <div className="liked-cover">
          <span className="liked-icon">💚</span>
        </div>
        <div className="liked-info">
          <p className="liked-type">{t('liked.playlist_type')}</p>
          <h1 className="liked-title">{t('liked.title')}</h1>
          <p className="liked-count">{t('liked.count', { count: likedSongs.length })}</p>
        </div>
      </div>

      <div className="liked-controls">
        <button className="play-all-btn" onClick={handlePlayAll}>
          <span>▶</span>
          {t('liked.play')}
        </button>
      </div>

      <div className="songs-list">
        {loading ? (
          <div className="loading-message">
            <p>{t('liked.loading')}</p>
          </div>
        ) : !user ? (
          <div className="not-logged-in">
            <p>{t('liked.login_required')}</p>
          </div>
        ) : likedSongs.length === 0 ? (
          <div className="no-liked-songs">
            <p>{t('liked.empty')}</p>
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