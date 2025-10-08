import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './utils/consoleProdShim';
// Ensure i18n side-effects run before any component renders.
import './i18n/index.js';
// NOTE: App is dynamically imported below to isolate any early-load errors.

// Global hard suppression of the YouTube pattern message (prevents popup overlays / default handler propagation)
if (typeof window !== 'undefined') {
  try {
    window.addEventListener('error', (e) => {
      const msg = e?.message || '';
      if (typeof msg === 'string' && msg.toLowerCase().includes('did not match the expected pattern')) {
        e.stopImmediatePropagation();
        e.preventDefault();
        return false; // some browsers honor return false to suppress
      }
    }, { capture: true });
  } catch(_) {}
}

// (Pi SDK init now handled inside AuthProvider with retry logic)

const rootEl = document.getElementById('root');
const root = ReactDOM.createRoot(rootEl);

// Removed temporary global debug and watchdog utilities.

// Minimal fallback component displayed if App import/render fails.
function BootFallback({ phase, error }) {
  return (
    <div style={{padding:'40px 20px 120px', color:'#fff', fontFamily:'system-ui, sans-serif'}}>
      <h2 style={{marginTop:0,fontSize:20}}>PurpleMusic (Safe Mode)</h2>
      <p style={{fontSize:14, lineHeight:1.5, opacity:.8}}>App failed to fully initialize during <strong>{phase}</strong>. A lightweight fallback UI is shown so the page still mounts.</p>
      {error && (
        <pre style={{whiteSpace:'pre-wrap', background:'#1e1e1e', padding:'12px 14px', borderRadius:8, fontSize:11, maxHeight:260, overflow:'auto'}}>
{String(error?.stack || error?.message || error)}
        </pre>
      )}
      <button onClick={()=>window.location.reload()} style={{marginTop:18, background:'#6d28d9',border:'none',color:'#fff',padding:'10px 18px',borderRadius:20,cursor:'pointer',fontWeight:600}}>Reload</button>
    </div>
  );
}

(async function bootstrap(){
  try {
    const mod = await import(/* webpackChunkName: "app-root" */ './App');
    const App = mod.default;
    try {
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
    } catch(renderErr){
      console.error('[BOOT][render-error]', renderErr);
      root.render(<BootFallback phase="render" error={renderErr} />);
    }
  } catch(importErr){
    console.error('[BOOT][import-error]', importErr);
    root.render(<BootFallback phase="import" error={importErr} />);
  }
})();