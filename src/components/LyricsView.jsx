import React, { useEffect, useRef } from 'react';
import { useYouTube } from './YouTubeContext.jsx';

// Expected lyrics format: { lines: [ { time?: number (seconds), text: string } ], synced: boolean }
export default function LyricsView(){
  const { lyrics, lyricsVisible, toggleLyricsView } = useYouTube();
  const containerRef = useRef(null);
  const activeIndexRef = useRef(0);

  // Auto-scroll placeholder: In real integration you'd listen to audio time updates.
  useEffect(() => {
    if (!lyrics.synced) return; // no auto-scroll for unsynced yet
  }, [lyrics]);

  if (!lyricsVisible) return null;

  return (
    <div style={overlayStyle}>
      <div style={panelStyle} ref={containerRef}>
        <header style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <h2 style={{margin:0,fontSize:18,color:'#fff'}}>Lyrics</h2>
          <button onClick={toggleLyricsView} style={closeBtn}>×</button>
        </header>
        <div style={lyricsScroll}>
          {lyrics.lines.length === 0 && (
            <div style={{textAlign:'center',opacity:.4,fontSize:14,marginTop:40}}>Lyrics unavailable</div>
          )}
          {lyrics.lines.map((l,i)=>(
            <div key={i} style={{padding:'6px 4px',fontSize:15,lineHeight:1.5,color:i===activeIndexRef.current?'#E91E63':'#fff',opacity:i===activeIndexRef.current?1:0.55,fontWeight:i===activeIndexRef.current?600:400,transition:'color .3s, opacity .3s'}}>
              {l.text}
            </div>
          ))}
        </div>
        <div style={{marginTop:16,textAlign:'center'}}>
          <button onClick={toggleLyricsView} style={closePrimary}>Back to Player</button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = { position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:4000, padding:'30px 20px' };
const panelStyle = { width:'100%', maxWidth:600, maxHeight:'80vh', background:'rgba(20,20,20,0.9)', border:'1px solid #2a2a2a', borderRadius:24, padding:'24px 28px', display:'flex', flexDirection:'column', boxShadow:'0 12px 48px -8px rgba(0,0,0,0.7)' };
const lyricsScroll = { flex:1, overflowY:'auto', paddingRight:4 };
const closeBtn = { background:'transparent', border:'1px solid #333', width:36, height:36, borderRadius:12, color:'#aaa', cursor:'pointer', fontSize:20, lineHeight:1 };
const closePrimary = { background:'#E91E63', border:'none', padding:'10px 26px', color:'#fff', fontSize:14, borderRadius:30, fontWeight:600, cursor:'pointer' };
