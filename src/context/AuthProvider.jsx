// AuthProvider - ručni Pi Network login bez Supabase auth session-a
// Funkcionalnosti:
//  - loginWithPi: Pi.authenticate -> upsert users (pi_user_uid, username, wallet_address) / update ako postoji
//  - autoLogin: čita pi_user_uid iz localStorage i povlači korisnika
//  - logout: briše pi_user_uid iz localStorage i resetuje state (ne briše red iz baze)
//  - likedSongs: učitava se iz 'likes' tabele filtrirano po user_id
//  - Svi Supabase upiti u try/catch sa console.error

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);           // Red iz users tabele
  const [likedSongs, setLikedSongs] = useState([]); // Redovi iz 'likes'
  const [loading, setLoading] = useState(false);

  // ---- Helper: load Pi SDK ako nije prisutan ----
  const ensurePiSdk = async () => {
    if (typeof window === 'undefined') return;
    if (window.Pi) return;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://sdk.minepi.com/pi-sdk.js';
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // ---- Helper: fetch liked songs ----
  const fetchLikedSongs = async (userId) => {
    if (!userId) { setLikedSongs([]); return; }
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id, user_id, track_url, cover_url, title, artist, liked_at')
        .eq('user_id', userId)
        .order('liked_at', { ascending: false });
      if (error) throw error;
      setLikedSongs(data || []);
    } catch (err) {
      console.error('fetchLikedSongs error:', err);
      setLikedSongs([]);
    }
  };

  // ---- Helper: select user by pi_user_uid ----
  const getUserByPiUid = async (pi_user_uid) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, pi_user_uid, username, wallet_address, is_premium, premium_until, created_at')
        .eq('pi_user_uid', pi_user_uid)
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      if (err?.code !== 'PGRST116') { // not found code handling
        console.error('getUserByPiUid error:', err);
      }
      return null;
    }
  };

  // ---- loginWithPi ----
  const loginWithPi = async () => {
    setLoading(true);
    try {
      await ensurePiSdk();
      if (!window.Pi) throw new Error('Pi SDK nije učitan');

      try { await window.Pi.init({ version: '2.0', sandbox: false }); } catch (initErr) {
        console.error('Pi init error:', initErr);
      }

      const authResult = await window.Pi.authenticate(['username', 'wallet_address']);
      const piUser = authResult?.user;
      if (!piUser?.uid) throw new Error('Pi authenticate nije vratio uid');

      const pi_user_uid = piUser.uid;
      const username = piUser.username ?? null;
      const wallet_address = (piUser.wallet?.address) || null; // undefined -> null

      // Prvo proveri da li postoji
      const existing = await getUserByPiUid(pi_user_uid);
      let dbUser = null;
      if (existing) {
        // Update samo promenljiva polja (username, wallet_address) - ignoriši undefined
        try {
          const { data, error } = await supabase
            .from('users')
            .update({
              username: username,
              wallet_address: wallet_address,
            })
            .eq('pi_user_uid', pi_user_uid)
            .select('id, pi_user_uid, username, wallet_address, is_premium, premium_until, created_at')
            .single();
          if (error) throw error;
          dbUser = data;
        } catch (err) {
          console.error('users update error:', err);
          dbUser = existing; // fallback na staro
        }
      } else {
        // Insert novi red
        try {
          const insertPayload = {
            pi_user_uid,
            username,
            wallet_address,
            is_premium: false,
            premium_until: null,
            created_at: new Date().toISOString(),
          };
          const { data, error } = await supabase
            .from('users')
            .insert(insertPayload)
            .select('id, pi_user_uid, username, wallet_address, is_premium, premium_until, created_at')
            .single();
          if (error) throw error;
          dbUser = data;
        } catch (err) {
          console.error('users insert error:', err);
          throw err;
        }
      }

      setUser(dbUser);
      try { localStorage.setItem('pi_user_uid', pi_user_uid); } catch {}
      await fetchLikedSongs(dbUser?.id);
      return dbUser;
    } catch (err) {
      console.error('loginWithPi error:', err);
      setUser(null);
      setLikedSongs([]);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ---- autoLogin ----
  const autoLogin = async () => {
    setLoading(true);
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('pi_user_uid') : null;
      if (!stored) { setUser(null); setLikedSongs([]); return; }
      const dbUser = await getUserByPiUid(stored);
      if (dbUser) {
        setUser(dbUser);
        await fetchLikedSongs(dbUser.id);
      } else {
        setUser(null);
        setLikedSongs([]);
      }
    } catch (err) {
      console.error('autoLogin error:', err);
      setUser(null);
      setLikedSongs([]);
    } finally {
      setLoading(false);
    }
  };

  // ---- logout ----
  const logout = () => {
    try { localStorage.removeItem('pi_user_uid'); } catch {}
    setUser(null);
    setLikedSongs([]);
  };

  // Auto login na mount
  useEffect(() => { autoLogin(); }, []);

  return (
    <AuthContext.Provider value={{ user, loading, likedSongs, loginWithPi, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
