/**
 * debugSession.js
 *
 * Developer pomoćna funkcija za pasivnu inspekciju lokalne sesije.
 * NE menja stanje (nema set/remove), nema poziva Pi / P.Payment API-ja.
 */

export function logSessionState() {
  try {
    if (typeof window === 'undefined') {
      console.warn('[SessionDebug] window nije dostupan (SSR ili sandbox).');
      return;
    }
    const keys = ['pm_user', 'pm_token', 'pm_pending_payment'];
    const snapshot = {};
    if (process.env.NODE_ENV === 'production') {
      // In production return snapshot silently (no logs)
      keys.forEach((key) => {
        try {
          const raw = window.localStorage.getItem(key);
          if (raw == null) { snapshot[key] = null; return; }
          let parsed = raw;
          if (/^["{\[]/.test(raw.trim())) {
            try { parsed = JSON.parse(raw); } catch(_){}
          }
          snapshot[key] = parsed;
        } catch (inner) {
          snapshot[key] = { error: inner?.message || String(inner) };
        }
      });
      return snapshot;
    }
    console.groupCollapsed('[SessionDebug] Persisted session state');
    keys.forEach((key) => {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw == null) {
          console.log(`• ${key}: <null>`);
          snapshot[key] = null;
          return;
        }
        let parsed = raw;
        if (/^["{\[]/.test(raw.trim())) {
          try {
            parsed = JSON.parse(raw);
          } catch (_) {
            // leave as raw string
          }
        }
        snapshot[key] = parsed;
        console.log(`• ${key}:`, parsed);
      } catch (inner) {
        console.log(`• ${key}: <error reading>`, inner?.message || inner);
        snapshot[key] = { error: inner?.message || String(inner) };
      }
    });
    console.groupEnd();
    return snapshot;
  } catch (e) {
    console.warn('[SessionDebug] Unexpected failure:', e);
    return null;
  }
}

export default logSessionState;
