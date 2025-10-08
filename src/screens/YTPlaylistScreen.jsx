import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPlaylistItems, searchPlaylists } from '../api/youtube';
import { useYouTube } from '../components/YouTubeContext.jsx';

export default function YTPlaylistScreen(){
  const { id } = useParams();
  const { openPlaylist, loadPlaylistItems, playFromPlaylist, playlist } = useYouTube();
  const [meta, setMeta] = useState(null); // { title, thumbnailUrl }
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch playlist metadata via search (cheap) fallback to id pattern
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true); setError(null);
        // Use search to find playlist metadata quickly
        const { results } = await searchPlaylists(id);
        const match = (results || []).find(r => r.playlistId === id) || (results||[])[0];
        if (active) setMeta(match || { title: 'Playlist', thumbnailUrl: null, playlistId: id });
      } catch(e){ if(active) setMeta({ title:'Playlist', thumbnailUrl:null, playlistId:id }); }
      finally { if (active) setLoading(false); }
    })();
    return ()=>{ active=false; };
  }, [id]);

  // Fetch items
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { items: vids } = await fetchPlaylistItems(id);
        if (!active) return;
        setItems(vids);
        // prime context playlist if not already this one
        openPlaylist({ id, title: meta?.title || 'Playlist', thumbnailUrl: meta?.thumbnailUrl, items: vids });
      } catch(e){ if(active) setError('Failed to load playlist'); }
    })();
    return ()=>{ active = false; };
  }, [id, meta?.title, meta?.thumbnailUrl, openPlaylist]);

  return (
    <div style={{padding:'1.5rem 1rem', maxWidth:900, margin:'0 auto'}}>
      {loading && !meta && <div style={{opacity:.6,fontSize:13}}>Loading…</div>}
      {error && <div style={{color:'#f77',fontSize:13}}>{error}</div>}
      {meta && (
        <header style={{display:'flex',gap:24,alignItems:'center',marginBottom:28}}>
          <div style={{width:180,height:100,borderRadius:14,overflow:'hidden',background:'#181818',border:'1px solid #262626',display:'flex',alignItems:'center',justifyContent:'center'}}>
            {meta.thumbnailUrl ? <img src={meta.thumbnailUrl} alt={meta.title} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : <span style={{fontSize:42,opacity:.35}}>♪</span>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <h1 style={{margin:'0 0 6px',fontSize:'1.9rem'}}>{meta.title}</h1>
            <div style={{fontSize:12,opacity:.6}}>{items.length} videos</div>
            <div style={{marginTop:14,display:'flex',gap:12}}>
              <button onClick={()=> playFromPlaylist(0)} style={btnPrimary}>Play All</button>
            </div>
          </div>
        </header>
      )}
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {items.map((v,i)=> (
          <div key={v.videoId} onClick={()=> playFromPlaylist(i)} style={{display:'flex',gap:14,padding:'10px 12px',borderRadius:12,background:'#181818',border:'1px solid #262626',cursor:'pointer',alignItems:'center'}}>
            <span style={{fontSize:11,opacity:.5,width:18,textAlign:'right'}}>{i+1}</span>
            <div style={{width:120,aspectRatio:'16 / 9',borderRadius:8,overflow:'hidden',background:'#000'}}>
              {v.thumbnailUrl && <img src={v.thumbnailUrl} alt={v.title} style={{width:'100%',height:'100%',objectFit:'cover'}} />}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{v.title}</div>
              <div style={{fontSize:11,opacity:.55,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{v.channelTitle}</div>
            </div>
          </div>
        ))}
        {!loading && items.length === 0 && <div style={{opacity:.5,fontSize:13}}>No videos found in this playlist.</div>}
      </div>
    </div>
  );
}

const btnPrimary = { background:'linear-gradient(90deg,#6a00ff,#b700ff)',border:'none',color:'#fff',padding:'10px 20px',fontSize:14,borderRadius:30,cursor:'pointer',fontWeight:600 };
