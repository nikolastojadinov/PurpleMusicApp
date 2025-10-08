import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGlobalModal } from '../context/GlobalModalContext.jsx';
import { getCurrentUser } from '../services/userService';
import { isCurrentlyPremium } from '../services/premiumService';
import { openPremiumModal } from '../utils/openPremiumModal';
import CreatePlaylistModal from '../components/CreatePlaylistModal';
import { useNavigate } from 'react-router-dom';
// ...existing code...

export default function PlaylistsScreen() {
  const { t } = useTranslation();
  // ...existing code...
  
  const [playlists, setPlaylists] = useState([]);
  const { show } = useGlobalModal();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  const user = getCurrentUser();
  // Removed verbose user console log for CI cleanliness
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
  }, [user?.id, show]);

  // Removed unused sampleSongs array

  const handlePlayPlaylist = (playlist) => {
    navigate(`/playlist/${playlist.id}`);
  };

  const handleCreatePlaylist = () => {
    // Show premium modal for guests or non-premium users
    if (!user || !isCurrentlyPremium(user)) { openPremiumModal('createPlaylist'); return; }
    setShowCreateModal(true);
  };

  const handleModalClose = () => setShowCreateModal(false);

  const handleModalCreate = (playlist) => {
    setShowCreateModal(false);
    setPlaylists(prev => [playlist, ...prev]);
    // Navigate to playlist detail page (assume /playlist/:id)
    navigate(`/playlist/${playlist.id}`);
  };

  // legacy premium popup removed; unified global premium modal handles gating

  return (
    <div className="playlists-screen">
      <div className="playlists-header">
        <h1 className="screen-title">{t('playlists.title')}</h1>
        <button className="create-playlist-btn" onClick={handleCreatePlaylist} title={t('playlists.create_title')}>
          <span>+</span>
          {t('playlists.create')}
        </button>
      </div>

      <div className="playlists-list">
  <h2 className="section-title">{t('playlists.made_by_you')}</h2>
        {playlists.map((playlist) => (
          <div key={playlist.id} className="playlist-item" onClick={() => handlePlayPlaylist(playlist)}>
            <div className="playlist-details">
              <h3 className="playlist-name">{playlist.name}</h3>
              <p className="playlist-info">{playlist.lastUpdated ? new Date(playlist.lastUpdated).toLocaleString() : ''}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Legacy premium popup removed */}

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