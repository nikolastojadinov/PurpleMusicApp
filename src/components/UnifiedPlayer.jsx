import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useYouTube } from './YouTubeContext.jsx';
import { fetchLyrics } from '../api/lyrics';

export default function UnifiedPlayer(){
  const { current, playlist, playing, playCurrent, pauseCurrent, progress, setProgress, duration, setDuration, seekTo, expanded, toggleExpanded, playbackMode, toggleVideoMode, lyrics, setLyricsData, toggleLyricsView, repeat, cycleRepeat, shuffle, toggleShuffle, playFromPlaylist } = useYouTube();
  const iframeContainerRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const rafRef = useRef(null);
  const lastVideoId = useRef(null);
  const touchStartY = useRef(null);
  const dragDelta = useRef(0);
  const [dragStyle, setDragStyle] = useState(null);

  // Guard: no player if nothing selected
  if (!current) return null;

  // Ensure YouTube IFrame API present
  useEffect(() => {
    if (window.YT && window.YT.Player) return;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }, []);

  // Build / rebuild player when videoId changes (video mode only)
  useEffect(() => {
    if (playbackMode !== 'video') return; // only create in video mode
    if (!current?.videoId) return;
    if (!window.YT || !window.YT.Player) return; // API not ready yet
    if (!iframeContainerRef.current) return;
    if (lastVideoId.current === current.videoId && ytPlayerRef.current) return;
    lastVideoId.current = current.videoId;
    try { ytPlayerRef.current?.destroy?.(); } catch(_) {}
    ytPlayerRef.current = new window.YT.Player(iframeContainerRef.current, {
      videoId: current.videoId,
      playerVars: { autoplay:1, rel:0, playsinline:1 },
      events: {
        onReady: (e) => { setDuration(e.target.getDuration()); playCurrent(); startProgressLoop(); },
        onStateChange: (e) => {
          if (e.data === window.YT.PlayerState.PLAYING) { playCurrent(); setDuration(e.target.getDuration()); startProgressLoop(); }
          else if (e.data === window.YT.PlayerState.PAUSED) { pauseCurrent(); cancelProgressLoop(); }
          else if (e.data === window.YT.PlayerState.ENDED) { handleEnded(); }
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.videoId, playbackMode]);

  const startProgressLoop = () => {
    cancelProgressLoop();
    const loop = () => {
      if (ytPlayerRef.current?.getCurrentTime) {
        setProgress(ytPlayerRef.current.getCurrentTime());
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };
  const cancelProgressLoop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  useEffect(() => () => cancelProgressLoop(), []);

  const handleEnded = useCallback(() => {
    if (repeat === 'one') { seekTo(0); playCurrent(); return; }
    if (playlist && playlist.items && playlist.index < playlist.items.length -1) { playFromPlaylist(playlist.index + 1); return; }
    if (repeat === 'all' && playlist?.items?.length) { playFromPlaylist(0); return; }
    pauseCurrent();
  }, [playlist, repeat, playFromPlaylist, seekTo, playCurrent, pauseCurrent]);

  const nextTrack = () => {
    if (playlist && playlist.items && playlist.index < playlist.items.length -1) playFromPlaylist(playlist.index +1); else if (repeat === 'all' && playlist) playFromPlaylist(0);
  };
  const prevTrack = () => {
    if (playlist && playlist.items && playlist.index >0) playFromPlaylist(playlist.index -1); else seekTo(0);
  };

  const togglePlay = () => {
    if (playbackMode === 'video' && ytPlayerRef.current) {
      const state = ytPlayerRef.current.getPlayerState();
      if (state === window.YT.PlayerState.PLAYING) { ytPlayerRef.current.pauseVideo(); pauseCurrent(); }
      else { ytPlayerRef.current.playVideo(); playCurrent(); }
    } else {
      playing ? pauseCurrent() : playCurrent();
    }
  };

  const pct = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;

  // Seek logic (video only right now)
  const handleSeek = (e) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left; const p = x / rect.width; const target = p * duration;
    seekTo(target);
    try { ytPlayerRef.current?.seekTo?.(target, true); } catch(_) {}
  };

  // Persistence (basic)
  useEffect(() => {
    try { localStorage.setItem('pm_playback_session', JSON.stringify({ current, progress, repeat, shuffle, playlistIndex: playlist?.index })); } catch(_) {}
  }, [current, progress, repeat, shuffle, playlist?.index]);

  // Lyrics open
  const openLyrics = async () => {
    if (!lyrics.lines.length) {
      const res = await fetchLyrics(current.channelTitle, current.title);
      setLyricsData(res);
    }
    toggleLyricsView();
  };

  // Swipe down gesture on fullscreen
  const onTouchStart = (e) => { if (e.touches.length === 1) { touchStartY.current = e.touches[0].clientY; } };
  const onTouchMove = (e) => {
    if (!touchStartY.current) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0) {
      dragDelta.current = dy;
      setDragStyle({ transform:`translateY(${dy}px)`, opacity: Math.max(0.25, 1 - dy/500) });
    }
  };
  const onTouchEnd = () => {
    if (dragDelta.current > 140) {
      setDragStyle(null); dragDelta.current = 0; touchStartY.current=null; toggleExpanded();
    } else {
      setDragStyle({ transition:'transform .25s ease, opacity .25s ease', transform:'translateY(0)', opacity:1 });
      setTimeout(()=> setDragStyle(null), 260);
      dragDelta.current = 0; touchStartY.current=null;
    }
  };

  return (
    <>
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
      {expanded && (
        <div style={{...fullOverlay, ...(dragStyle||{})}} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          <div style={fullInner}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <button onClick={toggleExpanded} style={closeBtn}>↓</button>
              <div style={{fontSize:12,opacity:.6}}>{playlist ? `${playlist.index+1}/${playlist.items.length}` : 'Single'}</div>
              <div style={{width:36}} />
            </div>
            <div style={artWrap}>{current.thumbnailUrl && <img src={current.thumbnailUrl} alt={current.title} style={artImg} />}</div>
            <div style={{textAlign:'center',marginTop:30}}>
              <h1 style={{margin:'0 0 6px',fontSize:'1.4rem',fontWeight:600}}>{current.title}</h1>
              <div style={{fontSize:13,opacity:.65}}>{current.channelTitle}</div>
            </div>
            <div style={{marginTop:30}}>
              <div style={progressBar} onClick={handleSeek}>
                <div style={{...progressFill,width:`${pct}%`}} />
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,opacity:.55,marginTop:4}}>
                <span>{formatTime(progress)}</span>
                <span>{duration?formatTime(duration):'--:--'}</span>
              </div>
            </div>
            <div style={controlsRow}>
              <button style={ctrlBtn(shuffle)} onClick={(e)=>{e.stopPropagation(); toggleShuffle();}}>⇄</button>
              <button style={ctrlBtn(false)} onClick={(e)=>{e.stopPropagation(); prevTrack();}}>⏮</button>
              <button style={playBtn} onClick={(e)=>{e.stopPropagation(); togglePlay();}}>{playing ? 'Pause' : 'Play'}</button>
              <button style={ctrlBtn(false)} onClick={(e)=>{e.stopPropagation(); nextTrack();}}>⏭</button>
              <button style={ctrlBtn(repeat!=='off')} onClick={(e)=>{e.stopPropagation(); cycleRepeat();}}>{repeat==='one'?'①':repeat==='all'?'∞':'↻'}</button>
            </div>
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
                <div ref={iframeContainerRef} style={{width:'100%',height:'100%',borderRadius:18,overflow:'hidden'}} />
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