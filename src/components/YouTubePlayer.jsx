import React, { useState, useEffect } from 'react';
import { useYouTube } from './YouTubeContext.jsx';

export default function YouTubePlayer() {
  const { current, clear } = useYouTube();
  const [ready, setReady] = useState(false);
  useEffect(()=>{ setReady(true); }, [current]);
  if (!current) return null;
  const { videoId, title, thumbnailUrl } = current;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  return (
    <div style={{position:'fixed', right:16, bottom:100, width:320, background:'#121212', border:'1px solid #262626', borderRadius:16, padding:12, zIndex:1200, boxShadow:'0 4px 16px rgba(0,0,0,0.5)'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
        <strong style={{fontSize:13, lineHeight:1.3, flex:1, paddingRight:8}}>{title}</strong>
        <button onClick={clear} aria-label="Close" style={{background:'transparent', border:'none', color:'#aaa', cursor:'pointer', fontSize:18, lineHeight:1}}>×</button>
      </div>
      <div style={{borderRadius:12, overflow:'hidden', background:'#000', aspectRatio:'16 / 9'}}>
        <iframe
          key={videoId}
          src={embedUrl}
          style={{width:'100%', height:'100%', border:'0'}}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title}
        />
      </div>
      {!ready && thumbnailUrl && (
        <img src={thumbnailUrl} alt={title} style={{position:'absolute', inset:12, objectFit:'cover', width:'calc(100% - 24px)', height:'180px', filter:'blur(4px)', opacity:.4}} />
      )}
    </div>
  );
}
