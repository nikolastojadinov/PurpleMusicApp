import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { logSessionState } from '../utils/debugSession';
import { ensurePremiumFresh } from '../services/premiumService';
import { supabase } from '../supabaseClient';

// Keys for localStorage persistence
const LS_USER_KEY = 'pm_user';
const LS_PI_TOKEN = 'pm_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Supabase users row
  const [piAccessToken, setPiAccessToken] = useState(null); // Pi authenticate access token
  const [loading, setLoading] = useState(true); // initial restore / interactive login only
  const piInitializedRef = useRef(false);
  // Intro video overlay state (only for interactive login)
  const [authIntro, setAuthIntro] = useState({ visible: false, status: 'idle', error: null });
  // Modal feedback state
  const [authModal, setAuthModal] = useState({ visible: false, type: null, message: '', dismissible: true });
  // Guard to ensure auto-login triggers only once per mount
  const autoLoginTriggeredRef = useRef(false);

  // Helper: persist user & token
  const persistSession = useCallback((usr, token) => {
    if (usr) {
      localStorage.setItem(LS_USER_KEY, JSON.stringify(usr));
    } else {
      localStorage.removeItem(LS_USER_KEY);
    }
    if (token) {
      localStorage.setItem(LS_PI_TOKEN, token);
    } else {
      localStorage.removeItem(LS_PI_TOKEN);
    }
  }, []);

  // Load user from storage on mount
  const restoreFromStorage = useCallback(() => {
    try {
      const rawUser = localStorage.getItem(LS_USER_KEY);
      const rawToken = localStorage.getItem(LS_PI_TOKEN);
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        // On restore, verify not expired (and reset if needed)
        ensurePremiumFresh(parsed).then(fresh => {
          setUser(fresh);
          if (fresh !== parsed) {
            localStorage.setItem(LS_USER_KEY, JSON.stringify(fresh));
          }
        }).catch(()=>{ setUser(parsed); });
      }
      if (rawToken) setPiAccessToken(rawToken);
    } catch (e) {
      console.warn('Failed to restore session:', e);
    }
  }, []);

  // Initialize Pi SDK (idempotent)
  const initPiSdk = useCallback(() => {
    if (piInitializedRef.current) return;
    if (typeof window !== 'undefined' && window.Pi) {
      try {
        window.Pi.init({ version: '2.0' });
        piInitializedRef.current = true;
        // console.debug('Pi SDK initialized');
      } catch (e) {
        console.error('Pi.init failed:', e);
      }
    }
  }, []);

  // Effect: wait until Pi script present then init & restore session
  useEffect(() => {
    let attempts = 0;
    const MAX_ATTEMPTS = 40; // ~12s with 300ms interval
    const interval = setInterval(() => {
      if (window.Pi || attempts > MAX_ATTEMPTS) {
        initPiSdk();
        restoreFromStorage();
        setLoading(false);
        clearInterval(interval);
      }
      attempts++;
    }, 300);
    return () => clearInterval(interval);
  }, [initPiSdk, restoreFromStorage]);

  // Dev-only one-time passive session log (no mutations)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      try { logSessionState(); } catch (e) { console.warn('[AuthProvider] logSessionState failed:', e); }
    }
  }, []);

  // Auto-trigger login flow (silent) once if no restored user session.
  useEffect(() => {
    if (autoLoginTriggeredRef.current || user) return;
    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 40;
    const attempt = () => {
      if (cancelled || autoLoginTriggeredRef.current || user) return;
      if (typeof window !== 'undefined' && window.Pi) {
        autoLoginTriggeredRef.current = true;
        loginWithPi({ silent: true }).catch(() => { /* swallow silent auto-login errors */ });
        return;
      }
      attempts++;
      if (attempts > MAX_ATTEMPTS) {
        autoLoginTriggeredRef.current = true; // stop retrying silently
        return;
      }
      setTimeout(attempt, 300);
    };
    attempt();
    return () => { cancelled = true; };
  }, [user, loginWithPi]);

  // Login with Pi Network & upsert Supabase user. Accepts { silent } option.
  const loginWithPi = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setAuthIntro({ visible: true, status: 'in-progress', error: null });
    }
    try {
      initPiSdk();
      if (!window.Pi) {
        throw new Error('Pi SDK not loaded');
      }
      const scopes = ['username', 'wallet_address', 'payments'];
      const authResult = await window.Pi.authenticate(scopes, (incomplete) => {
        if (!silent) console.log('Incomplete Pi payment found (ignored for auth):', incomplete);
      });
      const { accessToken, user: piUser } = authResult || {};
      if (!accessToken || !piUser) throw new Error('Missing Pi authentication data');

      // Fetch or insert user in Supabase
      let { data: dbUser, error: fetchErr } = await supabase
        .from('users')
  .select('id, pi_user_uid, username, wallet_address, is_premium, premium_until, premium_plan, created_at')
        .eq('pi_user_uid', piUser.uid)
        .single();
      if (fetchErr && fetchErr.code !== 'PGRST116') throw fetchErr; // real error
      if (!dbUser) {
        const { data: inserted, error: insErr } = await supabase
          .from('users')
          .insert({
            pi_user_uid: piUser.uid,
            username: piUser.username,
            wallet_address: piUser.wallet_address,
          })
          .select('id, pi_user_uid, username, wallet_address, is_premium, premium_until, premium_plan, created_at')
          .single();
        if (insErr) throw insErr;
        dbUser = inserted;
      }

      setUser(dbUser);
      setPiAccessToken(accessToken);
      persistSession(dbUser, accessToken);
      // success sequence: hide intro -> show success modal
      if (!silent) {
        setAuthIntro({ visible: true, status: 'success', error: null });
        setTimeout(() => {
          setAuthIntro({ visible: false, status: 'idle', error: null });
          setAuthModal({ visible: true, type: 'success', message: `Welcome, ${dbUser.username || 'Pioneer'}!`, dismissible: false });
        }, 600);
      }
      return dbUser;
    } catch (e) {
      if (silent) {
        console.warn('[auto-login] Pi login failed (silent):', e.message || e);
      } else {
        console.error('Pi login failed:', e);
        setUser(null);
        setPiAccessToken(null);
        persistSession(null, null);
        setAuthIntro({ visible: true, status: 'error', error: e.message });
        setTimeout(() => {
          setAuthIntro({ visible: false, status: 'idle', error: null });
          setAuthModal({ visible: true, type: 'error', message: 'Login failed. Please try again.', dismissible: true });
        }, 400);
      }
      throw e;
    } finally {
      if (!silent) setLoading(false);
    }
  }, [persistSession, initPiSdk]);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      setUser(null);
      setPiAccessToken(null);
      persistSession(null, null);
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  }, [persistSession]);

  // Expose a safe updater for premium or other fields
  const updateUser = useCallback((patch) => {
    setUser(prev => {
      const updated = prev ? { ...prev, ...patch } : patch;
      localStorage.setItem(LS_USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const hideAuthModal = useCallback(() => setAuthModal(m => ({ ...m, visible: false })), []);
  const value = {
    user,
    loading,
    piAccessToken,
    loginWithPi,
    logout,
    updateUser,
    authIntro,
    authModal,
    hideAuthModal,
    isLoggedIn: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Minimal non-blocking splash while initial restore pending (no user & not showing intro) */}
      {loading && !user && !authIntro.visible && (
        <div style={{position:'fixed',inset:0,background:'#000',color:'#ccc',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:9998,fontFamily:'system-ui,sans-serif',gap:12}} aria-label="Initializing application">
          <div style={{width:42,height:42,borderRadius:'50%',border:'5px solid rgba(255,255,255,0.15)',borderTopColor:'#8B5CF6',animation:'pmSpin 1s linear infinite'}} />
          <div style={{fontSize:13,letterSpacing:.5}}>Loading PurpleMusic…</div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
