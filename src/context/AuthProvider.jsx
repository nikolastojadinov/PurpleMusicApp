import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { ensurePremiumFresh } from '../services/premiumService';
import { supabase } from '../supabaseClient';

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
        setAuthModal({ visible: true, type: 'success', message: `Welcome, ${dbUser.username || 'Pioneer'}!`, dismissible: false });
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
        setAuthModal({ visible: true, type: 'error', message: 'Login failed. Please try again.', dismissible: true });
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
