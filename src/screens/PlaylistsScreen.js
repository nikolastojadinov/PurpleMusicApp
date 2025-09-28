import React from 'react';
// ...existing code...

export default function PlaylistsScreen() {
  // ...existing code...
  
  const [playlists, setPlaylists] = React.useState([]);
  const [showPremiumPopup, setShowPremiumPopup] = React.useState(false);
  React.useEffect(() => {
    import('../supabaseClient').then(({ supabase }) => {
      supabase
        .from('playlists')
        .select('*')
        .then(({ data, error }) => {
          if (error) {
            alert('Error loading playlists: ' + error.message);
          } else {
            setPlaylists(data || []);
          }
        });
    });
  }, []);

  const sampleSongs = [
    { id: 1, title: 'Blinding Lights', artist: 'The Weeknd', cover: '🌟', album: 'After Hours' },
    { id: 2, title: 'Watermelon Sugar', artist: 'Harry Styles', cover: '🍉', album: 'Fine Line' },
    { id: 3, title: 'Levitating', artist: 'Dua Lipa', cover: '✨', album: 'Future Nostalgia' },
  ];

  const handlePlayPlaylist = (playlist) => {
    alert('Play: ' + (playlist.name || playlist));
  };

  const handleCreatePlaylist = () => {
    // Show premium popup since playlist creation requires premium membership
    setShowPremiumPopup(true);
  };

  const closePremiumPopup = () => {
    setShowPremiumPopup(false);
  };

  return (
    <div className="playlists-screen">
      <div className="playlists-header">
        <h1 className="screen-title">My Playlists</h1>
        <button className="create-playlist-btn" onClick={handleCreatePlaylist}>
          <span>+</span>
          Create Playlist
        </button>
      </div>

      <div className="quick-access">
        <div className="quick-item liked-songs" onClick={() => handlePlayPlaylist('liked')}>
          <span className="quick-icon">💚</span>
          <span className="quick-text">Liked Songs</span>
        </div>
      </div>

      <div className="playlists-list">
        <h2 className="section-title">Made by you</h2>
        {playlists.map((playlist) => (
          <div key={playlist.id} className="playlist-item" onClick={() => handlePlayPlaylist(playlist)}>
            <div className="playlist-cover">
              <span>{playlist.cover}</span>
            </div>
            <div className="playlist-details">
              <h3 className="playlist-name">{playlist.name}</h3>
              <p className="playlist-info">{playlist.songCount} songs • {playlist.lastUpdated}</p>
            </div>
            <button 
              className="playlist-menu"
              onClick={(e) => e.stopPropagation()}
            >
              ⋯
            </button>
          </div>
        ))}
      </div>

      {/* Premium Popup */}
      {showPremiumPopup && (
        <div className="premium-popup-overlay" onClick={closePremiumPopup}>
          <div className="premium-popup" onClick={(e) => e.stopPropagation()}>
            <div className="premium-header">
              <h2>🎵 Premium Feature</h2>
              <button className="close-btn" onClick={closePremiumPopup}>×</button>
            </div>
            <div className="premium-content">
              <div className="premium-icon">⭐</div>
              <h3>Create Custom Playlists</h3>
              <p>Creating custom playlists is a premium feature that lets you organize your favorite music exactly how you want.</p>
              
              <div className="premium-price">
                <span className="price">3.14π</span>
                <span className="period">Premium Membership</span>
              </div>
              
              <div className="premium-features">
                <div className="feature">✓ Create unlimited playlists</div>
                <div className="feature">✓ Custom playlist covers</div>
                <div className="feature">✓ Advanced playlist management</div>
                <div className="feature">✓ Offline playlist download</div>
              </div>
              
              <div className="premium-buttons">
                <button className="upgrade-btn">Upgrade to Premium</button>
                <button className="cancel-btn" onClick={closePremiumPopup}>Maybe Later</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}