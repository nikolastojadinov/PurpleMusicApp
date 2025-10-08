import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import searchYouTube, { searchPlaylists } from '../api/youtube';
import { useYouTube } from '../components/YouTubeContext.jsx';
import { loadMusicLibrary } from '../services/libraryLoader';
import { useNavigate } from 'react-router-dom';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { play, openPlaylist } = useYouTube();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [ytResults, setYtResults] = useState([]);
  const [ytLoading, setYtLoading] = useState(false);
  const [feedSections, setFeedSections] = useState({ top: [], rec: [], trend: [] }); // now playlists
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState(null);
  const [localSongs, setLocalSongs] = useState([]);

  // Load local library (still used for recommendation mixing later)
  useEffect(() => {
    (async () => {
      try {
        const list = await loadMusicLibrary();
        setLocalSongs(list);
      } catch(e) { /* ignore */ }
    })();
  }, []);

  const [ytError, setYtError] = useState(null);
  const runSearch = useCallback(async (q) => {
    if (!q.trim()) { setYtResults([]); setYtError(null); return; }
    setYtLoading(true); setYtError(null);
    const { results, error } = await searchYouTube(q.trim(), 'video');
    if (error) {
      let msg = 'Search failed.';
      if (error === 'proxy_error') msg = 'YouTube proxy error.';
      else if (error === 'network') msg = 'Network error while searching.';
      setYtError(msg);
      console.error('[Home][YouTube] search error', error);
    }
    setYtResults(results || []);
    setYtLoading(false);
  }, []);

  const onKey = (e) => { if (e.key === 'Enter') runSearch(query); };

  // Incremental suggestions (debounced video search)
  const [suggestions, setSuggestions] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const suggestAbort = useRef(null);
  useEffect(() => {
    const q = query.trim();
    if (!q) { setSuggestions([]); return; }
    setSuggestLoading(true);
    const handle = setTimeout(async () => {
      // cancel prev
      if (suggestAbort.current) suggestAbort.current.abort();
      suggestAbort.current = new AbortController();
      try {
        const { results } = await searchYouTube(q); // reusing video search
        setSuggestions((results || []).slice(0,6));
      } catch(_) { /* silent */ }
      setSuggestLoading(false);
    }, 300);
    return () => { clearTimeout(handle); if (suggestAbort.current) suggestAbort.current.abort(); };
  }, [query]);

  // Initial feed (Top / Recommended / Trending) using playlist searches
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setFeedLoading(true);
        const seeds = [
          { key:'top', q:'Official music playlist' },
          { key:'rec', q:'Pop hits playlist' },
          { key:'trend', q:'Trending music mix playlist' }
        ];
        const out = {};
        for (const s of seeds) {
          const { results } = await searchPlaylists(s.q);
          out[s.key] = (results || []).slice(0, 8);
          if (!active) return;
        }
        if (active) setFeedSections(out);
      } catch(err){
        if (active) setFeedError(err.message);
      } finally {
        if (active) setFeedLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const gridStyle = {
    display:'grid',
    gap:16,
    gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))'
  };

  const VideoCard = ({ item }) => (
    <div onClick={()=>play(item)} role="button" tabIndex={0} onKeyDown={(e)=>{ if(e.key==='Enter') play(item); }} style={{background:'#181818',border:'1px solid #262626',borderRadius:14,padding:10,cursor:'pointer',display:'flex',flexDirection:'column',transition:'background .25s',position:'relative'}}>
      <div style={{position:'relative',aspectRatio:'16 / 9',borderRadius:10,overflow:'hidden',marginBottom:8,background:'#000'}}>
        {item.thumbnailUrl && <img src={item.thumbnailUrl} alt={item.title} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy" />}
      </div>
      <div style={{fontSize:13,fontWeight:600,lineHeight:1.3,marginBottom:4,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{item.title}</div>
      <div style={{fontSize:11,opacity:.6,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{item.channelTitle}</div>
    </div>
  );

  const PlaylistCard = ({ item }) => (
    <div onClick={()=> navigate(`/yt/playlist/${encodeURIComponent(item.playlistId)}`)} role="button" tabIndex={0} onKeyDown={(e)=>{ if(e.key==='Enter') navigate(`/yt/playlist/${encodeURIComponent(item.playlistId)}`); }} style={{background:'#181818',border:'1px solid #262626',borderRadius:14,padding:10,cursor:'pointer',display:'flex',flexDirection:'column',transition:'background .25s',position:'relative'}}>
      <div style={{position:'relative',aspectRatio:'16 / 9',borderRadius:10,overflow:'hidden',marginBottom:8,background:'#000'}}>
        {item.thumbnailUrl && <img src={item.thumbnailUrl} alt={item.title} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy" />}
        <span style={{position:'absolute',top:6,right:6,background:'rgba(0,0,0,0.55)',padding:'2px 6px',borderRadius:6,fontSize:10,letterSpacing:.5}}>PLAYLIST</span>
      </div>
      <div style={{fontSize:13,fontWeight:600,lineHeight:1.3,marginBottom:4,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{item.title}</div>
      <div style={{fontSize:11,opacity:.6,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{item.channelTitle}</div>
    </div>
  );

  return (
    <div className="home-screen" style={{paddingTop:8}}>
      {/* YouTube Search Bar */}
      <div style={{marginBottom:24, position:'sticky', top:0, background:'linear-gradient(180deg,#0d0d0d 70%,rgba(13,13,13,0))', paddingTop:8, zIndex:30}}>
        <div style={{position:'relative'}}>
          <input
            value={query}
            onChange={e=>{ setQuery(e.target.value); if(!e.target.value){ setYtResults([]); setSuggestions([]);} }}
            onKeyDown={onKey}
            placeholder={"Search music… (Ytify style)"}
            style={{width:'100%',background:'#141414',border:'1px solid #262626',padding:'14px 18px',borderRadius:30,color:'#fff',fontSize:14,outline:'none'}}
          />
          {query.trim() && suggestions.length > 0 && (
            <div style={{position:'absolute',top:'100%',left:0,right:0,background:'#141414',border:'1px solid #262626',borderRadius:18,padding:'8px 6px',marginTop:6,display:'flex',flexDirection:'column',gap:4,maxHeight:260,overflowY:'auto',boxShadow:'0 8px 24px rgba(0,0,0,0.5)',zIndex:40}}>
              {suggestions.map(s => (
                <div key={s.videoId} onClick={()=>{ play(s); setQuery(s.title); setSuggestions([]); }} style={{padding:'6px 10px',borderRadius:12,cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',gap:10,background:'#1a1a1a'}}>
                  {s.thumbnailUrl && <img src={s.thumbnailUrl} alt="thumb" style={{width:42,height:24,objectFit:'cover',borderRadius:6}} />}
                  <span style={{flex:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.title}</span>
                </div>
              ))}
              {suggestLoading && <div style={{fontSize:11,opacity:.6,textAlign:'center',padding:'4px 0'}}>Loading…</div>}
            </div>
          )}
        </div>
      </div>

      {/* Search Results or Feed */}
      {query.trim() ? (
        <div style={{animation:'yt-fade .4s ease'}}>
          {ytLoading && <div style={{opacity:.6,fontSize:13}}>Searching…</div>}
          {ytError && !ytLoading && <div style={{color:'#f77',fontSize:13}}>{ytError}</div>}
          {!ytLoading && !ytError && ytResults.length === 0 && <div style={{opacity:.5,fontSize:13}}>No results.</div>}
          <div style={{marginTop:20,...gridStyle}}>
            {ytResults.map(r=> <VideoCard key={r.videoId} item={r} />)}
          </div>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:42}}>
          {feedError && <div style={{color:'#f77',fontSize:13}}>{feedError}</div>}
          {feedLoading && <div style={{opacity:.6,fontSize:13}}>Loading feed…</div>}
          {!feedLoading && (
            <>
              <section>
                <h2 style={{margin:'0 0 14px',fontSize:18}}>{'Top Playlists'}</h2>
                <div style={gridStyle}>{feedSections.top.map(r=> <PlaylistCard key={r.playlistId} item={r} />)}</div>
              </section>
              <section>
                <h2 style={{margin:'0 0 14px',fontSize:18}}>{'Recommended Playlists'}</h2>
                <div style={gridStyle}>{feedSections.rec.map(r=> <PlaylistCard key={r.playlistId} item={r} />)}</div>
              </section>
              <section>
                <h2 style={{margin:'0 0 14px',fontSize:18}}>{'Trending Playlists'}</h2>
                <div style={gridStyle}>{feedSections.trend.map(r=> <PlaylistCard key={r.playlistId} item={r} />)}</div>
              </section>
            </>
          )}
        </div>
      )}
      <style>{`@keyframes yt-fade { from { opacity:0; transform:translateY(10px);} to { opacity:1; transform:translateY(0);} }`}</style>
    </div>
  );
}