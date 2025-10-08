import React, { useEffect, useRef } from 'react';
import { useYouTube } from './YouTubeContext.jsx';
import { fetchLyrics } from '../api/lyrics';

// UnifiedPlayer: mini + fullscreen player. Audio-first; video shown in overlay iframe when playbackMode === 'video'.
export default function UnifiedPlayer(){
  const { current, playlist, playing, playCurrent, pauseCurrent, progress, setProgress, duration, setDuration, seekTo, expanded, toggleExpanded, playbackMode, toggleVideoMode, lyrics, setLyricsData, toggleLyricsView, repeat, cycleRepeat, shuffle, toggleShuffle } = useYouTube();
  const audioRef = useRef(null);
  const iframeRef = useRef(null);
  const lastVideoId = useRef(null);

  // Load audio source from YouTube watch URL (placeholder: using embed audio via iframe only if video mode; otherwise silent audio stub).
  useEffect(() => {
    if (!current) return;
    // For now no direct audio stream (YouTube TOS) – we rely on iframe for video mode; simulate duration unknown.
    setDuration(0);
    setProgress(0);
  }, [current, setDuration, setProgress]);

  // Simulate progress ticking when playing (since no direct audio element in this simplified scaffold) – placeholder until real audio available.
  useEffect(() => {
    if (!playing) return;
    let raf; let start = performance.now();
    const loop = (ts) => {
      if (!playing) return;
      const delta = (ts - start) / 1000;
      start = ts;
      setProgress(p => p + delta);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, setProgress]);

  const togglePlay = () => { playing ? pauseCurrent() : playCurrent(); };

  const pct = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;

  const openLyrics = async () => {
    if (!current) return;
    if (!lyrics.lines.length) {
      const res = await fetchLyrics(current.channelTitle, current.title);
      setLyricsData(res);
    }
    toggleLyricsView();
  };

  if (!current) return null;

  return (
    <>
      {/* Mini Player */}
      {!expanded && (
        <div style={miniWrap} onClick={toggleExpanded}>
          <div style={{display:'flex',alignItems:'center',gap:12,flex:1,minWidth:0}}>
            <div style={{width:54,height:54,borderRadius:14,overflow:'hidden',background:'#111',flexShrink:0}}>
              {current.thumbnailUrl && <img src={current.thumbnailUrl} alt={current.title} style={{width:'100%',height:'100%',objectFit:'cover'}} />}
            </div>
            <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column'}}>
              <span style={{fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{current.title}</span>
              <span style={{fontSize:11,opacity:.6,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{current.channelTitle}</span>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}} onClick={e=>e.stopPropagation()}>
            <button onClick={togglePlay} style={iconBtn}>{playing ? '❚❚' : '▶'}</button>
          </div>
        </div>
      )}
      {/* Fullscreen Player */}
      {expanded && (
        <div style={fullOverlay}>
          <div style={fullInner}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <button onClick={toggleExpanded} style={closeBtn}>↓</button>
              <div style={{fontSize:12,opacity:.6}}>{playlist ? `${playlist.index+1}/${playlist.items.length}` : 'Single'}</div>
              <div style={{width:36}} />
            </div>
            <div style={artWrap}> {current.thumbnailUrl && <img src={current.thumbnailUrl} alt={current.title} style={artImg} />} </div>
            <div style={{textAlign:'center',marginTop:30}}>
              <h1 style={{margin:'0 0 6px',fontSize:'1.4rem',fontWeight:600}}>{current.title}</h1>
              <div style={{fontSize:13,opacity:.65}}>{current.channelTitle}</div>
            </div>
            {/* Progress Bar */}
            <div style={{marginTop:30}}>
              <div style={progressBar} onClick={(e)=>{
                if(!duration) return; const rect=e.currentTarget.getBoundingClientRect(); const x=e.clientX-rect.left; const p=x/rect.width; seekTo(p*duration);
              }}>
                <div style={{...progressFill,width:`${pct}%`}} />
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,opacity:.55,marginTop:4}}>
                <span>{formatTime(progress)}</span>
                <span>{duration?formatTime(duration):'--:--'}</span>
              </div>
            </div>
            {/* Controls */}
            <div style={controlsRow}>
              <button style={ctrlBtn(shuffle)} onClick={toggleShuffle}>⇄</button>
              <button style={ctrlBtn(false)}>⏮</button>
              <button style={playBtn} onClick={togglePlay}>{playing ? 'Pause' : 'Play'}</button>
              <button style={ctrlBtn(false)}>⏭</button>
              <button style={ctrlBtn(repeat!=='off')} onClick={cycleRepeat}>{repeat==='one'?'①':repeat==='all'?'∞':'↻'}</button>
            </div>
            {/* Action Row */}
            <div style={actionRow}>
              <button style={actBtn(playbackMode==='video')} onClick={toggleVideoMode}>Video</button>
              <button style={actBtn(!!lyrics.lines.length)} onClick={openLyrics}>Lyrics</button>
              <button style={actBtn(false)}>Share</button>
              <button style={actBtn(false)}>♥</button>
            </div>
          </div>
          {playbackMode === 'video' && (
            <div style={videoOverlay}>
              <div style={videoInner}>
                <button onClick={toggleVideoMode} style={videoClose}>×</button>
                <iframe
                  ref={iframeRef}
                  title={current.title}
                  src={`https://www.youtube.com/embed/${current.videoId}?autoplay=1&enablejsapi=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{width:'100%',height:'100%',border:0,borderRadius:18}}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function formatTime(s){ if(!s) return '0:00'; const m=Math.floor(s/60); const sec=Math.floor(s%60).toString().padStart(2,'0'); return `${m}:${sec}`; }

const accent = '#E91E63';
const miniWrap = { position:'fixed', left:0, right:0, bottom:70, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)', padding:'10px 14px', display:'flex', alignItems:'center', borderTop:'1px solid #1e1e1e', zIndex:1200 };
const iconBtn = { background:accent, border:'none', color:'#fff', width:44, height:44, borderRadius:14, cursor:'pointer', fontWeight:600, fontSize:15 };
const fullOverlay = { position:'fixed', inset:0, background:'rgba(0,0,0,0.95)', backdropFilter:'blur(16px)', zIndex:3000, display:'flex', flexDirection:'column' };
const fullInner = { flex:1, padding:'20px 26px 40px', display:'flex', flexDirection:'column', maxWidth:640, width:'100%', margin:'0 auto' };
const artWrap = { width:'100%', maxWidth:420, aspectRatio:'1/1', margin:'0 auto', borderRadius:32, overflow:'hidden', background:'#111', boxShadow:'0 20px 60px -25px rgba(0,0,0,0.8)' };
const artImg = { width:'100%', height:'100%', objectFit:'cover' };
const progressBar = { position:'relative', height:6, borderRadius:4, background:'#222', overflow:'hidden', cursor:'pointer' };
const progressFill = { position:'absolute', left:0, top:0, bottom:0, background:accent, borderRadius:4, transition:'width .25s linear' };
const controlsRow = { display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:34 };
const ctrlBtn = (active) => ({ background: active ? accent : '#1d1d1d', color: active ? '#fff':'#eee', border:'none', width:50, height:50, borderRadius:18, fontSize:16, cursor:'pointer', fontWeight:600 });
const playBtn = { background:accent, border:'none', color:'#fff', padding:'14px 34px', borderRadius:24, fontSize:16, fontWeight:700, cursor:'pointer', boxShadow:'0 8px 24px -6px rgba(233,30,99,0.55)' };
const actionRow = { display:'flex', justifyContent:'space-around', marginTop:36 };
const actBtn = (active) => ({ background: active ? accent : '#1f1f1f', border:'none', color:'#fff', padding:'10px 18px', borderRadius:20, fontSize:13, fontWeight:600, cursor:'pointer' });
const closeBtn = { background:'#1f1f1f', border:'1px solid #333', width:42, height:42, borderRadius:14, color:'#fff', cursor:'pointer', fontSize:20, lineHeight:1 };
const videoOverlay = { position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:4000, padding:'40px 20px' };
const videoInner = { width:'100%', maxWidth:900, aspectRatio:'16/9', position:'relative' };
const videoClose = { position:'absolute', top:-50, right:0, background:accent, border:'none', color:'#fff', width:46, height:46, borderRadius:16, cursor:'pointer', fontSize:20 };