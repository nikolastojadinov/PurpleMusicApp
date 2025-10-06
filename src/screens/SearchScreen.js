import React, { useState, useEffect, useRef } from 'react';
import { loadMusicLibrary } from '../services/libraryLoader';
import ModernAudioPlayer from '../components/ModernAudioPlayer';
import { fetchMusic } from '../services/musicService';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [songs, setSongs] = useState([]); // local library for trending suggestions
  const [loading, setLoading] = useState(true); // initial library load
  const [searching, setSearching] = useState(false); // dynamic search loading
  const [results, setResults] = useState([]); // unified search results (remote or local fallback)
  const [searchPerformed, setSearchPerformed] = useState(false); // track if search attempted
  const activeQueryRef = useRef('');
  const debounceRef = useRef(null);
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

  // Handle dynamic API search on submit
  async function executeSearch(q) {
    if (!q || q.trim().length < 2) {
      setResults([]);
      setSearchPerformed(false);
      return;
    }
    const query = q.trim();
    activeQueryRef.current = query;
    setSearching(true);
    setSearchPerformed(true);
    try {
      const tracks = await fetchMusic(query);
      if (activeQueryRef.current !== query) return; // stale
      let mapped = (tracks || []).map(t => ({
        id: t.id,
        title: t.title || 'Untitled',
        artist: t.author || 'Unknown',
        url: t.preview || t.url || '',
        cover: '/fallback-cover.png',
        source: t.source
      }));
      if (mapped.length > 0) {
        console.log('[MusicAPI] Results source:', mapped[0].source === 'pixabay' ? 'Pixabay' : mapped[0].source === 'freesound' ? 'FreeSound' : mapped[0].source);
        setResults(mapped);
      } else {
        // Local fallback (filter existing library)
        const localMatches = songs.filter(s => s.title.toLowerCase().includes(query.toLowerCase()) || s.artist.toLowerCase().includes(query.toLowerCase()))
          .map(s => ({ ...s, source: 'local' }));
        if (localMatches.length > 0) {
          console.log('[MusicAPI] Using local library fallback');
          setResults(localMatches);
        } else {
          console.log('[MusicAPI] No tracks found for', query);
          setResults([]);
        }
      }
    } catch (e) {
      console.error('Search failed:', e);
      // Last resort local fallback if error
      const query = q.trim();
      const localMatches = songs.filter(s => s.title.toLowerCase().includes(query.toLowerCase()) || s.artist.toLowerCase().includes(query.toLowerCase()))
        .map(s => ({ ...s, source: 'local' }));
      if (localMatches.length > 0) {
        console.log('[MusicAPI] Remote error, using local library fallback');
        setResults(localMatches);
      } else {
        setResults([]);
      }
    } finally {
      setSearching(false);
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  // Debounced auto-search on input change (user does not have to press Enter)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      executeSearch(searchQuery);
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

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
      <form onSubmit={handleSubmit} className="search-input-container" role="search">
        <input
          type="text"
          className="search-input"
            placeholder="Search music (Pixabay / FreeSound)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search for tracks"
        />
        <button type="submit" aria-label="Search" style={{display:'none'}}>Search</button>
        <span className="search-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </span>
      </form>

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

      {searchQuery.trim().length >= 2 && (
        <div className="search-results">
          <p className="search-results-text">Search results for "{searchQuery}"</p>
          {searching ? (
            <div style={{color:'#888', fontSize:12, marginTop:20}}>Searching…</div>
          ) : results.length > 0 ? (
            <div className="songs-list-vertical" style={{marginTop: 20}}>
              {results.map((song) => (
                <div key={song.id} className="song-item-search" onClick={() => handlePlaySong(song)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handlePlaySong(song); }}>
                  <div className="song-thumbnail">
                    <img src={song.cover || '/fallback-cover.png'} alt={song.title} loading="lazy" />
                  </div>
                  <div className="song-info">
                    <div className="song-title">{song.title}</div>
                    <div className="song-artist">{song.artist}</div>
                    {song.source && <div style={{fontSize:10, opacity:.5, marginTop:2}}>Source: {song.source}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <span className="no-results-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </span>
              <p>No tracks found</p>
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