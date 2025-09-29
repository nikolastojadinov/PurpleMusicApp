import React, { useState } from 'react';
import { getCurrentUser } from '../services/userService';

export default function CreatePlaylistModal({ onClose, onCreate }) {
  const [playlistName, setPlaylistName] = useState('');
  const [loading, setLoading] = useState(false);
  const user = getCurrentUser();

  const handleCreate = async () => {
    if (!playlistName.trim()) return;
    setLoading(true);
    try {
      const { supabase } = await import('../supabaseClient');
      const { data, error } = await supabase
        .from('playlists')
        .insert({
          name: playlistName,
          owner_id: user.pi_user_uid,
          owner_username: user.username,
          created_at: new Date().toISOString(),
          songCount: 0,
          lastUpdated: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      onCreate(data);
    } catch (err) {
      alert('Error creating playlist: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.7)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div className="modal-content" style={{background:'#222',borderRadius:16,padding:'2rem',minWidth:300,maxWidth:350}}>
        <button onClick={onClose} style={{position:'absolute',top:16,right:16,fontSize:24,color:'#fff',background:'none',border:'none',cursor:'pointer'}}>×</button>
        <h2 style={{color:'#fff',marginBottom:'1rem'}}>Give your playlist a name</h2>
        <input
          type="text"
          value={playlistName}
          onChange={e => setPlaylistName(e.target.value)}
          placeholder="My playlist"
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
