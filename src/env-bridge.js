// Bridge Vite env vars to window for restricted WebViews (e.g., Pi Browser)
// Keep minimal to avoid leaking unrelated variables.
try {
  if (typeof window !== 'undefined') {
    window.__ENV__ = Object.assign({}, window.__ENV__, {
      VITE_YOUTUBE_API_KEY: (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_YOUTUBE_API_KEY : undefined)
    });
  }
} catch(_) {}
