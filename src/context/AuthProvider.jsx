// AuthProvider - ručni Pi Network login bez Supabase auth session-a
// Funkcionalnosti:
//  - loginWithPi: Pi.authenticate -> upsert users (pi_user_uid, username, wallet_address) / update ako postoji
//  - autoLogin: čita pi_user_uid iz localStorage i povlači korisnika
//  - logout: briše pi_user_uid iz localStorage i resetuje state (ne briše red iz baze)
//  - likedSongs: učitava se iz 'likes' tabele filtrirano po user_id
//  - Svi Supabase upiti u try/catch sa console.error

import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);            // Red iz users
  const [likedSongsRaw, setLikedSongsRaw] = useState([]); // Sirovi redovi iz likes
  const [playlists, setPlaylists] = useState([]);    // Playlists sa opcionalnim items
  const [loading, setLoading] = useState(false);
  const likesIntervalRef = useRef(null);

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
    if (!userId) { setLikedSongsRaw([]); return; }
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id, user_id, track_url, cover_url, title, artist, liked_at')
        .eq('user_id', userId)
        .order('liked_at', { ascending: false });
      if (error) throw error;
      setLikedSongsRaw(data || []);
    } catch (err) {
      console.error('fetchLikedSongs error:', err);
      setLikedSongsRaw([]);
    }
  };

  // ---- Helper: fetch playlists + optional items ----
  const fetchPlaylists = async (userId) => {
    if (!userId) { setPlaylists([]); return; }
    try {
      // Dohvati liste
      const { data: pls, error } = await supabase
        .from('playlists')
        .select('id, user_id, name, created_at, lastupdated')
        .eq('user_id', userId)
        .order('lastupdated', { ascending: false });
      if (error) throw error;

      const playlistsData = pls || [];
      if (playlistsData.length === 0) { setPlaylists([]); return; }

      // Dohvati sve items za te playliste u jednoj query (IN)
      const playlistIds = playlistsData.map(p => p.id);
      try {
        const { data: items, error: itemsErr } = await supabase
          .from('playlist_items')
          .select('id, playlist_id, track_url, cover_url, title, artist, added_at')
          .in('playlist_id', playlistIds);
        if (itemsErr) throw itemsErr;
        const grouped = (items || []).reduce((acc, it) => {
          acc[it.playlist_id] = acc[it.playlist_id] || [];
          acc[it.playlist_id].push(it);
          return acc;
        }, {});
        setPlaylists(playlistsData.map(pl => ({ ...pl, items: grouped[pl.id] || [] })));
      } catch (itemsFetchErr) {
        console.error('fetchPlaylists items error:', itemsFetchErr);
        // Ako ne uspemo items, bar postavi liste bez njih
        setPlaylists(playlistsData.map(pl => ({ ...pl, items: [] })));
      }
    } catch (err) {
      console.error('fetchPlaylists error:', err);
      setPlaylists([]);
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

      // Upsert baziran isključivo na pi_user_uid (ručno: pokušaj update, posle insert ako ne postoji)
      let dbUser = await getUserByPiUid(pi_user_uid);
      if (dbUser) {
        try {
          const { data, error } = await supabase
            .from('users')
            .update({ username, wallet_address })
            .eq('pi_user_uid', pi_user_uid)
            .select('id, pi_user_uid, username, wallet_address, is_premium, premium_until, created_at')
            .single();
          if (error) throw error;
          dbUser = data;
        } catch (err) {
          console.error('users update (pi_user_uid) error:', err);
        }
      } else {
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
          console.error('users insert (pi_user_uid) error:', err);
          throw err;
        }
      }

      setUser(dbUser);
      try { localStorage.setItem('pi_user_uid', pi_user_uid); } catch {}
      await Promise.all([
        fetchLikedSongs(dbUser?.id),
        fetchPlaylists(dbUser?.id)
      ]);
      return dbUser;
    } catch (err) {
      console.error('loginWithPi error:', err);
      setUser(null);
      setLikedSongsRaw([]);
      setPlaylists([]);
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
      if (!stored) { setUser(null); setLikedSongsRaw([]); setPlaylists([]); return; }
      const dbUser = await getUserByPiUid(stored);
      if (dbUser) {
        setUser(dbUser);
        await Promise.all([
          fetchLikedSongs(dbUser.id),
          fetchPlaylists(dbUser.id)
        ]);
      } else {
        setUser(null);
        setLikedSongsRaw([]);
        setPlaylists([]);
      }
    } catch (err) {
      console.error('autoLogin error:', err);
      setUser(null);
      setLikedSongsRaw([]);
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  };

  // ---- logout ----
  const logout = () => {
    try { localStorage.removeItem('pi_user_uid'); } catch {}
    setUser(null);
    setLikedSongsRaw([]);
    setPlaylists([]);
    if (likesIntervalRef.current) {
      clearInterval(likesIntervalRef.current);
      likesIntervalRef.current = null;
    }
  };

  // Auto login na mount
  useEffect(() => { autoLogin(); }, []);

  // Interval refresh liked songs (60s)
  useEffect(() => {
    if (!user?.id) {
      if (likesIntervalRef.current) {
        clearInterval(likesIntervalRef.current);
        likesIntervalRef.current = null;
      }
      return;
    }
    // Initial fetch already done in autoLogin/login; ensure interval for updates
    likesIntervalRef.current = setInterval(() => {
      fetchLikedSongs(user.id);
    }, 60000);
    return () => {
      if (likesIntervalRef.current) {
        clearInterval(likesIntervalRef.current);
        likesIntervalRef.current = null;
      }
    };
  }, [user?.id]);

  // Memoized likedSongs (možda kasnije transformacije)
  const likedSongs = useMemo(() => likedSongsRaw, [likedSongsRaw]);

  return (
    <AuthContext.Provider value={{ user, loading, likedSongs, playlists, loginWithPi, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
