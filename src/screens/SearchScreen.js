import React, { useState, useEffect } from 'react';
import { loadMusicLibrary } from '../services/libraryLoader';
import ModernAudioPlayer from '../components/ModernAudioPlayer';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSong, setSelectedSong] = useState(null);
  const [playerOpen, setPlayerOpen] = useState(false);

  useEffect(() => {
    const loadSongs = async () => {
      try {
        setLoading(true);
        const songList = await loadMusicLibrary();
        setSongs(songList);
      } catch (error) {
        console.error('Error loading songs:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSongs();
  }, []);

  // Filter songs based on search query (show results after 2+ characters)
  const filteredSongs = searchQuery.length >= 2 
    ? songs.filter(song => 
        song.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handlePlaySong = (song) => {
    setSelectedSong(song);
    setPlayerOpen(true);
  };

  const handleClosePlayer = () => {
    setPlayerOpen(false);
    setSelectedSong(null);
  };

  const recentSearches = [
    'Rock',
    'Pop',
    'Jazz',
    'Electronic',
    'Classical'
  ];

  const trendingSearches = songs.slice(0, 5).map(song => song.title);

  return (
    <div className="search-screen">
      <div className="search-input-container">
        <input
          type="text"
          className="search-input"
          placeholder="Artists, songs, or podcasts"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <span className="search-icon">🔍</span>
      </div>

      {!searchQuery && (
        <>
          <section className="search-section">
            <h2 className="section-title">Recent searches</h2>
            <div className="search-list">
              {recentSearches.map((search, index) => (
                <div key={index} className="search-item">
                  <span className="search-text">{search}</span>
                  <span className="search-close">✕</span>
                </div>
              ))}
            </div>
          </section>

          <section className="search-section">
            <h2 className="section-title">Trending searches</h2>
            <div className="search-list">
              {trendingSearches.map((search, index) => (
                <div key={index} className="search-item">
                  <span className="trending-icon">📈</span>
                  <span className="search-text">{search}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {searchQuery.length >= 2 && (
        <div className="search-results">
          <p className="search-results-text">Search results for "{searchQuery}"</p>
          {loading ? (
            <div style={{color:'#888', fontSize:12, marginTop:20}}>Loading songs...</div>
          ) : filteredSongs.length > 0 ? (
            <div className="songs-grid" style={{marginTop: 20}}>
              {filteredSongs.map((song, idx) => (
                <div key={idx} className="song-card" onClick={() => handlePlaySong(song)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handlePlaySong(song); }}>
                  <div className="song-card-cover">
                    <img src={song.cover || '/fallback-cover.png'} alt={song.title} loading="lazy" />
                  </div>
                  <div className="song-card-title" title={song.title}>{song.title}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <span className="no-results-icon">🔍</span>
              <p>No results found</p>
            </div>
          )}
        </div>
      )}

      {playerOpen && selectedSong && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 80, zIndex: 1000 }}>
          <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 1100 }}>
            <button
              style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 20, cursor: 'pointer' }}
              onClick={handleClosePlayer}
              aria-label="Close player"
            >
              ×
            </button>
          </div>
          <ModernAudioPlayer key={selectedSong.title} autoPlay song={{
            ...selectedSong,
            src: selectedSong.url
          }} />
        </div>
      )}
    </div>
  );
}