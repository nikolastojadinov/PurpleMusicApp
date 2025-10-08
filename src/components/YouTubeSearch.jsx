import React, { useState, useCallback, useRef } from 'react';
import searchYouTube from '../api/youtube';
import { useYouTube } from './YouTubeContext.jsx';

const tabs = [
  { key: 'video', label: 'YouTube' },
  { key: 'ytmusic', label: 'YtMusic' }
];

export default function YouTubeSearch() {
  const { play } = useYouTube();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('video');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // internal only, not shown


  const activeReq = useRef(0);
  const doSearch = useCallback(async (q, type) => {
    const PATTERN_TOKENS = ['did not match','expected pattern'];
    const isPattern = (m) => {
      if (!m) return false; const low = String(m).toLowerCase();
      return PATTERN_TOKENS.every(t=> low.includes(t));
    };
    const runId = ++activeReq.current;
    try {
      const trimmed = (q||'').trim();
      if (!trimmed) return;
      setLoading(true); setError(null);
      const { results: r, error: err } = await searchYouTube(trimmed, type === 'video' ? 'video' : 'video');
      if (runId !== activeReq.current) return; // stale
      if (err) {
        const msg = err?.message || err;
        if (!isPattern(msg)) {
          setError(err);
          if (process.env.NODE_ENV !== 'production') console.warn('[YouTubeSearch] search note', err);
        } else if (process.env.NODE_ENV !== 'production') {
          console.info('[YouTubeSearch] suppressed pattern error');
        }
      }
      setResults(r || []);
    } catch(err) {
      if (runId !== activeReq.current) return;
      const msg = err?.message || err;
      if (process.env.NODE_ENV !== 'production' && !isPattern(msg)) {
        console.warn('[YouTubeSearch] unexpected search exception', err);
      }
    } finally {
      if (runId === activeReq.current) setLoading(false);
    }
  }, []);

  // 300ms debounce wrapper
  const debounceRef = useRef(null);
  const runSearch = useCallback((q, type) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(q, type), 300);
  }, [doSearch]);

  const onKey = (e) => { if (e.key === 'Enter') runSearch(query, activeTab); };

  return (
    <div style={{marginTop:24}}>
      <div style={{display:'flex', gap:12, marginBottom:12}}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={()=> setActiveTab(t.key)}
            style={{
              background: activeTab === t.key ? 'linear-gradient(135deg,#6d28d9,#8b5cf6)' : '#1e1e1e',
              border: '1px solid #2e2e2e',
              padding: '8px 16px',
              borderRadius: 24,
              color:'#fff',
              cursor:'pointer',
              fontWeight:600,
              fontSize:13,
              letterSpacing:.5
            }}
          >{t.label}</button>
        ))}
      </div>
      <input
        value={query}
        onChange={e=>setQuery(e.target.value)}
        onKeyDown={onKey}
        placeholder="Search YouTube… (e.g. Ellie Goulding - Love Me Like You Do)"
        style={{width:'100%', background:'#141414', border:'1px solid #2a2a2a', padding:'12px 16px', borderRadius:14, color:'#fff', fontSize:14}}
      />
      <div style={{marginTop:20, minHeight:60}}>
        {loading && <div style={{opacity:.7,fontSize:13}}>Searching…</div>}
  {/* Error UI intentionally suppressed */}
        {!loading && !error && results.length === 0 && query && (
          <div style={{opacity:.6,fontSize:13}}>No results found.</div>
        )}
        <div style={{display:'grid', gap:16, gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', marginTop: results.length?24:0, animation:'yt-fade .5s ease'}}>          
          {results.map(r => (
            <div key={r.videoId} style={{background:'#1b1b1b', border:'1px solid #262626', borderRadius:14, padding:10, display:'flex', flexDirection:'column', position:'relative'}}>
              <div style={{position:'relative', borderRadius:10, overflow:'hidden', aspectRatio:'16 / 9', marginBottom:8}}>
                {r.thumbnailUrl && <img src={r.thumbnailUrl} alt={r.title} style={{width:'100%', height:'100%', objectFit:'cover'}} loading="lazy" />}
                {r.duration && (<span style={{position:'absolute', right:6, bottom:6, background:'rgba(0,0,0,0.65)', padding:'2px 6px', borderRadius:6, fontSize:11, fontWeight:600}}>{r.duration}</span>)}
              </div>
              <div style={{flex:1, display:'flex', flexDirection:'column'}}>
                <div style={{fontSize:13, fontWeight:600, lineHeight:1.3, marginBottom:6, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{r.title}</div>
                <div style={{fontSize:11, opacity:.6, marginBottom:8, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{r.channelTitle}</div>
                <button onClick={()=>play(r)} style={{marginTop:'auto', background:'#6d28d9', border:'none', color:'#fff', padding:'8px 12px', borderRadius:22, fontSize:12, fontWeight:600, cursor:'pointer'}}>Play</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes yt-fade { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }`}</style>
    </div>
  );
}
