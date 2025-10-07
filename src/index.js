import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// Ensure i18n side-effects run before any component renders.
import './i18n/index.js';
// NOTE: App is dynamically imported below to isolate any early-load errors.

// (Pi SDK init now handled inside AuthProvider with retry logic)

const rootEl = document.getElementById('root');
const root = ReactDOM.createRoot(rootEl);

// Global debug listeners (temporary)
window.addEventListener('error', (e) => { try { console.log('[GLOBAL][error]', e.message, e.filename, e.lineno); } catch(_){} });
window.addEventListener('unhandledrejection', (e) => { try { console.log('[GLOBAL][unhandledrejection]', e.reason); } catch(_){} });
console.log('[DEBUG][index] root element =', rootEl);

const removeWatchdog = () => {
  try {
    const wd = document.getElementById('pm-watchdog');
    if (wd) wd.remove();
  } catch(_){ }
};

function setStatus(msg){
  try { const sEl = document.getElementById('pm-wd-status'); if (sEl) sEl.textContent = msg; } catch(_){}
}

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

// Mark that bundle executed even before dynamic import
setStatus('bundle ok');

(async function bootstrap(){
  setStatus('boot-app-loading');
  try {
    const mod = await import(/* webpackChunkName: "app-root" */ './App');
    setStatus('app-imported');
    try {
      const { default: i18n } = await import('./i18n/index.js');
      console.log('[DEBUG][bootstrap] i18n initialized?', i18n.isInitialized, 'language=', i18n.language);
    } catch(e){
      console.warn('[DEBUG][bootstrap] i18n preload check failed', e);
    }
    const App = mod.default;
    try {
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
      window.__PM_APP_MOUNTED__ = true;
      removeWatchdog();
      setStatus('mounted');
    } catch(renderErr){
      console.error('[BOOT][render-error]', renderErr);
      setStatus('render-error');
      root.render(<BootFallback phase="render" error={renderErr} />);
      window.__PM_APP_MOUNTED__ = true; // still mark to hide watchdog after fallback
      removeWatchdog();
    }
  } catch(importErr){
    console.error('[BOOT][import-error]', importErr);
    setStatus('app-import-error');
    root.render(<BootFallback phase="import" error={importErr} />);
    window.__PM_APP_MOUNTED__ = true;
    removeWatchdog();
  }
})();