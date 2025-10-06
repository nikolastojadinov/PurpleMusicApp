import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicyScreen() {
  const navigate = useNavigate();
  return (
    <div style={{padding:'30px 24px 120px', maxWidth:860, margin:'0 auto', lineHeight:1.55}}>
      <button onClick={()=>navigate(-1)} style={{background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', color:'#ddd', padding:'8px 14px', borderRadius:10, cursor:'pointer', fontSize:13, marginBottom:24}}>← Back</button>
      <h1 style={{margin:'0 0 8px', fontSize:34, fontWeight:700, letterSpacing:.6, background:'linear-gradient(90deg,#fff,#cfcfcf)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>Privacy Policy</h1>
      <p style={{opacity:.7, fontSize:14}}>This is a placeholder Privacy Policy page. Replace with real content later.</p>
      <section style={{marginTop:32, display:'flex', flexDirection:'column', gap:22}}>
        <div>
          <h2 style={{margin:'0 0 6px', fontSize:18}}>1. Data We Collect</h2>
          <p style={{margin:0, fontSize:14, opacity:.75}}>User identifier (Pi uid), username, wallet address, and premium status timestamps.</p>
        </div>
        <div>
          <h2 style={{margin:'0 0 6px', fontSize:18}}>2. How It Is Used</h2>
          <p style={{margin:0, fontSize:14, opacity:.75}}>Authentication, premium feature access, and basic analytics.</p>
        </div>
        <div>
          <h2 style={{margin:'0 0 6px', fontSize:18}}>3. Contact</h2>
          <p style={{margin:0, fontSize:14, opacity:.75}}>For inquiries, reach out through the project repository.</p>
        </div>
      </section>
    </div>
  );
}
