import React from 'react';
import ModernAudioPlayer from '../components/ModernAudioPlayer';
import { listCovers } from '../services/coversService';
import { SUPABASE_URL } from '../supabaseClient';
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
        // Build fuzzy map once covers are loaded
        setFuzzyCoversMap(buildFuzzyMap(STATIC_SONGS, files));
      } catch (e) {
        setCoverFetchError(e.message);
      }
    })();
  }, []);

  const [fuzzyCoversMap, setFuzzyCoversMap] = React.useState({});

  function normalize(str){
    return str.toLowerCase()
      .replace(/[%'_]/g,' ')
      .replace(/[^a-z0-9]+/g,' ')
      .replace(/\s+/g,' ') // collapse
      .trim();
  }

  function score(a,b){
    // simple token intersection score
    const ta = new Set(normalize(a).split(' '));
    const tb = new Set(normalize(b).split(' '));
    if(!a||!b) return 0;
    let inter = 0;
    ta.forEach(t=>{ if(tb.has(t)) inter++; });
    return inter / Math.max(ta.size, tb.size);
  }

  function buildFuzzyMap(songs, files){
    const map = {};
    songs.forEach(song => {
      let best = {file:null, s:0};
      files.forEach(f => {
        const s = score(song.title, f);
        if(s > best.s) best = {file:f, s};
      });
      if(best.file && best.s >= 0.34){
        map[song.title] = {
          matchedFile: best.file,
          score: Number(best.s.toFixed(2)),
          finalCoverUrl: `${SUPABASE_URL}/storage/v1/object/public/Covers/${best.file}`
        };
      }
    });
    return map;
  }

  // Derive effective songs list with fuzzy-mapped cover URLs when available
  const effectiveMade = React.useMemo(() => madeForYouSongs.map(s => ({
    ...s,
    cover: fuzzyCoversMap[s.title]?.finalCoverUrl || s.cover
  })), [madeForYouSongs, fuzzyCoversMap]);
  const effectiveRecent = React.useMemo(() => recentlyPlayedSongs.map(s => ({
    ...s,
    cover: fuzzyCoversMap[s.title]?.finalCoverUrl || s.cover
  })), [recentlyPlayedSongs, fuzzyCoversMap]);
  const effectiveTrending = React.useMemo(() => trendingNowSongs.map(s => ({
    ...s,
    cover: fuzzyCoversMap[s.title]?.finalCoverUrl || s.cover
  })), [trendingNowSongs, fuzzyCoversMap]);

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
  <pre style={{maxHeight:260, overflow:'auto', fontSize:10, background:'rgba(255,255,255,0.05)', padding:12, borderRadius:8, marginBottom:20}}>
{JSON.stringify({ songs: madeForYouSongs, coversInBucket: coverFiles, fuzzyMap: fuzzyCoversMap, coverFetchError }, null, 2)}
  </pre>
      )}

      {/* Made for you section */}
      <section className="home-section">
        <h2 className="section-title">Made for you</h2>
        <div className="songs-grid">
          {effectiveMade.map((song, idx) => (
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
          {effectiveRecent.map((song, idx) => (
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
          {effectiveTrending.map((song, idx) => (
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