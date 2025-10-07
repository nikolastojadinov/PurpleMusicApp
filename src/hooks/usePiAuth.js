import { useEffect, useRef, useState } from 'react';

/**
 * Robust Pi Network authentication hook.
 * Responsibilities:
 *  - Poll for Pi SDK (window.Pi) up to MAX_WAIT ms.
 *  - Initialize Pi SDK once present.
 *  - Attempt authentication with required scopes.
 *  - Expose user / loading / error states without throwing.
 *  - Fail gracefully if not inside Pi Browser (SDK never appears).
 */
export function usePiAuth(options = {}) {
  const {
    pollInterval = 500,
    maxWait = 10000,
    scopes = ['username', 'payments'],
    autoAuthenticate = true
  } = options;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const startedRef = useRef(false);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (startedRef.current) return; // idempotent
    startedRef.current = true;

    let done = false;

    function cleanup() {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }

    async function attemptAuth() {
      if (done) return;
      try {
        if (!window.Pi) return; // wait until present
        console.log('[PiAuth] SDK detected');
        cleanup();
        // Initialize safely
        try {
          window.Pi.init({ version: '2.0' });
        } catch (initErr) {
          console.warn('[PiAuth] Pi.init failed', initErr);
        }
        if (!autoAuthenticate) {
          setLoading(false);
          return;
        }
        try {
          const authResult = await window.Pi.authenticate(scopes, (incompletePayment) => {
            console.log('[PiAuth] Incomplete payment encountered (ignored for auth):', incompletePayment);
          });
          if (authResult && authResult.user) {
            console.log('[PiAuth] User authenticated');
            setUser(authResult.user);
          } else {
            console.log('[PiAuth] Authentication returned no user');
          }
        } catch (authErr) {
          console.error('[PiAuth] authenticate error', authErr);
          setError(authErr.message || 'Authentication failed');
        } finally {
          setLoading(false);
        }
      } catch (e) {
        console.error('[PiAuth] unexpected error', e);
        setError(e.message || 'Unexpected error');
        setLoading(false);
      }
    }

    // If SDK already injected synchronously, skip polling.
    if (typeof window !== 'undefined' && window.Pi) {
      attemptAuth();
      return () => cleanup();
    }

    // Poll for SDK presence
    intervalRef.current = setInterval(attemptAuth, pollInterval);
    // Hard timeout
    timeoutRef.current = setTimeout(() => {
      if (done) return;
      done = true;
      cleanup();
      if (!window.Pi) {
        const msg = 'Pi SDK unavailable – please open in Pi Browser.';
        console.warn('[PiAuth] Error:', msg);
        setError(msg);
        setLoading(false);
      }
    }, maxWait);

    return () => cleanup();
  }, [autoAuthenticate, maxWait, pollInterval, scopes]);

  return { user, loading, error };
}

export default usePiAuth;
