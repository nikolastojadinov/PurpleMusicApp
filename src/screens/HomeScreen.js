import React from 'react';
import ModernAudioPlayer from '../components/ModernAudioPlayer';
import { loadMusicLibrary } from '../services/libraryLoader';
// Dinamičko učitavanje (mp3 + png) parova iz Supabase Storage-a.

export default function HomeScreen() {
  const [songs, setSongs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const list = await loadMusicLibrary();
        if (active) setSongs(list);
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Helper function to shuffle array and get random subset
  const getRandomSongs = (songsArray, count = 10) => {
    if (songsArray.length === 0) return [];
    const shuffled = [...songsArray].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  };

  // Create different random sets for each category - 10 songs each
  const madeForYouSongs = getRandomSongs(songs, 10);
  const recentlyPlayedSongs = getRandomSongs(songs, 10);
  const trendingNowSongs = getRandomSongs(songs, 10);

  const [selectedSong, setSelectedSong] = React.useState(null);
  const [playerOpen, setPlayerOpen] = React.useState(false);
  const [showDebug, setShowDebug] = React.useState(false);

  const handlePlaySong = (song) => {
    setSelectedSong(song);
    setPlayerOpen(true);
  };

  const handleClosePlayer = () => {
    setPlayerOpen(false);
    setSelectedSong(null);
  };

  return (
    <div className="home-screen">
      <div className="search-bar-container">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Artists, songs, or podcasts"
            className="search-input"
            readOnly
          />
        </div>
        {songs.length > 0 && (
          <button onClick={() => setShowDebug(d => !d)} style={{marginTop:12, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', color:'#fff', padding:'6px 12px', borderRadius:6, cursor:'pointer', fontSize:12}}>
            {showDebug ? 'Hide debug' : 'Show debug'}
          </button>
        )}
      </div>

      {showDebug && (
        <pre style={{maxHeight:240, overflow:'auto', fontSize:10, background:'rgba(255,255,255,0.05)', padding:12, borderRadius:8, marginBottom:20}}>
{JSON.stringify({ count: songs.length, songs, loading, error }, null, 2)}
        </pre>
      )}

      {loading && (
        <div style={{color:'#888', fontSize:12, marginBottom:20}}>Loading songs...</div>
      )}
      {error && (
        <div style={{color:'#ff5555', fontSize:12, marginBottom:20}}>Error: {error}</div>
      )}

      {/* Made for you section */}
      <section className="home-section">
        <h2 className="section-title">Made for you</h2>
        <div className="songs-slider">
          {madeForYouSongs.map((song, idx) => (
            <div key={idx} className="song-card-slider" onClick={() => handlePlaySong(song)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handlePlaySong(song); }}>
              <div className="song-card-cover-slider">
                <img src={song.cover} alt={song.title} loading="lazy" />
              </div>
              <div className="song-card-title-slider" title={song.title}>{song.title}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Recently played section */}
      <section className="home-section">
        <h2 className="section-title">Recently played</h2>
        <div className="songs-slider">
          {recentlyPlayedSongs.map((song, idx) => (
            <div key={idx} className="song-card-slider" onClick={() => handlePlaySong(song)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handlePlaySong(song); }}>
              <div className="song-card-cover-slider">
                <img src={song.cover} alt={song.title} loading="lazy" />
              </div>
              <div className="song-card-title-slider" title={song.title}>{song.title}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Trending now section */}
      <section className="home-section">
        <h2 className="section-title">Trending now</h2>
        <div className="songs-slider">
          {trendingNowSongs.map((song, idx) => (
            <div key={idx} className="song-card-slider" onClick={() => handlePlaySong(song)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handlePlaySong(song); }}>
              <div className="song-card-cover-slider">
                <img src={song.cover} alt={song.title} loading="lazy" />
              </div>
              <div className="song-card-title-slider" title={song.title}>{song.title}</div>
            </div>
          ))}
        </div>
      </section>

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