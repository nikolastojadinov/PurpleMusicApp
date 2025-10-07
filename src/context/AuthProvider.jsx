import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import i18n from '../i18n/index.js';
import { ensurePremiumFresh } from '../services/premiumService';
import { supabase } from '../supabaseClient';
import usePiAuth from '../hooks/usePiAuth';

// Keys for localStorage persistence
const LS_USER_KEY = 'pm_user';
const LS_PI_TOKEN = 'pm_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Supabase users row
  const [piAccessToken, setPiAccessToken] = useState(null); // Pi authenticate access token
  const [loading, setLoading] = useState(true);
  const piInitializedRef = useRef(false);
  // Intro video overlay state
  const [authIntro, setAuthIntro] = useState({ visible: false, status: 'idle', error: null });
  // Modal feedback state
  const [authModal, setAuthModal] = useState({ visible: false, type: null, message: '', dismissible: true });

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

  // Integrate automatic Pi auth hook
  const { user: piUser, loading: piAutoLoading, error: piError, retry: piRetry } = usePiAuth();

  // When auto Pi auth yields a user, sync with existing context (if not already set)
  useEffect(() => {
    if (piUser && !user) {
      // Attempt to map fields; piUser.db may contain supabase row
      const dbRow = piUser.db || null;
      const merged = dbRow ? { ...dbRow } : {
        id: dbRow?.id || undefined,
        pi_user_uid: piUser.pi_uid || piUser.uid,
        username: piUser.username,
        wallet_address: dbRow?.wallet_address || null,
        is_premium: dbRow?.is_premium || false,
        premium_until: dbRow?.premium_until || null,
        premium_plan: dbRow?.premium_plan || null
      };
      setUser(merged);
      setPiAccessToken(piUser.accessToken || null);
      persistSession(merged, piUser.accessToken || null);
      setLoading(false);
    }
  }, [piUser, user, persistSession]);

  // Apply user language from Supabase (or fallback) once user is available
  useEffect(() => {
    if (!user) return;
    try {
      const userLang = user.language || user.lang;
      if (userLang && userLang !== i18n.language) {
        i18n.changeLanguage(userLang);
        console.log('[LangSync] Applied user language:', userLang);
      }
    } catch(e){ /* silent */ }
  }, [user]);

  // Debounced language change listener to persist into Supabase
  useEffect(() => {
    if (!user) return;
    let timeoutId = null;
    const piUid = user.pi_uid || user.pi_user_uid; // support both schemas
    if (!piUid) return;
    const column = user.pi_uid ? 'pi_uid' : 'pi_user_uid';
    const handler = (lng) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          const { error: updErr } = await supabase
            .from('users')
            .update({ language: i18n.language })
            .eq(column, piUid);
          if (!updErr) {
            console.log('[LangSync] Updated Supabase language:', i18n.language);
          } else {
            console.warn('[LangSync] Supabase update error', updErr);
          }
        } catch (err) {
          console.warn('[LangSync] persistence failed', err);
        }
      }, 500);
    };
    i18n.on('languageChanged', handler);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      i18n.off('languageChanged', handler);
    };
  }, [user]);

  // Restore from storage if no auto Pi user after hook settles
  useEffect(() => {
    if (!piAutoLoading && !piUser && user == null) {
      restoreFromStorage();
      setLoading(false);
    }
  }, [piAutoLoading, piUser, restoreFromStorage, user]);

  // (No auto-login logic: user triggers login explicitly.)

  // Login with Pi Network & upsert Supabase user
  const loginWithPi = useCallback(async () => {
    setLoading(true);
    // show intro instantly
    setAuthIntro({ visible: true, status: 'in-progress', error: null });
    try {
      initPiSdk();
      if (!window.Pi) throw new Error('Pi SDK not loaded');
      // Include 'payments' scope so later Pi.createPayment has permission.
      const scopes = ['username', 'wallet_address', 'payments'];
      const authResult = await window.Pi.authenticate(scopes, (incomplete) => {
        console.log('Incomplete Pi payment found (ignored for auth):', incomplete);
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
      // success sequence: hide intro -> show success modal
      setAuthIntro({ visible: true, status: 'success', error: null });
      setTimeout(() => {
  setAuthIntro({ visible: false, status: 'idle', error: null });
  const uname = dbUser.username || 'Pioneer';
  setAuthModal({ visible: true, type: 'success', message: i18n.t('auth.welcome', { username: uname, defaultValue: `Welcome, ${uname}!` }), dismissible: false });
      }, 600);
      return dbUser;
    } catch (e) {
      console.error('Pi login failed:', e);
      setUser(null);
      setPiAccessToken(null);
      persistSession(null, null);
      // show error modal
      setAuthIntro({ visible: true, status: 'error', error: e.message });
      setTimeout(() => {
  setAuthIntro({ visible: false, status: 'idle', error: null });
  setAuthModal({ visible: true, type: 'error', message: i18n.t('auth.login_failed', 'Login failed. Please try again.'), dismissible: true });
      }, 400);
      throw e;
    } finally {
      setLoading(false);
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
    loading: loading || piAutoLoading,
    piAccessToken,
    loginWithPi,
    logout,
    updateUser,
    authIntro,
    authModal,
    hideAuthModal,
    isLoggedIn: !!user,
    piError,
    piRetry
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
