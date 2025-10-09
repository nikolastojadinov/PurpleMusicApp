import React from 'react';
import { useAuth } from '../context/AuthProvider.jsx';

export default function HomeScreen() {
  const { isLoggedIn, loginWithPi } = useAuth();
  return (
    <div className="home-screen" style={{padding:'2rem 1rem'}}>
      {!isLoggedIn ? (
        <div style={{maxWidth:560,margin:'40px auto',textAlign:'center'}}>
          <h1 style={{margin:'0 0 10px'}}>PurpleMusic</h1>
          <p style={{opacity:.8,margin:'0 0 22px'}}>Sign in with Pi Network to continue.</p>
          <button onClick={loginWithPi} style={{background:'#6d28d9',color:'#fff',border:'none',padding:'12px 18px',borderRadius:24,fontWeight:700,cursor:'pointer'}}>Login with Pi</button>
        </div>
      ) : (
        <div style={{maxWidth:720,margin:'20px auto',textAlign:'center',opacity:.85}}>
          <h2>Welcome back</h2>
          <p>Your account is connected. Use the bottom navigation to explore.</p>
        </div>
      )}
    </div>
  );
}