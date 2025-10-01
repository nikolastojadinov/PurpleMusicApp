import React, { useEffect, useState, useRef } from 'react';
// Unified: use same loader as global SearchScreen so results are guaranteed even if DB Music table is empty
import { loadMusicLibrary } from '../services/libraryLoader';
import { useGlobalModal } from '../context/GlobalModalContext.jsx';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getLikedSongsSupabase } from '../services/likedSongsSupabase';

export default function PlaylistDetailScreen() {
  const { id: playlistId } = useParams();
  const { show } = useGlobalModal();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [recommendedSongs, setRecommendedSongs] = useState([]);
  const [modalSearch, setModalSearch] = useState('');
  const [modalResults, setModalResults] = useState([]);
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [likedSongs, setLikedSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [musicLibrary, setMusicLibrary] = useState([]); // full library loaded from storage / known list
  const [modalOpen, setModalOpen] = useState(false);
  const [updatingName, setUpdatingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch playlist info
  useEffect(() => {
    async function fetchPlaylist() {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('id', playlistId)
        .single();
      if (error) {
        show('Greška pri učitavanju plejliste.', { type: 'error', autoClose: 3000 });
        navigate('/');
        return;
      }
      setPlaylist(data);
    }
    fetchPlaylist();
  }, [playlistId, navigate]);

  // Fetch playlist songs
  useEffect(() => {
    async function fetchPlaylistSongs() {
      const { data, error } = await supabase
        .from('playlist_items')
        .select('track_url, cover_url, title, artist, added_at')
        .eq('playlist_id', playlistId)
        .order('added_at', { ascending: false });
      setPlaylistSongs(data || []);
    }
    fetchPlaylistSongs();
  }, [playlistId]);

  // Fetch liked songs (for My Liked Songs section inside playlist detail)
  useEffect(() => {
    async function loadLiked() {
      try {
        const ls = await getLikedSongsSupabase();
        setLikedSongs(ls || []);
      } catch (e) {
        console.warn('Failed loading liked songs', e);
        setLikedSongs([]);
      }
    }
    loadLiked();
  }, [playlistId]);

  // Load full library once and derive recommended songs
  useEffect(() => {
    let cancelled = false;
    async function loadLib() {
      setLoading(true);
      try {
        const songs = await loadMusicLibrary();
        if (cancelled) return;
        // Normalize into playlist-friendly shape
        const normalized = songs.map(s => ({
          track_url: s.url,
          cover_url: s.cover || '/fallback-cover.png',
            // Keep existing structure (if search later wants artist)
          title: s.title,
          artist: s.artist || 'Unknown'
        }));
        setMusicLibrary(normalized);
        // Pick 10 random (or all if <10)
        const shuffled = [...normalized].sort(() => Math.random() - 0.5).slice(0, 10);
        setRecommendedSongs(shuffled);
      } catch (e) {
        if (window?.location?.search?.includes('pmDebug=1')) console.log('[PlaylistDetail] loadMusicLibrary error:', e);
        setMusicLibrary([]);
        setRecommendedSongs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadLib();
    return () => { cancelled = true; };
  }, [playlistId]);

  // Modal search (autocomplete) – now purely client-side over loaded library
  useEffect(() => {
    if (!modalOpen) return;
    const raw = modalSearch.trim();
    if (!raw) { setModalResults([]); return; }
    const term = raw.toLowerCase();
    const filtered = musicLibrary.filter(s =>
      s.title.toLowerCase().includes(term) || (s.artist||'').toLowerCase().includes(term)
    ).slice(0,50);
    setModalResults(filtered);
  }, [modalSearch, modalOpen, musicLibrary]);

  // Add song to playlist
  async function handleAddSong(song) {
    const { error } = await supabase
      .from('playlist_items')
      .insert({
        playlist_id: playlistId,
        track_url: song.track_url,
        cover_url: song.cover_url,
        title: song.title,
        artist: song.artist
      });
    if (error) {
      show('Greška pri dodavanju pesme: ' + error.message, { type: 'error', autoClose: 3500 });
      return;
    }
    // Refresh playlist songs
    const { data } = await supabase
      .from('playlist_items')
      .select('track_url, cover_url, title, artist, added_at')
      .eq('playlist_id', playlistId)
      .order('added_at', { ascending: false });
    setPlaylistSongs(data || []);
    // If added from modal we can optionally show feedback
    show('Pesma dodata u playlistu', { type: 'success', autoClose: 1800 });
  }

  // Play preview
  function handlePlaySong(song) {
    const audio = new Audio(song.track_url);
    audio.play();
  }

  // Update playlist name
  const handleSaveName = async () => {
    if (!newName.trim() || !playlist) return setUpdatingName(false);
    if (newName.trim() === playlist.name) return setUpdatingName(false);
    const { data, error } = await supabase
      .from('playlists')
      .update({ name: newName.trim() })
      .eq('id', playlistId)
      .select('*')
      .single();
    if (error) {
      show('Neuspešno ažuriranje imena: ' + error.message, { type: 'error', autoClose: 3000 });
    } else {
      setPlaylist(data);
      show('Ime playliste sačuvano.', { type: 'success', autoClose: 2000 });
    }
    setUpdatingName(false);
  };

  const startEditName = () => {
    setNewName(playlist?.name || '');
    setUpdatingName(true);
    setTimeout(() => {
      const input = document.getElementById('playlist-name-input');
      if (input) input.focus();
    }, 50);
  };

  const handleCoverClick = () => fileInputRef.current?.click();

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !playlist) return;
    setCoverUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${playlistId}_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('playlist-covers')
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: pub } = supabase.storage.from('playlist-covers').getPublicUrl(path);
      const coverUrl = pub?.publicUrl;
      const { data, error } = await supabase
        .from('playlists')
        .update({ cover_url: coverUrl })
        .eq('id', playlistId)
        .select('*')
        .single();
      if (error) throw error;
      setPlaylist(data);
      show('Cover ažuriran.', { type: 'success', autoClose: 1800 });
    } catch (err) {
      show('Neuspešan upload covera: ' + err.message, { type: 'error', autoClose: 3500 });
    } finally {
      setCoverUploading(false);
    }
  };

  if (!playlist) return <div className="playlist-detail-loading">Loading...</div>;

  return (
    <div className="playlist-detail-screen" style={{maxWidth:720,margin:'0 auto',padding:'2rem 1.25rem'}}>
      <div style={{display:'flex',gap:'1.5rem',alignItems:'center',marginBottom:'2rem'}}>
        <div onClick={handleCoverClick} style={{width:140,height:140,borderRadius:16,background:'#222',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',overflow:'hidden',position:'relative',border:'1px solid #333'}}>
          {playlist.cover_url ? (
            <img src={playlist.cover_url} alt="cover" style={{width:'100%',height:'100%',objectFit:'cover'}} />
          ) : (
            <span style={{fontSize:48,opacity:.4}}>♪</span>
          )}
          <div style={{position:'absolute',bottom:0,left:0,right:0,background:'rgba(0,0,0,0.55)',fontSize:11,padding:'4px 6px',textAlign:'center',letterSpacing:.5}}>Change Cover</div>
          {coverUploading && <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#fff'}}>Uploading...</div>}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleCoverChange} />
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            {updatingName ? (
              <div style={{display:'flex',alignItems:'center',gap:8,flex:1,minWidth:220}}>
                <input id="playlist-name-input" value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') handleSaveName(); if(e.key==='Escape') setUpdatingName(false); }} style={{fontSize:'1.9rem',fontWeight:'bold',padding:'4px 10px',borderRadius:8,border:'1px solid #555',flex:1,background:'#111',color:'#fff'}} />
                <button onClick={handleSaveName} style={{padding:'8px 14px',background:'#1db954',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontWeight:600}}>Save</button>
                <button onClick={()=>setUpdatingName(false)} style={{padding:'8px 14px',background:'transparent',color:'#bbb',border:'1px solid #444',borderRadius:8,cursor:'pointer',fontWeight:500}}>Cancel</button>
              </div>
            ) : (
              <h1 style={{fontSize:'2.3rem',fontWeight:700,margin:'0 0 4px'}}>{playlist.name}</h1>
            )}
          </div>
          {!updatingName && (
            <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:10}}>
              <button onClick={startEditName} style={{background:'transparent',color:'#fff',padding:'8px 14px',borderRadius:30,border:'1px solid #444',cursor:'pointer',fontSize:13,fontWeight:500}}>Rename</button>
              <button onClick={handleCoverClick} style={{background:'transparent',color:'#fff',padding:'8px 14px',borderRadius:30,border:'1px solid #444',cursor:'pointer',fontSize:13,fontWeight:500}}>Change Cover</button>
              <button onClick={()=>setModalOpen(true)} style={{background:'#fff',color:'#000',padding:'8px 18px',borderRadius:30,border:'none',cursor:'pointer',fontWeight:600,display:'flex',alignItems:'center',gap:6,fontSize:14}}>+
                <span>Add Songs</span>
              </button>
            </div>
          )}
        </div>
      </div>
      <h2 style={{fontSize:'1.2rem',marginBottom:'1rem'}}>Recommended songs</h2>
      {loading ? <div>Loading songs...</div> : recommendedSongs.length === 0 ? (
        <div style={{opacity:.6,fontSize:14}}>No recommendations available</div>
      ) : (
        <div>
          {recommendedSongs.map(song => {
            const already = playlistSongs.some(ps => ps.track_url === song.track_url);
            return (
              <div key={song.track_url} style={{display:'flex',alignItems:'center',marginBottom:'0.9rem',background:'#191919',borderRadius:10,padding:'0.55rem 0.75rem',border:'1px solid #262626'}}>
                <img src={song.cover_url} alt="cover" style={{width:50,height:50,borderRadius:8,marginRight:'1rem',objectFit:'cover'}} />
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:14,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{song.title}</div>
                  <div style={{color:'#aaa',fontSize:12}}>{song.artist}</div>
                </div>
                <button disabled={already} onClick={() => handleAddSong(song)} style={{padding:'0.45rem',borderRadius:8,background:'transparent',color:already?'#555':'#fff',border: already?'1px solid #333':'1px solid #fff',cursor:already?'default':'pointer',minWidth:36,fontWeight:600}}>{already ? '✓' : '+'}</button>
              </div>
            );
          })}
        </div>
      )}
      <h2 style={{fontSize:'1.2rem',margin:'2rem 0 1rem'}}>My Liked Songs</h2>
      {likedSongs.length === 0 ? <div style={{opacity:.6}}>No liked songs yet.</div> : (
        <div>
          {likedSongs.map(song => {
            const already = playlistSongs.some(ps => ps.track_url === song.track_url);
            return (
              <div key={song.track_url + (song.liked_at||'')} style={{display:'flex',alignItems:'center',marginBottom:'0.85rem',background:'#242424',borderRadius:10,padding:'0.55rem 0.7rem',border:'1px solid #303030'}}>
                <img src={song.cover_url} alt="cover" style={{width:46,height:46,borderRadius:8,marginRight:'0.85rem',objectFit:'cover'}} />
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:14,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{song.title}</div>
                  <div style={{color:'#aaa',fontSize:12}}>{song.artist}</div>
                </div>
                <button disabled={already} onClick={() => handleAddSong({
                  track_url: song.track_url,
                  cover_url: song.cover_url,
                  title: song.title,
                  artist: song.artist
                })} style={{padding:'0.45rem',borderRadius:8,background:'transparent',color:already?'#555':'#fff',border:already?'1px solid #333':'1px solid #fff',cursor:already?'default':'pointer',minWidth:36,fontWeight:600}}>{already ? '✓' : '+'}</button>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(8px)',zIndex:10000,display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'4rem 1rem 2rem',overflowY:'auto'}}>
          <div style={{width:'100%',maxWidth:520,background:'#121212',border:'1px solid #2a2a2a',borderRadius:26,position:'relative',padding:'1.75rem 1.4rem 2.2rem'}}>
            <button onClick={()=>setModalOpen(false)} style={{position:'absolute',top:10,right:14,background:'none',border:'none',color:'#aaa',fontSize:26,cursor:'pointer',lineHeight:1}}>×</button>
            <h3 style={{margin:'0 0 1.25rem',fontSize:20,fontWeight:600,textAlign:'center'}}>Add to this playlist</h3>
            <div style={{position:'relative',marginBottom:'1.25rem'}}>
              <input value={modalSearch} onChange={e=>setModalSearch(e.target.value)} placeholder="Search" style={{width:'100%',padding:'0.8rem 1rem',borderRadius:14,border:'1px solid #303030',background:'#1a1a1a',color:'#fff',fontSize:14}} />
              <span style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',fontSize:16,opacity:.5}}>🔍</span>
            </div>
            <div style={{maxHeight:'55vh',overflowY:'auto',paddingRight:4}}>
              {(modalSearch.trim() ? modalResults : recommendedSongs).map(song => {
                const already = playlistSongs.some(ps => ps.track_url === song.track_url);
                return (
                  <div key={song.track_url} style={{display:'flex',alignItems:'center',padding:'0.55rem 0.4rem',borderBottom:'1px solid #1f1f1f',gap:12}}>
                    <img src={song.cover_url} alt="cover" style={{width:46,height:46,borderRadius:8,objectFit:'cover'}} />
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:14,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{song.title}</div>
                      <div style={{fontSize:12,color:'#aaa'}}>{song.artist}</div>
                    </div>
                    <button disabled={already} onClick={()=>handleAddSong(song)} style={{background:'transparent',color:already?'#555':'#fff',border:already?'1px solid #333':'1px solid #fff',borderRadius:10,padding:'0.55rem 0.8rem',cursor:already?'default':'pointer',fontSize:14,fontWeight:600,minWidth:46}}>
                      {already ? '✓' : '+'}
                    </button>
                  </div>
                );
              })}
              { (modalSearch.trim() && modalResults.length===0) && (
                <div style={{padding:'1rem 0',textAlign:'center',fontSize:14,color:'#888'}}>
                  No results.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
