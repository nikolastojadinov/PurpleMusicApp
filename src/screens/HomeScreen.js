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
  const songs = STATIC_SONGS;

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
        <pre style={{maxHeight:200, overflow:'auto', fontSize:10, background:'rgba(255,255,255,0.05)', padding:12, borderRadius:8, marginBottom:20}}>
{JSON.stringify(songs, null, 2)}
        </pre>
      )}

      <section className="home-section">
        <h2 className="section-title">All songs</h2>
        <div className="songs-grid">
          {songs.map(song => (
            <div key={song.id} className="song-card" onClick={() => handlePlaySong(song)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handlePlaySong(song); }}>
              <div className="song-card-cover">
                <img src={song.cover} alt={song.title} loading="lazy" />
              </div>
              <div className="song-card-title" title={song.title}>{song.title}</div>
              <div className="song-card-artist" title={song.artist}>{song.artist}</div>
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
          <ModernAudioPlayer key={selectedSong.id} autoPlay song={{
            ...selectedSong,
            src: selectedSong.src || selectedSong.url
          }} />
        </div>
      )}
    </div>
  );
}