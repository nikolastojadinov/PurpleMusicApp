import React, { useEffect, useState } from 'react';

/**
 * Centralni vizuelni preview aplikacije.
 * Prikazuje se kao overlay u sredini ekrana dok korisnik prvi put otvara Home.
 * Ne ometa skrol; može se zatvoriti. Pamti se dismissal u localStorage.
 */
export default function AppVisualPreview({ onClose }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return (
    <div style={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true" aria-label="App preview overlay">
      <div style={styles.card} onClick={e=>e.stopPropagation()}>
        <button style={styles.closeBtn} aria-label="Close preview" onClick={onClose}>×</button>
        <div style={styles.logoCircle}>🎵</div>
        <h2 style={styles.title}>PurpleMusic Preview</h2>
        <p style={styles.subtitle}>Brz uvid u interfejs – plej liste, pretraga, premium i player u jednom modernom layout-u.</p>
        <div style={styles.previewGrid}>
          {mockBlocks.map(b => (
            <div key={b.title} style={styles.block}>
              <div style={styles.blockHeader}>{b.title}</div>
              <div style={styles.blockBody}>{b.body}</div>
            </div>
          ))}
        </div>
        <div style={styles.hint}>Klikni bilo gde van ili × da zatvoriš ovaj preview.</div>
      </div>
    </div>
  );
}

const mockBlocks = [
  { title: 'Made for you', body: 'Personalizovane liste' },
  { title: 'Recently played', body: 'Brzi povratak' },
  { title: 'Trending now', body: 'Popularno danas' },
  { title: 'Premium', body: 'Otključaj više' },
  { title: 'Search', body: 'Instant pretraga' },
  { title: 'Player', body: 'Modern audio UI' }
];

const styles = {
  backdrop: {
    position:'fixed', inset:0, background:'radial-gradient(circle at 50% 50%, rgba(110,60,200,0.22), rgba(0,0,0,0.92))',
    display:'flex', alignItems:'center', justifyContent:'center', zIndex:100000,
    backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)', padding:'40px 20px'
  },
  card: {
    width:'min(920px,95vw)', maxHeight:'80vh', overflow:'hidden', display:'flex', flexDirection:'column',
    background:'linear-gradient(145deg,#18181b,#111114)', border:'1px solid rgba(255,255,255,0.07)',
    borderRadius:34, boxShadow:'0 20px 60px -15px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.05)',
    padding:'42px 46px 38px', position:'relative', color:'#eee'
  },
  closeBtn: {
    position:'absolute', top:14, right:14, width:42, height:42,
    background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.2)',
    borderRadius:16, color:'#ddd', fontSize:26, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
    backdropFilter:'blur(4px)'
  },
  logoCircle: {
    width:70, height:70, borderRadius:'50%', background:'linear-gradient(135deg,#8b5cf6,#6d28d9)',
    display:'flex', alignItems:'center', justifyContent:'center', fontSize:34, marginBottom:20,
    boxShadow:'0 10px 28px -8px rgba(139,92,246,0.6)'
  },
  title: { margin:0, fontSize:36, fontWeight:700, letterSpacing:.6, background:'linear-gradient(90deg,#fff,#d6c8ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' },
  subtitle: { margin:'10px 0 28px', fontSize:16, lineHeight:1.5, opacity:.78, maxWidth:620 },
  previewGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:18, width:'100%', marginBottom:28 },
  block: { position:'relative', padding:'14px 14px 16px', background:'linear-gradient(160deg,#222327,#1b1c1f)', border:'1px solid #2f2f33', borderRadius:18, minHeight:90, display:'flex', flexDirection:'column', gap:8, boxShadow:'0 6px 18px -10px rgba(0,0,0,0.55)' },
  blockHeader: { fontSize:13, fontWeight:600, letterSpacing:.5, textTransform:'uppercase', color:'#bda8ff' },
  blockBody: { fontSize:14, fontWeight:500, opacity:.85 },
  hint: { textAlign:'center', width:'100%', fontSize:12, opacity:.55, letterSpacing:.5 }
};
