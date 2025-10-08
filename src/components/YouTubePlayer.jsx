import React, { useState, useEffect } from 'react';
import { useYouTube } from './YouTubeContext.jsx';
import { fetchLyrics } from '../api/lyrics';

export default function YouTubePlayer() {
  const { current, playlist, mode, next, prev, clear, toggleLyricsView, lyrics, setLyricsData } = useYouTube();
  const [ready, setReady] = useState(false);
  useEffect(()=>{ setReady(false); if(current){ const t = setTimeout(()=>setReady(true), 120); return ()=>clearTimeout(t);} }, [current]);
  if (!current) return null;
  const { videoId, title, thumbnailUrl } = current;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  const isPlaylist = mode === 'playlist' && playlist;
  const loadLyrics = async () => {
    if (!current) return;
    const existing = lyrics.lines && lyrics.lines.length > 0;
    if (!existing) {
      const result = await fetchLyrics(current.channelTitle, current.title);
      setLyricsData(result);
    }
    toggleLyricsView();
  };

  return (
    <div style={{position:'fixed', right:16, bottom:100, width:340, background:'#121212', border:'1px solid #262626', borderRadius:16, padding:12, zIndex:1200, boxShadow:'0 4px 16px rgba(0,0,0,0.5)', fontFamily:'inherit'}}>
      <div style={{display:'flex', alignItems:'center', marginBottom:8, gap:6}}>
        <strong style={{fontSize:13, lineHeight:1.3, flex:1, paddingRight:4}}>{title}</strong>
        {isPlaylist && (
          <span style={{fontSize:11, opacity:.5}}>{playlist.index + 1}/{playlist.items.length}</span>
        )}
        <button onClick={clear} aria-label="Close" style={{background:'transparent', border:'none', color:'#aaa', cursor:'pointer', fontSize:18, lineHeight:1}}>×</button>
      </div>
      <div style={{borderRadius:12, overflow:'hidden', background:'#000', aspectRatio:'16 / 9', position:'relative'}}>
        <iframe
          key={videoId}
          src={embedUrl}
          style={{width:'100%', height:'100%', border:'0'}}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title}
        />
        {!ready && thumbnailUrl && (
          <img src={thumbnailUrl} alt={title} style={{position:'absolute', inset:0, objectFit:'cover', filter:'blur(8px)', opacity:.35}} />
        )}
      </div>
      <div style={{display:'flex', justifyContent:'space-between', marginTop:10, gap:8}}>
        {isPlaylist ? (
          <>
            <button onClick={prev} disabled={playlist.index === 0} style={btnStyle(playlist.index === 0)}>◀</button>
            <button onClick={loadLyrics} style={btnStyle(false)}>Lyrics</button>
            <button onClick={next} disabled={playlist.index >= playlist.items.length - 1} style={btnStyle(playlist.index >= playlist.items.length - 1)}>▶</button>
          </>
        ) : (
          <>
            <div style={{flex:1}} />
            <button onClick={loadLyrics} style={btnStyle(false)}>Lyrics</button>
            <div style={{flex:1}} />
          </>
        )}
      </div>
    </div>
  );
}

function btnStyle(disabled){
  return { background:'#1f1f1f', border:'1px solid #333', color: disabled ? '#555' : '#eee', padding:'6px 14px', borderRadius:8, fontSize:13, cursor: disabled ? 'not-allowed' : 'pointer' };
}
