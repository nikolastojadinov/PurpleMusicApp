import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Accent + design tokens (kept inline to avoid global CSS changes)
const accent = '#E91E63';

export default function CreatePlaylistScreen(){
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(()=>{
    const t = requestAnimationFrame(()=> setMounted(true));
    return ()=> cancelAnimationFrame(t);
  },[]);

  const handleChooseCover = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setCoverFile(f);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { title: title.trim(), description: description.trim(), cover: coverFile ? coverFile.name : null };
    // For now, only log (Supabase integration to be added later)
    // eslint-disable-next-line no-console
    console.log('[CreatePlaylist] submit payload', payload);
    // Simple UX feedback: reset + navigate back to playlists list if desired
    setTitle('');
    setDescription('');
    setCoverFile(null);
    // navigate('/playlists'); // (Commented out: leave user on form for now)
  };

  const disabled = title.trim().length === 0;

  return (
    <div style={screenWrap}>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(circle at 30% 20%, rgba(181,102,241,0.20), transparent 55%), radial-gradient(circle at 75% 70%, rgba(199,146,245,0.18), transparent 60%)',pointerEvents:'none'}} />
      <form onSubmit={handleSubmit} style={{...formCard, opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(22px)'}}>
        <h1 style={titleStyle}>Create Playlist</h1>
        <p style={subtitleStyle}>Craft a new collection of tracks. You can edit details later.</p>

        <label style={labelStyle} htmlFor="playlist_title">Title<span style={{color:accent}}>*</span></label>
        <input
          id="playlist_title"
          value={title}
          onChange={(e)=> setTitle(e.target.value)}
          placeholder="My Late Night Mix"
          style={inputStyle}
          maxLength={120}
          required
        />
        <div style={hintRow}>{title.trim().length === 0 ? 'Title required' : `${title.trim().length}/120`}</div>

        <label style={labelStyle} htmlFor="playlist_desc">Description</label>
        <textarea
          id="playlist_desc"
          value={description}
          onChange={(e)=> setDescription(e.target.value)}
          placeholder="Optional short description…"
          rows={4}
          style={textAreaStyle}
          maxLength={600}
        />
        <div style={hintRow}>{description.trim().length ? `${description.trim().length}/600` : 'Optional'}</div>

        <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:10}}>
          <span style={labelStyle}>Cover Image</span>
          <div style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
            <button type="button" onClick={handleChooseCover} style={coverBtn}>{coverFile ? 'Change Image' : 'Choose Cover Image'}</button>
            {coverFile && <span style={{fontSize:12,opacity:.75,maxWidth:220,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{coverFile.name}</span>}
          </div>
          <input ref={fileInputRef} onChange={onFileChange} type="file" accept="image/*" style={{display:'none'}} />
        </div>

        <div style={{marginTop:30,display:'flex',gap:16}}>
          <button type="button" onClick={()=> navigate(-1)} style={secondaryBtn}>Cancel</button>
          <button type="submit" disabled={disabled} style={primaryBtn(disabled)}>Create Playlist</button>
        </div>
      </form>
    </div>
  );
}

// Styles
const screenWrap = { position:'relative', padding:'80px 20px 120px', minHeight:'100vh', boxSizing:'border-box', display:'flex', justifyContent:'center', alignItems:'flex-start' };
const formCard = { position:'relative', width:'100%', maxWidth:560, background:'rgba(20,20,24,0.82)', border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 10px 40px -8px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)', backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)', borderRadius:32, padding:'42px 42px 46px', display:'flex', flexDirection:'column', transition:'opacity .5s ease, transform .55s cubic-bezier(.4,1,.3,1)', zIndex:5 };
const titleStyle = { margin:'0 0 10px', fontSize:'2.1rem', fontWeight:700, letterSpacing:.5, background:'linear-gradient(90deg,#fff,#e7e7e7)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' };
const subtitleStyle = { margin:'0 0 28px', fontSize:14, lineHeight:1.5, opacity:.65 };
const labelStyle = { fontSize:13, fontWeight:600, letterSpacing:.5, margin:'22px 0 8px', textTransform:'uppercase', opacity:.85 };
const baseField = { width:'100%', background:'#ffffff', border:'1px solid #d7d2e6', borderRadius:20, padding:'14px 18px', fontSize:14, fontWeight:500, outline:'none', color:'#222', boxShadow:'0 4px 18px -6px rgba(0,0,0,0.25)', transition:'box-shadow .25s,border-color .25s, background .25s' };
const inputStyle = { ...baseField };
const textAreaStyle = { ...baseField, resize:'vertical', minHeight:110, lineHeight:1.35, borderRadius:24 };
const hintRow = { fontSize:11, opacity:.55, marginTop:6, display:'flex', justifyContent:'space-between' };
const coverBtn = { background:'linear-gradient(90deg,#b566f1,#c792f5)', border:'none', color:'#fff', padding:'12px 20px', fontSize:13, fontWeight:600, letterSpacing:.5, borderRadius:26, cursor:'pointer', boxShadow:'0 6px 18px -6px rgba(181,102,241,0.55)', transition:'transform .25s, box-shadow .25s' };
const secondaryBtn = { flex:1, background:'rgba(255,255,255,0.08)', color:'#fff', border:'1px solid rgba(255,255,255,0.15)', padding:'14px 20px', borderRadius:26, fontSize:14, fontWeight:600, cursor:'pointer', backdropFilter:'blur(4px)', transition:'background .25s,border-color .25s' };
const primaryBtn = (disabled) => ({ flex:1, background: disabled ? 'linear-gradient(90deg,#b566f155,#c792f555)' : 'linear-gradient(90deg,#b566f1,#c792f5)', color:'#fff', border:'none', padding:'14px 22px', borderRadius:28, fontSize:15, fontWeight:700, letterSpacing:.4, cursor: disabled ? 'not-allowed':'pointer', boxShadow: disabled ? 'none' : '0 10px 28px -8px rgba(181,102,241,0.6)', transition:'filter .25s, box-shadow .25s, transform .25s' });

// Focus styles injected once (scoped to form)
if (typeof document !== 'undefined' && !document.getElementById('create-playlist-focus-styles')) {
  const style = document.createElement('style');
  style.id = 'create-playlist-focus-styles';
  style.textContent = `
    input#playlist_title:focus, textarea#playlist_desc:focus { border-color: ${accent}; box-shadow: 0 0 0 3px ${accent}33, 0 6px 20px -6px ${accent}66; }
    button[type=submit]:not([disabled]):hover { filter: brightness(1.05); transform: translateY(-2px); }
    button[type=button]:hover { filter: brightness(1.05); }
    button[disabled] { opacity:.8; }
    button[disabled]:active { transform:none; }
    @media (max-width:640px){ form { padding:34px 26px 40px !important; } }
  `;
  document.head.appendChild(style);
}
