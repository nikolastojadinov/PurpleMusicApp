import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useYouTube } from './YouTubeContext.jsx';

// Synchronized Lyrics View
export default function LyricsView(){
  const { lyrics, hasLyrics, lyricsVisible, toggleLyricsView, progress, playing } = useYouTube();
  const scrollRef = useRef(null);
  const activeIndexRef = useRef(-1);
  const rafRef = useRef(null);
  const lastScrollTimeRef = useRef(0);
  const [, forceTick] = useState(0); // force re-render on active line change

  const findActiveIndex = useCallback((currentTime) => {
    const arr = lyrics.lines;
    if (!arr.length) return -1;
    // Binary search for the last line with time <= currentTime
    let lo = 0, hi = arr.length -1, ans = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid].time <= currentTime + 0.05) { ans = mid; lo = mid + 1; } else { hi = mid - 1; }
    }
    return ans;
  }, [lyrics.lines]);

  const syncLoop = useCallback(() => {
    if (!lyricsVisible) return; // stop when hidden
    if (playing && lyrics.synced && lyrics.lines.length) {
      const idx = findActiveIndex(progress);
      if (idx !== activeIndexRef.current) {
        activeIndexRef.current = idx;
        forceTick(t=>t+1); // re-render to update highlighting
        // Debounce scroll (no more than every 180ms)
        const now = performance.now();
        if (now - lastScrollTimeRef.current > 180) {
          const node = scrollRef.current?.querySelector?.(`[data-lyric-idx="${idx}"]`);
          if (node && node.scrollIntoView) {
            try { node.scrollIntoView({ behavior:'smooth', block:'center' }); } catch(_) {}
          }
          lastScrollTimeRef.current = now;
        }
      }
    }
    rafRef.current = requestAnimationFrame(syncLoop);
  }, [lyricsVisible, playing, lyrics.synced, lyrics.lines, progress, findActiveIndex]);

  useEffect(() => {
    if (!lyricsVisible) return; // don't start loop if not visible
    rafRef.current = requestAnimationFrame(syncLoop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [lyricsVisible, syncLoop]);

  if (!lyricsVisible) return null;

  return (
    <div style={overlay}>
      <div style={panel}>
        <div style={headerRow}>
          <h2 style={title}>Lyrics</h2>
          <button aria-label="Close lyrics" onClick={toggleLyricsView} style={closeX}>×</button>
        </div>
        <div ref={scrollRef} style={scrollZone}>
          {!hasLyrics && (
            <div style={noLyricsMsg}>No lyrics available for this song.</div>
          )}
          {hasLyrics && lyrics.lines.map((l,i)=>{
            const active = i === activeIndexRef.current;
            return (
              <div key={i} data-lyric-idx={i} style={lineStyle(active)}>
                {l.text || '\u00A0'}
              </div>
            );
          })}
        </div>
        <div style={footerRow}>
          <button onClick={toggleLyricsView} style={backBtn}>Back to Player</button>
        </div>
      </div>
    </div>
  );
}

// Styles
const accent = '#E91E63';
const overlay = { position:'fixed', inset:0, background:'rgba(0,0,0,0.78)', backdropFilter:'blur(10px)', zIndex:5000, display:'flex', alignItems:'center', justifyContent:'center', padding:'34px 22px' };
const panel = { width:'100%', maxWidth:720, maxHeight:'82vh', background:'rgba(18,18,18,0.92)', border:'1px solid #2a2a2a', borderRadius:30, padding:'26px 34px 30px', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px -18px rgba(0,0,0,0.7)' };
const headerRow = { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 };
const title = { margin:0, fontSize:20, fontWeight:600, letterSpacing:.5, color:'#fff' };
const closeX = { background:'transparent', border:'1px solid #333', width:40, height:40, borderRadius:14, color:'#aaa', cursor:'pointer', fontSize:24, lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center' };
const scrollZone = { flex:1, overflowY:'auto', paddingRight:6, scrollBehavior:'smooth' };
const noLyricsMsg = { textAlign:'center', marginTop:60, fontSize:15, color:'#888', fontWeight:500 };
const lineStyle = (active) => ({ padding:'10px 6px', fontSize: active ? 24 : 16, lineHeight:1.5, fontWeight: active ? 700 : 400, color: active ? accent : '#aaa', opacity: active ? 1 : 0.55, textAlign:'center', transition:'all .35s ease', letterSpacing:.3, filter: active ? 'drop-shadow(0 0 6px rgba(233,30,99,0.35))' : 'none' });
const footerRow = { marginTop:24, textAlign:'center' };
const backBtn = { background:accent, border:'none', padding:'12px 36px', borderRadius:30, fontSize:15, fontWeight:600, color:'#fff', cursor:'pointer', boxShadow:'0 10px 28px -10px rgba(233,30,99,0.55)' };
