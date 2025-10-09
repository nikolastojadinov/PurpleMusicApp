// Bridge Vite env vars to window for restricted WebViews (e.g., Pi Browser)
// Ensure it exists even when import.meta.env is not injected at runtime.
try {
  if (typeof window !== 'undefined') {
    window.__ENV__ = window.__ENV__ || {};
    let viteKey;
    try { if (typeof import.meta !== 'undefined' && import.meta.env) viteKey = import.meta.env.VITE_YOUTUBE_API_KEY; } catch (_) {}
    let procKey;
    try { if (typeof process !== 'undefined' && process.env) procKey = process.env.VITE_YOUTUBE_API_KEY; } catch (_) {}
    window.__ENV__.VITE_YOUTUBE_API_KEY = viteKey || procKey || 'MISSING';
  }
} catch(_) {}
