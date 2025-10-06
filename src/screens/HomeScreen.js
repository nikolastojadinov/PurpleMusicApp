import React from 'react';
import AppVisualPreview from '../components/AppVisualPreview';
import { useNavigate } from 'react-router-dom';
import ModernAudioPlayer from '../components/ModernAudioPlayer';
import { loadMusicLibrary } from '../services/libraryLoader';
// Dinamičko učitavanje (mp3 + png) parova iz Supabase Storage-a.

export default function HomeScreen() {
  const navigate = useNavigate();
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

  const handlePlaySong = (song) => {
    setSelectedSong(song);
    setPlayerOpen(true);
  };

  const handleClosePlayer = () => {
    setPlayerOpen(false);
    setSelectedSong(null);
  };

  const [showPreview, setShowPreview] = React.useState(()=>{
    try { return !localStorage.getItem('pm_hide_preview'); } catch { return true; }
  });
  const closePreview = () => {
    setShowPreview(false);
    try { localStorage.setItem('pm_hide_preview','1'); } catch {}
  };

  return (
    <div className="home-screen" style={{position:'relative'}}>
      <div className="search-bar-container">
        <div className="search-bar" onClick={() => navigate('/search')} style={{cursor: 'pointer'}}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Artists, songs, or podcasts"
            className="search-input"
            onClick={() => navigate('/search')}
            style={{cursor: 'pointer'}}
            readOnly
          />
        </div>
      </div>

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
        <ModernAudioPlayer 
          key={selectedSong.title} 
          autoPlay 
          onClose={handleClosePlayer}
          song={{
            ...selectedSong,
            src: selectedSong.url
          }} 
        />
      )}
      {showPreview && !loading && !error && (
        <AppVisualPreview onClose={closePreview} />
      )}
    </div>
  );
}