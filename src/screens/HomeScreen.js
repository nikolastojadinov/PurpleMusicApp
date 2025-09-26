import React from 'react';
// ...existing code...

export default function HomeScreen() {
  // ...existing code...

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
          <ModernAudioPlayer key={selectedSong.id} song={selectedSong} />
        </div>
      )}
    </div>
  );
}