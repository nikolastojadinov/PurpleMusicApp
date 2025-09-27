import React from 'react';
import ModernAudioPlayer from '../components/ModernAudioPlayer';
import { fetchMusicLibraryCached } from '../services/musicLibrary';
// ...existing code...

export default function HomeScreen() {
  // Supabase songs state
  const [librarySongs, setLibrarySongs] = React.useState([]);
  const [loadingLibrary, setLoadingLibrary] = React.useState(true);
  const [libraryError, setLibraryError] = React.useState(null);

  // Removed static mock sections: use only Supabase songs

  // Load songs from Supabase storage once
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingLibrary(true);
        const songs = await fetchMusicLibraryCached();
        if (cancelled) return;
        // adapt to player expected shape (song.src used in player)
        const adapted = songs.map((s, idx) => ({
          id: `lib-${idx}-${s.title}`,
            title: s.title,
            artist: 'Unknown Artist',
            album: 'Single',
            cover: s.cover,
            src: s.url
        }));
        setLibrarySongs(adapted);
      } catch (e) {
        if (!cancelled) setLibraryError(e.message || 'Greška pri učitavanju pesama');
      } finally {
        if (!cancelled) setLoadingLibrary(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Take first 4 songs (or fewer) and reuse for all three horizontal sections
  const baseFour = librarySongs.slice(0, 4);
  const madeForYouSongs = baseFour;
  const recentlyPlayedSongs = baseFour;
  const trendingNowSongs = baseFour;

  // State za selektovanu pesmu i prikaz playera
  const [selectedSong, setSelectedSong] = React.useState(null);
  const [playerOpen, setPlayerOpen] = React.useState(false);

  // Prikaz playera samo na klik na pesmu
  const handlePlaySong = (song) => {
    setSelectedSong(song);
    setPlayerOpen(true);
  };

  // Zatvaranje playera
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
      </div>

      {/* Made for you section */}
      <section className="home-section">
        <h2 className="section-title">Made for you</h2>
        {loadingLibrary && <div style={{color:'#B3B3B3', fontSize:14}}>Učitavanje...</div>}
        {libraryError && <div style={{color:'#f87171', fontSize:14}}>Greška: {libraryError}</div>}
        {!loadingLibrary && !libraryError && madeForYouSongs.length > 0 && (
          <div className="horizontal-scroll">
            {madeForYouSongs.map(song => (
              <div key={song.id} className="made-item" onClick={() => handlePlaySong(song)}>
                <div className="made-cover" style={{padding:0, overflow:'hidden'}}>
                  <img src={song.cover} alt={song.title} className="w-full h-full object-cover" />
                </div>
                <div className="made-title truncate" style={{maxWidth:160}}>{song.title}</div>
                <div className="made-subtitle truncate" style={{maxWidth:160}}>{song.artist}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recently played section */}
      <section className="home-section">
        <h2 className="section-title">Recently played</h2>
        {loadingLibrary && <div style={{color:'#B3B3B3', fontSize:14}}>Učitavanje...</div>}
        {libraryError && <div style={{color:'#f87171', fontSize:14}}>Greška: {libraryError}</div>}
        {!loadingLibrary && !libraryError && recentlyPlayedSongs.length > 0 && (
          <div className="horizontal-scroll">
            {recentlyPlayedSongs.map(song => (
              <div key={song.id} className="recent-item" onClick={() => handlePlaySong(song)}>
                <div className="recent-cover" style={{padding:0, overflow:'hidden'}}>
                  <img src={song.cover} alt={song.title} className="w-full h-full object-cover" />
                </div>
                <div className="recent-title truncate" style={{maxWidth:140}}>{song.title}</div>
                <div className="made-subtitle truncate" style={{maxWidth:140}}>{song.artist}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Trending now section */}
      <section className="home-section">
        <h2 className="section-title">Trending now</h2>
        {loadingLibrary && <div style={{color:'#B3B3B3', fontSize:14}}>Učitavanje...</div>}
        {libraryError && <div style={{color:'#f87171', fontSize:14}}>Greška: {libraryError}</div>}
        {!loadingLibrary && !libraryError && trendingNowSongs.length > 0 && (
          <div className="horizontal-scroll">
            {trendingNowSongs.map(song => (
              <div key={song.id} className="trending-item" onClick={() => handlePlaySong(song)}>
                <div className="trending-cover" style={{padding:0, overflow:'hidden'}}>
                  <img src={song.cover} alt={song.title} className="w-full h-full object-cover" />
                </div>
                <div className="trending-title truncate" style={{maxWidth:160}}>{song.title}</div>
                <div className="made-subtitle truncate" style={{maxWidth:160}}>{song.artist}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Removed old static Songs list */}

      {/* Player prikaz */}
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
          {/* ModernAudioPlayer sa selektovanom pesmom */}
          <ModernAudioPlayer key={selectedSong.id} song={{
            ...selectedSong,
            src: selectedSong.src || selectedSong.url
          }} />
        </div>
      )}
    </div>
  );
}