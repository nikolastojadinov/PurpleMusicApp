import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * usePiAuth
 * Spec-compliant automatic Pi Browser auth + Supabase sync.
 * - Polls for window.Pi every 500ms (default) up to 10s.
 * - Initializes Pi SDK then authenticates with scopes ['username','payments'].
 * - Upserts user into Supabase (first trying spec columns, then falling back to existing schema).
 * - Persists user in localStorage under key 'piUser'.
 * - Exposes retry capability and robust logging.
 */
export function usePiAuth({ pollInterval = 500, maxWait = 10000 } = {}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);
  const timeoutRef = useRef(null);
  const startedRef = useRef(false);

  const persistUser = useCallback((u) => {
    try { localStorage.setItem('piUser', JSON.stringify(u)); } catch(_){}
  }, []);

  const loadPersisted = useCallback(() => {
    try {
      const raw = localStorage.getItem('piUser');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.username && parsed.pi_uid) {
          setUser(parsed);
        }
      }
    } catch(_){}
  }, []);

  const supabaseSync = useCallback(async ({ username, uid, accessToken }) => {
    // Delegate to backend service (uses service role key) to avoid RLS rejection.
    try {
      const resp = await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pi_uid: uid, username, access_token: accessToken })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || 'sync_failed');
      return data.user;
    } catch (e) {
      console.error('[PiAuth] backend sync failed', e);
      throw e;
    }
  }, []);

  const authenticate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!window.Pi) throw new Error('Pi SDK unavailable – open in Pi Browser');
      console.log('[PiAuth] SDK detected');
      try { window.Pi.init({ version: '2.0' }); } catch(initErr){ console.warn('[PiAuth] Pi.init failed', initErr); }
      const auth = await window.Pi.authenticate(['username','payments'], (incomplete) => {
        console.log('[PiAuth] Incomplete payment (ignored for login):', incomplete);
      });
      if (!auth || !auth.user) throw new Error('Authentication returned no user');
      const username = auth.user.username;
      const uid = auth.user.uid;
      const accessToken = auth.accessToken;
      console.log('[PiAuth] User authenticated:', username);
      let synced = null;
      try {
        synced = await supabaseSync({ username, uid, accessToken });
      } catch(syncErr){
        setError(syncErr.message || 'Supabase sync failed');
      }
      const mergedUser = { ...auth.user, uid, username, accessToken, db: synced };
      setUser(mergedUser);
      persistUser({ pi_uid: uid, username, accessToken, db: synced });
    } catch (e) {
      console.error('[PiAuth] Error:', e);
      setError(e.message || 'Unknown Pi auth error');
    } finally {
      setLoading(false);
    }
  }, [persistUser, supabaseSync]);

  const start = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    loadPersisted();
    if (window.Pi) {
      authenticate();
      return;
    }
    pollRef.current = setInterval(() => {
      if (window.Pi) {
        clearInterval(pollRef.current);
        clearTimeout(timeoutRef.current);
        authenticate();
      }
    }, pollInterval);
    timeoutRef.current = setTimeout(() => {
      if (!window.Pi) {
        clearInterval(pollRef.current);
        setError('Pi SDK unavailable – open in Pi Browser');
      }
    }, maxWait);
  }, [authenticate, loadPersisted, maxWait, pollInterval]);

  useEffect(() => {
    start();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [start]);

  const retry = useCallback(() => {
    // Allow manual retry (e.g., user clicked login button after enabling Pi Browser)
    startedRef.current = false; // permit restart
    start();
  }, [start]);

  return { user, loading, error, retry };
}

export default usePiAuth;
