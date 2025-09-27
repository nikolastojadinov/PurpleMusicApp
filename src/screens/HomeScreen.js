import React from 'react';
import ModernAudioPlayer from '../components/ModernAudioPlayer';
import { listCovers } from '../services/coversService';
// ...existing code...

const STATIC_SONGS = [
  {
    title: "Apocalypse 1 (Original Lyrics)",
    url: "https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/apocalypse-1-original-lyrics-344749.mp3",
    cover: "https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Covers/apocalypse-1-original-lyrics-344749.jpg"
  },
  {
    title: "Apocalypse (Original Lyrics)",
    url: "https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/apocalypse-original-lyrics-344734.mp3",
    cover: "https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Covers/apocalypse-original-lyrics-344734.jpg"
  },
  {
    title: "80s Baby (Original Lyrics)",
    url: "https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/80s-baby-original-lyrics-335952.mp3",
    cover: "https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Covers/80s-baby-original-lyrics-335952.jpg"
  },
  {
    title: "80’s Nostalgia",
    url: "https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/8039s-nostalgia-21344.mp3",
    cover: "https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Covers/8039s-nostalgia-21344.jpg"
  },
  {
    title: "80 Cinematic Synthwave",
    url: "https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/80-cinematic-synthwave-396982.mp3",
    cover: "https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Covers/80-cinematic-synthwave-396982.jpg"
  },
  {
    title: "Retro 80s Sax",
    url: "https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/retro-80s-sax-398114.mp3",
    cover: "https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Covers/retro-80s-sax-398114.jpg"
  },
  {
    title: "Lady of the 80’s",
    url: "https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Music/lady-of-the-80x27s-128379.mp3",
    cover: "https://ofkfygqrfenctzitigae.supabase.co/storage/v1/object/public/Covers/lady-of-the-80x27s-128379.jpg"
  }
];

export default function HomeScreen() {
  const madeForYouSongs = STATIC_SONGS;
  const recentlyPlayedSongs = STATIC_SONGS;
  const trendingNowSongs = STATIC_SONGS;

  const [selectedSong, setSelectedSong] = React.useState(null);
  const [playerOpen, setPlayerOpen] = React.useState(false);
  const [showDebug, setShowDebug] = React.useState(false);
  const fallbackCover = '/fallback-cover.png';
  const [coverFiles, setCoverFiles] = React.useState([]);
  const [coverFetchError, setCoverFetchError] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      try {
        const files = await listCovers();
        setCoverFiles(files);
      } catch (e) {
        setCoverFetchError(e.message);
      }
    })();
  }, []);

  // Try alternate extension (.jpg <-> .png) before final fallback
  const handleImageError = (e, song) => {
    const img = e.currentTarget;
    const triedAlt = img.dataset.triedAlt === '1';
    const original = song.cover;
    if (!triedAlt) {
      if (original.endsWith('.jpg')) {
        const alt = original.replace(/\.jpg$/i, '.png');
        img.dataset.triedAlt = '1';
        img.src = alt;
        return;
      } else if (original.endsWith('.png')) {
        const alt = original.replace(/\.png$/i, '.jpg');
        img.dataset.triedAlt = '1';
        img.src = alt;
        return;
      }
    }
    img.src = fallbackCover;
  };

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
{JSON.stringify({ songs: madeForYouSongs, coversInBucket: coverFiles, coverFetchError }, null, 2)}
        </pre>
      )}

      {/* Made for you section */}
      <section className="home-section">
        <h2 className="section-title">Made for you</h2>
        <div className="songs-grid">
          {madeForYouSongs.map((song, idx) => (
            <div key={idx} className="song-card" onClick={() => handlePlaySong(song)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handlePlaySong(song); }}>
              <div className="song-card-cover">
                <img src={song.cover} alt={song.title} loading="lazy" onError={(e) => handleImageError(e, song)} />
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
                <img src={song.cover} alt={song.title} loading="lazy" onError={(e) => handleImageError(e, song)} />
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
                <img src={song.cover} alt={song.title} loading="lazy" onError={(e) => handleImageError(e, song)} />
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