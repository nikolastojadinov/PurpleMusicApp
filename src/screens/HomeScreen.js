import React from 'react';
import ModernAudioPlayer from '../components/ModernAudioPlayer';
// ...existing code...

const STATIC_SONGS = [
  {
    id: 'static-1',
    title: 'Deep Abstract Ambient',
    artist: 'Unknown Artist',
    album: 'Single',
    cover: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Covers/deepabstractambient.png',
    src: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/deepabstractambient.mp3'
  },
  {
    id: 'static-2',
    title: 'Retro Lounge',
    artist: 'Unknown Artist',
    album: 'Single',
    cover: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Covers/retro-lounge.png',
    src: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/retro-lounge.mp3'
  },
  {
    id: 'static-3',
    title: 'Running Night',
    artist: 'Unknown Artist',
    album: 'Single',
    cover: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Covers/running-night.png',
    src: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/running-night.mp3'
  },
  {
    id: 'static-4',
    title: 'Vlog Beat Background',
    artist: 'Unknown Artist',
    album: 'Single',
    cover: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Covers/vlog-beat-background.png',
    src: 'https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/vlog-beat-background.mp3'
  }
];

export default function HomeScreen() {
  const librarySongs = STATIC_SONGS;
  const madeForYouSongs = librarySongs;
  const recentlyPlayedSongs = librarySongs;
  const trendingNowSongs = librarySongs;

  // State za selektovanu pesmu i prikaz playera
  const [selectedSong, setSelectedSong] = React.useState(null);
  const [playerOpen, setPlayerOpen] = React.useState(false);
  const [showDebug, setShowDebug] = React.useState(false);

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
        {librarySongs.length > 0 && (
          <button onClick={() => setShowDebug(d => !d)} style={{marginTop:12, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', color:'#fff', padding:'6px 12px', borderRadius:6, cursor:'pointer', fontSize:12}}>
            {showDebug ? 'Hide debug' : 'Show debug'}
          </button>
        )}
      </div>

      {showDebug && (
        <pre style={{maxHeight:200, overflow:'auto', fontSize:10, background:'rgba(255,255,255,0.05)', padding:12, borderRadius:8, marginBottom:20}}>
{JSON.stringify(librarySongs, null, 2)}
        </pre>
      )}

      {/* Made for you section */}
      <section className="home-section">
        <h2 className="section-title">Made for you</h2>
        {madeForYouSongs.length > 0 && (
          <div className="horizontal-scroll">
            {madeForYouSongs.map(song => (
              <div key={song.id} className="made-item" style={{position:'relative'}}>
                <div className="made-cover" style={{padding:0, overflow:'hidden', position:'relative'}}>
                  <img src={song.cover} alt={song.title} className="w-full h-full object-cover" />
                  <button onClick={() => handlePlaySong(song)} style={{position:'absolute', bottom:8, right:8, background:'linear-gradient(135deg,#8B5CF6,#F59E0B)', color:'#fff', border:'none', borderRadius:20, padding:'6px 12px', fontSize:12, fontWeight:600, cursor:'pointer'}}>Play</button>
                </div>
                <div className="made-title truncate" style={{maxWidth:160, marginTop:6}}>{song.title}</div>
                <div className="made-subtitle truncate" style={{maxWidth:160}}>{song.artist}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recently played section */}
      <section className="home-section">
        <h2 className="section-title">Recently played</h2>
        {recentlyPlayedSongs.length > 0 && (
          <div className="horizontal-scroll">
            {recentlyPlayedSongs.map(song => (
              <div key={song.id} className="recent-item" style={{position:'relative'}}>
                <div className="recent-cover" style={{padding:0, overflow:'hidden', position:'relative'}}>
                  <img src={song.cover} alt={song.title} className="w-full h-full object-cover" />
                  <button onClick={() => handlePlaySong(song)} style={{position:'absolute', bottom:8, right:8, background:'linear-gradient(135deg,#8B5CF6,#F59E0B)', color:'#fff', border:'none', borderRadius:18, padding:'6px 10px', fontSize:12, fontWeight:600, cursor:'pointer'}}>Play</button>
                </div>
                <div className="recent-title truncate" style={{maxWidth:140, marginTop:6}}>{song.title}</div>
                <div className="made-subtitle truncate" style={{maxWidth:140}}>{song.artist}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Trending now section */}
      <section className="home-section">
        <h2 className="section-title">Trending now</h2>
        {trendingNowSongs.length > 0 && (
          <div className="horizontal-scroll">
            {trendingNowSongs.map(song => (
              <div key={song.id} className="trending-item" style={{position:'relative'}}>
                <div className="trending-cover" style={{padding:0, overflow:'hidden', position:'relative'}}>
                  <img src={song.cover} alt={song.title} className="w-full h-full object-cover" />
                  <button onClick={() => handlePlaySong(song)} style={{position:'absolute', bottom:8, right:8, background:'linear-gradient(135deg,#8B5CF6,#F59E0B)', color:'#fff', border:'none', borderRadius:20, padding:'6px 12px', fontSize:12, fontWeight:600, cursor:'pointer'}}>Play</button>
                </div>
                <div className="trending-title truncate" style={{maxWidth:160, marginTop:6}}>{song.title}</div>
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