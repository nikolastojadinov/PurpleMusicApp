import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// (Pi SDK init now handled inside AuthProvider with retry logic)

const root = ReactDOM.createRoot(document.getElementById('root'));
// Global debug listeners (temporary)
window.addEventListener('error', (e) => { console.log('[GLOBAL][error]', e.message, e.filename, e.lineno); });
window.addEventListener('unhandledrejection', (e) => { console.log('[GLOBAL][unhandledrejection]', e.reason); });
console.log('[DEBUG][index] root element =', document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);