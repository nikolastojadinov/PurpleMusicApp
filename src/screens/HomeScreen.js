import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import searchYouTube from '../api/youtube';
import { useYouTube } from '../components/YouTubeContext.jsx';
import { loadMusicLibrary } from '../services/libraryLoader';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { play } = useYouTube();
  const [query, setQuery] = useState('');
  const [ytResults, setYtResults] = useState([]);
  const [ytLoading, setYtLoading] = useState(false);
  const [feedSections, setFeedSections] = useState({ top: [], rec: [], trend: [] });
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

  const runSearch = useCallback(async (q) => {
    if (!q.trim()) { setYtResults([]); return; }
    setYtLoading(true);
    const { results, error } = await searchYouTube(q.trim(), 'video');
    if (error) console.error('[Home][YouTube] search error', error);
    setYtResults(results || []);
    setYtLoading(false);
  }, []);

  const onKey = (e) => { if (e.key === 'Enter') runSearch(query); };

  // Initial feed (Top / Recommended / Trending) using some seed searches
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setFeedLoading(true);
        const seeds = [
          { key:'top', q:'Top music 2025' },
          { key:'rec', q:'Recommended pop hits' },
          { key:'trend', q:'Trending global songs' }
        ];
        const out = {};
        for (const s of seeds) {
          const { results } = await searchYouTube(s.q, 'video');
          out[s.key] = (results || []).slice(0, 10);
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

  const Card = ({ item }) => (
    <div onClick={()=>play(item)} role="button" tabIndex={0} onKeyDown={(e)=>{ if(e.key==='Enter') play(item); }} style={{background:'#181818',border:'1px solid #262626',borderRadius:14,padding:10,cursor:'pointer',display:'flex',flexDirection:'column',transition:'background .25s'}}>
      <div style={{position:'relative',aspectRatio:'16 / 9',borderRadius:10,overflow:'hidden',marginBottom:8,background:'#000'}}>
        {item.thumbnailUrl && <img src={item.thumbnailUrl} alt={item.title} style={{width:'100%',height:'100%',objectFit:'cover'}} loading="lazy" />}
      </div>
      <div style={{fontSize:13,fontWeight:600,lineHeight:1.3,marginBottom:4}}>{item.title}</div>
      <div style={{fontSize:11,opacity:.6}}>{item.channelTitle}</div>
    </div>
  );

  return (
    <div className="home-screen" style={{paddingTop:8}}>
      {/* YouTube Search Bar */}
      <div style={{marginBottom:24, position:'sticky', top:0, background:'linear-gradient(180deg,#0d0d0d 70%,rgba(13,13,13,0))', paddingTop:8, zIndex:10}}>
        <input
          value={query}
            onChange={e=>{ setQuery(e.target.value); if(!e.target.value) setYtResults([]); }}
          onKeyDown={onKey}
          placeholder={"Search music… (Ytify style)"}
          style={{width:'100%',background:'#141414',border:'1px solid #262626',padding:'14px 18px',borderRadius:30,color:'#fff',fontSize:14,outline:'none'}}
        />
      </div>

      {/* Search Results or Feed */}
      {query.trim() ? (
        <div style={{animation:'yt-fade .4s ease'}}>
          {ytLoading && <div style={{opacity:.6,fontSize:13}}>Searching…</div>}
          {!ytLoading && ytResults.length === 0 && <div style={{opacity:.5,fontSize:13}}>No results.</div>}
          <div style={{marginTop:20,...gridStyle}}>
            {ytResults.map(r=> <Card key={r.videoId} item={r} />)}
          </div>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:42}}>
          {feedError && <div style={{color:'#f77',fontSize:13}}>{feedError}</div>}
          {feedLoading && <div style={{opacity:.6,fontSize:13}}>Loading feed…</div>}
          {!feedLoading && (
            <>
              <section>
                <h2 style={{margin:'0 0 14px',fontSize:18}}>{'Top Results'}</h2>
                <div style={gridStyle}>{feedSections.top.map(r=> <Card key={r.videoId} item={r} />)}</div>
              </section>
              <section>
                <h2 style={{margin:'0 0 14px',fontSize:18}}>{'Recommended for you'}</h2>
                <div style={gridStyle}>{feedSections.rec.map(r=> <Card key={r.videoId} item={r} />)}</div>
              </section>
              <section>
                <h2 style={{margin:'0 0 14px',fontSize:18}}>{'Trending'}</h2>
                <div style={gridStyle}>{feedSections.trend.map(r=> <Card key={r.videoId} item={r} />)}</div>
              </section>
            </>
          )}
        </div>
      )}
      <style>{`@keyframes yt-fade { from { opacity:0; transform:translateY(10px);} to { opacity:1; transform:translateY(0);} }`}</style>
    </div>
  );
}