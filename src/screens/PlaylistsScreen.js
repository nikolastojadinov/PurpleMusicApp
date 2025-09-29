import React, { useState } from 'react';
import { getCurrentUser } from '../services/userService';
import { isCurrentlyPremium } from '../services/premiumService';
import CreatePlaylistModal from '../components/CreatePlaylistModal';
import { useNavigate } from 'react-router-dom';
// ...existing code...

export default function PlaylistsScreen() {
  // ...existing code...
  
  const [playlists, setPlaylists] = useState([]);
  const [showPremiumPopup, setShowPremiumPopup] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  // Premium check function - Supabase/localStorage
  const user = getCurrentUser();
  console.log('Current user:', user);
  const isPremium = user?.is_premium === true;
  React.useEffect(() => {
    if (!user?.id) return;
    import('../supabaseClient').then(({ supabase }) => {
      supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)
        .then(({ data, error }) => {
          if (error) {
            alert('Error loading playlists: ' + error.message);
          } else {
            setPlaylists(data || []);
          }
        });
    });
  }, [user?.id]);

  const sampleSongs = [
    { id: 1, title: 'Blinding Lights', artist: 'The Weeknd', cover: '🌟', album: 'After Hours' },
    { id: 2, title: 'Watermelon Sugar', artist: 'Harry Styles', cover: '🍉', album: 'Fine Line' },
    { id: 3, title: 'Levitating', artist: 'Dua Lipa', cover: '✨', album: 'Future Nostalgia' },
  ];

  const handlePlayPlaylist = (playlist) => {
    navigate(`/playlist/${playlist.id}`);
  };

  const handleCreatePlaylist = async () => {
    if (!user?.id) return;
    try {
      const premium = await isCurrentlyPremium(user.id);
      if (!premium) {
        setShowPremiumPopup(true);
        return;
      }
      setShowCreateModal(true);
    } catch (err) {
      alert('Greška pri proveri premium statusa: ' + err.message);
    }
  };

  const handleModalClose = () => setShowCreateModal(false);

  const handleModalCreate = (playlist) => {
    setShowCreateModal(false);
    setPlaylists(prev => [playlist, ...prev]);
    // Navigate to playlist detail page (assume /playlist/:id)
    navigate(`/playlist/${playlist.id}`);
  };

  const closePremiumPopup = () => {
    setShowPremiumPopup(false);
  };

  return (
    <div className="playlists-screen">
      <div className="playlists-header">
        <h1 className="screen-title">My Playlists</h1>
        <button className="create-playlist-btn" onClick={handleCreatePlaylist} title="Create Playlist">
          <span>+</span>
          Create Playlist
        </button>
      </div>

      <div className="playlists-list">
        <h2 className="section-title">Made by you</h2>
        {playlists.map((playlist) => (
          <div key={playlist.id} className="playlist-item" onClick={() => handlePlayPlaylist(playlist)}>
            <div className="playlist-details">
              <h3 className="playlist-name">{playlist.name}</h3>
              <p className="playlist-info">{playlist.lastUpdated}</p>
            </div>
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
              <h3>Create Custom Playlists</h3>
              <p>Creating custom playlists is a premium feature.</p>
              <div className="premium-buttons">
                <button className="upgrade-btn">Upgrade to Premium</button>
                <button className="cancel-btn" onClick={closePremiumPopup}>Maybe Later</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <CreatePlaylistModal
          onClose={handleModalClose}
          onCreate={handleModalCreate}
          pi_user_uid={user?.pi_user_uid}
          username={user?.username}
          wallet_address={user?.wallet_address}
        />
      )}
    </div>
  );
}