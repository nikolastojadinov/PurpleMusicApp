import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfServiceScreen() {
  const navigate = useNavigate();
  return (
    <div style={{padding:'30px 24px 120px', maxWidth:860, margin:'0 auto', lineHeight:1.55}}>
      <button onClick={()=>navigate(-1)} style={{background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', color:'#ddd', padding:'8px 14px', borderRadius:10, cursor:'pointer', fontSize:13, marginBottom:24}}>← Back</button>
      <h1 style={{margin:'0 0 8px', fontSize:34, fontWeight:700, letterSpacing:.6, background:'linear-gradient(90deg,#fff,#cfcfcf)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>Terms of Service</h1>
      <p style={{opacity:.7, fontSize:14}}>This is a placeholder Terms of Service page. Replace with the finalized legal text later.</p>
      <section style={{marginTop:32, display:'flex', flexDirection:'column', gap:22}}>
        <div>
          <h2 style={{margin:'0 0 6px', fontSize:18}}>1. Usage</h2>
          <p style={{margin:0, fontSize:14, opacity:.75}}>You agree to use the application responsibly and not abuse the Pi payment flow.</p>
        </div>
        <div>
          <h2 style={{margin:'0 0 6px', fontSize:18}}>2. Premium Access</h2>
          <p style={{margin:0, fontSize:14, opacity:.75}}>Premium tiers auto-expire; no automatic renewals are performed.</p>
        </div>
        <div>
          <h2 style={{margin:'0 0 6px', fontSize:18}}>3. Liability</h2>
          <p style={{margin:0, fontSize:14, opacity:.75}}>Provided “as-is” without warranties. Use at your own discretion.</p>
        </div>
      </section>
    </div>
  );
}
