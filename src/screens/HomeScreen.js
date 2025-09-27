import React from 'react';
import ModernAudioPlayer from '../components/ModernAudioPlayer';
// ...existing code...

// Updated list using only the MP3 URLs you just provided and the real cover filenames.
// (Trenutno si poslao 4 MP3 fajla, ostali prethodni nisu potvrđeni – zato je lista sada 4 pesme.)
const STATIC_SONGS = [
  {
    title: "Apocalypse 1 (Original Lyrics)",
    url: "https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/apocalypse-1-original-lyrics-344749.mp3",
    cover: "https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Covers/apocalyptic_synthwav_d29e41ff.jpg"
  },
  {
    title: "Retro 80s Sax",
    url: "https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/retro-80s-sax-398114.mp3",
    cover: "https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Covers/retro_saxophone_albu_2cc5c11a.jpg"
  },
  {
    title: "80’s Nostalgia",
    url: "https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/8039s-nostalgia-21344.mp3",
    cover: "https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Covers/nostalgic_80s_album__7b2fff5f.jpg"
  },
  {
    title: "80s Baby (Original Lyrics)",
    url: "https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/80s-baby-original-lyrics-335952.mp3",
    cover: "https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Covers/synthwave_retro_albu_327209ad.jpg"
  }
];

export default function HomeScreen() {
  const madeForYouSongs = STATIC_SONGS;
  const recentlyPlayedSongs = STATIC_SONGS;
  const trendingNowSongs = STATIC_SONGS;

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
        {madeForYouSongs.length > 0 && (
          <button onClick={() => setShowDebug(d => !d)} style={{marginTop:12, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', color:'#fff', padding:'6px 12px', borderRadius:6, cursor:'pointer', fontSize:12}}>
            {showDebug ? 'Hide debug' : 'Show debug'}
          </button>
        )}
      </div>

      {showDebug && (
        <pre style={{maxHeight:200, overflow:'auto', fontSize:10, background:'rgba(255,255,255,0.05)', padding:12, borderRadius:8, marginBottom:20}}>
{JSON.stringify(madeForYouSongs, null, 2)}
        </pre>
      )}

      {/* Made for you section */}
      <section className="home-section">
        <h2 className="section-title">Made for you</h2>
        <div className="songs-grid">
          {madeForYouSongs.map((song, idx) => (
            <div key={idx} className="song-card" onClick={() => handlePlaySong(song)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handlePlaySong(song); }}>
              <div className="song-card-cover">
                <img src={song.cover} alt={song.title} loading="lazy" />
              </div>
              <div className="song-card-title" title={song.title}>{song.title}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Recently played section */}
      <section className="home-section">
        <h2 className="section-title">Recently played</h2>
        <div className="songs-grid">
          {recentlyPlayedSongs.map((song, idx) => (
            <div key={idx} className="song-card" onClick={() => handlePlaySong(song)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handlePlaySong(song); }}>
              <div className="song-card-cover">
                <img src={song.cover} alt={song.title} loading="lazy" />
              </div>
              <div className="song-card-title" title={song.title}>{song.title}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Trending now section */}
      <section className="home-section">
        <h2 className="section-title">Trending now</h2>
        <div className="songs-grid">
          {trendingNowSongs.map((song, idx) => (
            <div key={idx} className="song-card" onClick={() => handlePlaySong(song)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handlePlaySong(song); }}>
              <div className="song-card-cover">
                <img src={song.cover} alt={song.title} loading="lazy" />
              </div>
              <div className="song-card-title" title={song.title}>{song.title}</div>
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