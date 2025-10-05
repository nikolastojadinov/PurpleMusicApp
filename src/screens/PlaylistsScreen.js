import React, { useState } from 'react';
import { useGlobalModal } from '../context/GlobalModalContext.jsx';
import { getCurrentUser } from '../services/userService';
import { isCurrentlyPremium } from '../services/premiumService';
import CreatePlaylistModal from '../components/CreatePlaylistModal';
import { useNavigate } from 'react-router-dom';
// ...existing code...

export default function PlaylistsScreen() {
  // ...existing code...
  
  const [playlists, setPlaylists] = useState([]);
  const { show } = useGlobalModal();
  const [showPremiumPopup, setShowPremiumPopup] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  const user = getCurrentUser();
  console.log('Current user:', user);
  React.useEffect(() => {
    if (!user?.id) return;
    import('../supabaseClient').then(({ supabase }) => {
      supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)
        .then(({ data, error }) => {
          if (error) {
            show('Error loading playlists: ' + error.message, { type: 'error', autoClose: 4000 });
          } else {
            // Normalize lastUpdated (could be lastupdated or lastUpdated depending on migration)
            const normalized = (data || []).map(p => ({
              ...p,
              lastUpdated: p.lastUpdated || p.lastupdated || p.updated_at || p.created_at
            }));
            setPlaylists(normalized);
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

  const handleCreatePlaylist = () => {
    // Show premium modal for guests or non-premium users
    if (!user || !isCurrentlyPremium(user)) {
      window.dispatchEvent(new CustomEvent('pm:openPremiumModal', { detail: { source: 'createPlaylist' } }));
      return;
    }
    setShowCreateModal(true);
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
              <p className="playlist-info">{playlist.lastUpdated ? new Date(playlist.lastUpdated).toLocaleString() : ''}</p>
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
            currentUser={user}
          />
      )}
    </div>
  );
}