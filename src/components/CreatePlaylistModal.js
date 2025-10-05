import React, { useState } from 'react';
import { useGlobalModal } from '../context/GlobalModalContext.jsx';

export default function CreatePlaylistModal({ onClose, onCreate, currentUser, isPremium }) {
  const [playlistName, setPlaylistName] = useState('');
  const { show } = useGlobalModal();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!playlistName.trim()) return;
    if (!currentUser || !currentUser.id || !currentUser.is_premium) {
      // Unified gating: guests OR non-premium -> open premium modal
      window.dispatchEvent(new CustomEvent('pm:openPremiumModal', { detail: { source: 'createPlaylistModal' } }));
      return;
    }
    setLoading(true);
    try {
      const { supabase } = await import('../supabaseClient');
      const { data, error } = await supabase
        .from('playlists')
        .insert([{ user_id: currentUser.id, name: playlistName }])
        .select('*')
        .single();
      if (error) throw error;
      const normalized = { ...data, lastUpdated: data.lastUpdated || data.lastupdated || data.updated_at || data.created_at };
      onCreate(normalized);
    } catch (err) {
  show('Greška pri kreiranju plejliste: ' + err.message, { type: 'error', autoClose: 4000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.7)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div className="modal-content" style={{background:'#222',borderRadius:16,padding:'2rem',minWidth:300,maxWidth:350,position:'relative'}}>
        <button onClick={onClose} style={{position:'absolute',top:16,right:16,fontSize:24,color:'#fff',background:'none',border:'none',cursor:'pointer'}}>×</button>
        <h2 style={{color:'#fff',marginBottom:'1rem'}}>Give your playlist a name</h2>
        <input
          type="text"
          value={playlistName}
          onChange={e => setPlaylistName(e.target.value)}
          placeholder="My playlist"
          className="text-black"
          style={{width:'100%',padding:'0.5rem',fontSize:'1.2rem',borderRadius:8,border:'1px solid #444',marginBottom:'1.5rem'}}
        />
        <button
          onClick={handleCreate}
          disabled={loading || !playlistName.trim()}
          style={{width:'100%',padding:'0.75rem',fontSize:'1.1rem',borderRadius:8,background:'#1db954',color:'#fff',border:'none',cursor:'pointer',opacity:loading||!playlistName.trim()?0.6:1}}
        >
          {loading ? 'Creating...' : 'Create'}
        </button>
      </div>
    </div>
  );
}
