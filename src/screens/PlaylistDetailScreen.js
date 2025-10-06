import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
// Helper: auto-resize textarea height to fit content (multi-line playlist name)
function autoResize(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 320) + 'px';
}
// Unified: use same loader as global SearchScreen so results are guaranteed even if DB Music table is empty
import { loadMusicLibrary } from '../services/libraryLoader';
import { useGlobalModal } from '../context/GlobalModalContext.jsx';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function PlaylistDetailScreen() {
  const { t } = useTranslation();
  // Debug flag for verbose Supabase logging (set to false to silence)
  const SUPA_DEBUG = true;
  const PLAYLIST_COVER_BUCKET_CANDIDATES = ['playlist-covers', 'playlist covers'];
  const { id: playlistId } = useParams();
  const { show } = useGlobalModal();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [recommendedSongs, setRecommendedSongs] = useState([]);
  const [modalSearch, setModalSearch] = useState('');
  const [modalResults, setModalResults] = useState([]);
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [musicLibrary, setMusicLibrary] = useState([]); // full library loaded from storage / known list
  const [modalOpen, setModalOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const renameRef = useRef(null);
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
      if (SUPA_DEBUG) console.log('[SUPA][PLAYLIST_FETCH] id:', playlistId, 'error:', error, 'data:', data);
      if (error) {
    show(t('errors.generic'), { type: 'error', autoClose: 3000 });
        navigate('/');
        return;
      }
  // Normalize lastUpdated naming variations
  const normalized = { ...data, lastUpdated: data.lastUpdated || data.lastupdated || data.updated_at || data.created_at };
  setPlaylist(normalized);
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
      if (SUPA_DEBUG) console.log('[SUPA][PLAYLIST_ITEMS_FETCH] playlist_id:', playlistId, 'count:', data?.length, 'error:', error, 'dataSample:', data?.[0]);
      setPlaylistSongs(data || []);
    }
    fetchPlaylistSongs();
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
    if (SUPA_DEBUG) console.log('[SUPA][ADD_SONG] inserting', { playlist_id: playlistId, song });
    const { error } = await supabase
      .from('playlist_items')
      .insert({
        playlist_id: playlistId,
        track_url: song.track_url,
        cover_url: song.cover_url,
        title: song.title,
        artist: song.artist
      });
    if (SUPA_DEBUG) console.log('[SUPA][ADD_SONG_RESULT] error:', error);
    if (error) {
  show(t('errors.generic') + ': ' + error.message, { type: 'error', autoClose: 3500 });
      return;
    }
    // Refresh playlist songs
    const { data } = await supabase
      .from('playlist_items')
      .select('track_url, cover_url, title, artist, added_at')
      .eq('playlist_id', playlistId)
      .order('added_at', { ascending: false });
    if (SUPA_DEBUG) console.log('[SUPA][PLAYLIST_ITEMS_POST_INSERT_FETCH] newCount:', data?.length, 'first:', data?.[0]);
    setPlaylistSongs(data || []);
    // If added from modal we can optionally show feedback
  show(t('playlist_detail.added_success', { defaultValue: 'Song added to playlist' }), { type: 'success', autoClose: 1800 });
  }

  // Play preview
  function handlePlaySong(song) {
    const audio = new Audio(song.track_url);
    audio.play();
  }

  // Update playlist name
  const handleSaveName = async () => {
    if (!newName.trim() || !playlist) return setRenameOpen(false);
    if (newName.trim() === playlist.name) return setRenameOpen(false);
    if (SUPA_DEBUG) console.log('[SUPA][PLAYLIST_RENAME] updating id:', playlistId, 'newName:', newName.trim());
    const { data, error } = await supabase
      .from('playlists')
      .update({ name: newName.trim() })
      .eq('id', playlistId)
      .select('*')
      .single();
    if (SUPA_DEBUG) console.log('[SUPA][PLAYLIST_RENAME_RESULT] error:', error, 'data:', data);
    if (error) {
  let msg = t('playlist_detail.rename_error', { defaultValue: 'Rename failed:' }) + ' ' + error.message;
      if (/lastUpdated/i.test(error.message)) {
        msg += '\nTip: U Supabase postoji trigger ili funkcija koja koristi kolonu "lastUpdated" ali ona ne postoji. Rešenja: (1) Dodaj kolonu "lastUpdated" (timestamptz) ili (2) izmeni/droppuj trigger da koristi postojeću kolonu (npr. lastupdated) ili (3) kreiraj novu funkciju sa ispravnim nazivom kolone.';
      }
      show(msg, { type: 'error', autoClose: 6000 });
    } else {
  const normalizedAfterRename = { ...data, lastUpdated: data.lastUpdated || data.lastupdated || data.updated_at || data.created_at };
  setPlaylist(normalizedAfterRename);
  show(t('playlist_detail.rename_success', { defaultValue: 'Playlist name saved.' }), { type: 'success', autoClose: 2000 });
    }
    setRenameOpen(false);
  };

  const startEditName = () => {
    setNewName(playlist?.name || '');
    setRenameOpen(true);
    setTimeout(()=>{
      if (renameRef.current) renameRef.current.focus();
    }, 40);
  };

  const handleCoverClick = () => fileInputRef.current?.click();

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !playlist) return;
    setCoverUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${playlistId}_${Date.now()}.${ext}`;
      if (SUPA_DEBUG) console.log('[SUPA][COVER_UPLOAD_START] path:', path, 'fileName:', file.name, 'size:', file.size);
      let lastErr = null;
      let chosenBucket = null;
      for (const bucketName of PLAYLIST_COVER_BUCKET_CANDIDATES) {
        const { error: attemptErr } = await supabase.storage
          .from(bucketName)
          .upload(path, file, { upsert: true });
        if (SUPA_DEBUG) console.log('[SUPA][COVER_UPLOAD_ATTEMPT]', bucketName, 'error:', attemptErr);
        if (!attemptErr) { chosenBucket = bucketName; lastErr = null; break; }
        lastErr = attemptErr;
        if (!/bucket.*not.*found/i.test(attemptErr?.message || '')) {
          // some other error -> no need to try next
          break;
        }
      }
      if (lastErr) throw lastErr;
      const { data: pub } = supabase.storage.from(chosenBucket).getPublicUrl(path);
      const coverUrl = pub?.publicUrl;
      if (SUPA_DEBUG) console.log('[SUPA][COVER_PUBLIC_URL] bucket:', chosenBucket, 'url:', coverUrl);
      if (SUPA_DEBUG) console.log('[SUPA][COVER_UPDATE_PLAYLIST] id:', playlistId, 'cover_url:', coverUrl);
      const { data, error } = await supabase
        .from('playlists')
        .update({ cover_url: coverUrl })
        .eq('id', playlistId)
        .select('*')
        .single();
      if (SUPA_DEBUG) console.log('[SUPA][COVER_UPDATE_RESULT] error:', error, 'data:', data);
      if (error) throw error;
  const normalizedAfterCover = { ...data, lastUpdated: data.lastUpdated || data.lastupdated || data.updated_at || data.created_at };
  setPlaylist(normalizedAfterCover);
  show(t('playlist_detail.cover_updated', { defaultValue: 'Cover updated.' }), { type: 'success', autoClose: 1800 });
    } catch (err) {
      if (SUPA_DEBUG) console.log('[SUPA][COVER_UPLOAD_EXCEPTION]', err);
      let msg = 'Neuspešan upload covera: ' + (err?.message || 'Nepoznata greška');
      if (/bucket.*not.*found/i.test(err?.message || '')) {
        msg += '\nTip: Trenutno postoji bucket sa imenom drugačijim od očekivanog (npr. "playlist covers"). Možeš: (1) Kreirati novi bucket tačnog imena "playlist-covers" ili (2) ostaviti postojeći sa razmakom – kod sada pokušava oba naziva.';
      } else if (/row-level security/i.test(err?.message || '')) {
        msg += '\nRLS problem: moraš dodati policies za storage.objects za taj bucket. Otvori SQL editor i pokreni:\n' +
          'create policy "playlist covers select" on storage.objects for select using (bucket_id in (\'playlist-covers\', \'playlist covers\'));\n' +
          'create policy "playlist covers insert" on storage.objects for insert with check (bucket_id in (\'playlist-covers\', \'playlist covers\'));';
      }
      show(msg, { type: 'error', autoClose: 6000 });
    } finally {
      setCoverUploading(false);
    }
  };

  if (!playlist) return <div className="playlist-detail-loading">{t('playlist_detail.loading')}</div>;

  return (
    <div className="playlist-detail-screen" style={{maxWidth:720,margin:'0 auto',padding:'2rem 1.25rem'}}>
      <div style={{display:'flex',gap:'1.5rem',alignItems:'center',marginBottom:'2rem'}}>
        <div onClick={handleCoverClick} style={{width:140,height:140,borderRadius:16,background:'#222',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',overflow:'hidden',position:'relative',border:'1px solid #333'}}>
          {playlist.cover_url ? (
            <img src={playlist.cover_url} alt="cover" style={{width:'100%',height:'100%',objectFit:'cover'}} />
          ) : (
            <span style={{fontSize:48,opacity:.4}}>♪</span>
          )}
          <div style={{position:'absolute',bottom:0,left:0,right:0,background:'rgba(0,0,0,0.55)',fontSize:11,padding:'4px 6px',textAlign:'center',letterSpacing:.5}}>{t('playlist_detail.change_cover')}</div>
          {coverUploading && <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#fff'}}>{t('playlist_detail.uploading')}</div>}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleCoverChange} />
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            <div>
              <h1 style={{fontSize:'2.3rem',fontWeight:700,margin:'0 0 4px'}}>{playlist.name}</h1>
              {playlist.lastUpdated && (
                <div style={{fontSize:12,color:'#888'}}>{t('playlist_detail.updated_prefix')} {new Date(playlist.lastUpdated).toLocaleString()}</div>
              )}
            </div>
          </div>
          {(
            <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:10}}>
              <button onClick={startEditName} style={{background:'transparent',color:'#fff',padding:'8px 14px',borderRadius:30,border:'1px solid #444',cursor:'pointer',fontSize:13,fontWeight:500}}>{t('playlist_detail.rename')}</button>
              <button onClick={handleCoverClick} style={{background:'transparent',color:'#fff',padding:'8px 14px',borderRadius:30,border:'1px solid #444',cursor:'pointer',fontSize:13,fontWeight:500}}>{t('playlist_detail.change_cover')}</button>
              <button onClick={()=>setModalOpen(true)} style={{background:'#fff',color:'#000',padding:'8px 18px',borderRadius:30,border:'none',cursor:'pointer',fontWeight:600,display:'flex',alignItems:'center',gap:6,fontSize:14}}>+
                <span>{t('playlist_detail.add_songs')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
  <h2 style={{fontSize:'1.2rem',margin:'1rem 0 1rem'}}>{t('playlist_detail.songs_header')}</h2>
      {playlistSongs.length === 0 ? (
  <div style={{opacity:.65}}>{t('playlist_detail.empty')}</div>
      ) : (
        <div>
          {playlistSongs.map(song => (
            <div key={song.track_url+song.added_at} style={{display:'flex',alignItems:'center',marginBottom:'0.9rem',background:'#1c1c1c',borderRadius:10,padding:'0.55rem 0.75rem',border:'1px solid #262626'}}>
              <img src={song.cover_url} alt="cover" style={{width:48,height:48,borderRadius:8,marginRight:'1rem',objectFit:'cover'}} />
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:14,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{song.title}</div>
                <div style={{color:'#aaa',fontSize:12}}>{song.artist}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(8px)',zIndex:10000,display:'flex',justifyContent:'center',alignItems:'flex-start',padding:'4rem 1rem 2rem',overflowY:'auto'}}>
          <div style={{width:'100%',maxWidth:520,background:'#121212',border:'1px solid #2a2a2a',borderRadius:26,position:'relative',padding:'1.75rem 1.4rem 2.2rem'}}>
            <button onClick={()=>setModalOpen(false)} style={{position:'absolute',top:10,right:14,background:'none',border:'none',color:'#aaa',fontSize:26,cursor:'pointer',lineHeight:1}}>×</button>
            <h3 style={{margin:'0 0 1.25rem',fontSize:20,fontWeight:600,textAlign:'center'}}>{t('playlist_detail.add_to_playlist')}</h3>
            <div style={{position:'relative',marginBottom:'1.25rem'}}>
              <input value={modalSearch} onChange={e=>setModalSearch(e.target.value)} placeholder={t('playlist_detail.search_placeholder')} style={{width:'100%',padding:'0.8rem 1rem',borderRadius:14,border:'1px solid #303030',background:'#1a1a1a',color:'#fff',fontSize:14}} />
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
                  {t('playlist_detail.no_results')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {renameOpen && (
        <div style={{position:'fixed',inset:0,zIndex:10050,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.7)',backdropFilter:'blur(6px)'}} role="dialog" aria-modal="true" onClick={()=>setRenameOpen(false)}>
          <div onClick={e=>e.stopPropagation()} style={{width:'min(92vw,560px)',maxWidth:560,background:'#161616',border:'1px solid #2a2a2a',borderRadius:26,padding:'2rem 1.75rem 1.9rem',boxShadow:'0 20px 55px -18px rgba(0,0,0,0.65),0 0 0 1px rgba(255,255,255,0.05)'}}>
            <h3 style={{margin:0,fontSize:22,fontWeight:600,textAlign:'center',letterSpacing:.4}}>{t('playlist_detail.rename_title')}</h3>
            <p style={{margin:'0.75rem 0 1.25rem',fontSize:13,lineHeight:1.5,color:'#999',textAlign:'center'}}>{t('playlist_detail.rename_help')}</p>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <textarea ref={renameRef} value={newName} onChange={e=>{ setNewName(e.target.value.slice(0,160)); autoResize(renameRef.current); }} onKeyDown={e=>{ if(e.key==='Enter' && (e.metaKey||e.ctrlKey)) { handleSaveName(); } if(e.key==='Escape'){ setRenameOpen(false);} }} style={{resize:'none',overflow:'hidden',width:'100%',background:'#0f0f0f',color:'#fff',border:'1px solid #333',borderRadius:18,padding:'14px 16px',fontSize:20,fontWeight:600,lineHeight:1.2,letterSpacing:.3,boxShadow:'0 4px 18px -6px rgba(0,0,0,0.6)'}} placeholder={t('playlist_detail.name_placeholder')} rows={1} />
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#666',padding:'0 4px'}}>
                <span>{newName.length}/160</span>
                <span>{t('playlist_detail.save_hint')}</span>
              </div>
              <div style={{display:'flex',gap:14,marginTop:4}}>
                <button onClick={()=>setRenameOpen(false)} style={{flex:1,background:'linear-gradient(135deg,#2a2a2a,#202020)',color:'#bbb',border:'1px solid #333',borderRadius:16,padding:'14px 18px',fontSize:14,fontWeight:600,cursor:'pointer'}}>{t('common.cancel')}</button>
                <button disabled={!newName.trim() || newName.trim()===playlist.name} onClick={handleSaveName} style={{flex:1,background: (!newName.trim()|| newName.trim()===playlist.name)?'linear-gradient(135deg,#1db95455,#16994344)':'linear-gradient(135deg,#1db954,#169943)',color:'#fff',border:'none',borderRadius:16,padding:'14px 18px',fontSize:14,fontWeight:700,cursor:(!newName.trim()|| newName.trim()===playlist.name)?'not-allowed':'pointer',boxShadow:'0 8px 24px -10px rgba(0,0,0,0.6)'}}>{t('common.save')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
