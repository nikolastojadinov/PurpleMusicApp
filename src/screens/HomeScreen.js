import React from 'react';
import ModernAudioPlayer from '../components/ModernAudioPlayer';
import { fetchMusicLibraryCached } from '../services/musicLibrary';
// ...existing code...

export default function HomeScreen() {
  // ...existing code...
  const [librarySongs, setLibrarySongs] = React.useState([]);
  const [loadingLibrary, setLoadingLibrary] = React.useState(true);
  const [libraryError, setLibraryError] = React.useState(null);

  const recentlyPlayed = [
    { id: 1, title: 'Liked Songs', type: 'playlist', cover: '💚' },
    { id: 2, title: 'Chill Mix', type: 'playlist', cover: '😌' },
    { id: 3, title: 'Discover Weekly', type: 'playlist', cover: '🔥' },
    { id: 4, title: 'Release Radar', type: 'playlist', cover: '📡' },
    { id: 5, title: 'Daily Mix 1', type: 'playlist', cover: '🎵' },
    { id: 6, title: 'Pop Mix', type: 'playlist', cover: '🎤' }
  ];

  const madeForYou = [
    { id: 1, title: 'Discover Weekly', subtitle: 'Your weekly mixtape of fresh music', cover: '🔍' },
    { id: 2, title: 'Release Radar', subtitle: 'Catch all the latest music', cover: '📡' },
    { id: 3, title: 'Daily Mix 1', subtitle: 'Taylor Swift, Olivia Rodrigo and more', cover: '🎵' },
    { id: 4, title: 'Daily Mix 2', subtitle: 'The Weeknd, Dua Lipa and more', cover: '🎶' }
  ];

  const trendingNow = [
    { id: 1, title: 'Today\'s Top Hits', subtitle: 'Dua Lipa is on top of the Hottest 50!', cover: '🔥' },
    { id: 2, title: 'RapCaviar', subtitle: 'New music from Drake, Travis Scott and more', cover: '🎤' },
    { id: 3, title: 'Global Top 50', subtitle: 'Your daily update of the most played tracks', cover: '🌍' },
    { id: 4, title: 'Viral 50', subtitle: 'The most viral tracks right now', cover: '📈' }
  ];

  const sampleSongs = [
    { id: 1, title: 'Blinding Lights', artist: 'The Weeknd', cover: '🌟', album: 'After Hours' },
    { id: 2, title: 'Watermelon Sugar', artist: 'Harry Styles', cover: '🍉', album: 'Fine Line' },
    { id: 3, title: 'Levitating', artist: 'Dua Lipa', cover: '✨', album: 'Future Nostalgia' },
    { id: 4, title: 'Good 4 U', artist: 'Olivia Rodrigo', cover: '💜', album: 'SOUR' },
    { id: 5, title: 'Stay', artist: 'The Kid LAROI & Justin Bieber', cover: '🎵', album: 'F*CK LOVE 3: OVER YOU' }
  ];

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

      {/* Supabase Library Section */}
      <section className="home-section">
        <h2 className="section-title">Library</h2>
        {loadingLibrary && <div style={{color:'#B3B3B3', fontSize:14}}>Učitavanje...</div>}
        {libraryError && <div style={{color:'#f87171', fontSize:14}}>Greška: {libraryError}</div>}
        {!loadingLibrary && !libraryError && librarySongs.length === 0 && (
          <div style={{color:'#B3B3B3', fontSize:14}}>Nema dostupnih pesama.</div>
        )}
        {!loadingLibrary && !libraryError && librarySongs.length > 0 && (
          <div className="grid" style={{
            display:'grid',
            gap:'16px',
            gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))'
          }}>
            {librarySongs.map(song => (
              <div key={song.id} className="group" style={{cursor:'pointer'}} onClick={() => handlePlaySong(song)}>
                <div style={{position:'relative'}}>
                  <img src={song.cover} alt={song.title} style={{width:'100%', aspectRatio:'1/1', objectFit:'cover', borderRadius:8, boxShadow:'0 4px 14px rgba(0,0,0,0.4)'}} />
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePlaySong(song); }}
                    style={{
                      position:'absolute', bottom:8, right:8,
                      background:'linear-gradient(135deg,#8B5CF6,#F59E0B)',
                      border:'none', borderRadius:20, padding:'6px 12px',
                      color:'#fff', fontSize:12, fontWeight:600,
                      boxShadow:'0 2px 6px rgba(0,0,0,0.5)', cursor:'pointer'
                    }}
                  >Play</button>
                </div>
                <div style={{marginTop:8}}>
                  <div style={{fontSize:14, fontWeight:600, color:'#fff', lineHeight:1.2}} className="truncate">{song.title}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="home-section">
        <h2 className="section-title">Songs</h2>
        <div className="songs-list">
          {sampleSongs.map((song) => (
            <div key={song.id} className="song-item" onClick={() => handlePlaySong(song)}>
              <div className="song-cover"><span>{song.cover}</span></div>
              <div className="song-details">
                <h3 className="song-title">{song.title}</h3>
                <p className="song-artist">{song.artist}</p>
                <p className="song-album">{song.album}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

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