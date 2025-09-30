import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [piSdkReady, setPiSdkReady] = useState(false);
  const [likedSongs, setLikedSongs] = useState([]);

  // 1. Inicijalizacija Pi Network SDK
  useEffect(() => {
    let initialized = false;
    async function initPiSdk() {
      try {
        if (window.Pi && !initialized) {
          await window.Pi.init({ version: '2.0', sandbox: false });
          initialized = true;
          setPiSdkReady(true);
        } else {
          // Dinamički učitaj SDK ako nije tu
          const script = document.createElement('script');
          script.src = 'https://sdk.minepi.com/pi-sdk.js';
          script.onload = async () => {
            if (window.Pi && !initialized) {
              await window.Pi.init({ version: '2.0', sandbox: false });
              initialized = true;
              setPiSdkReady(true);
            }
          };
          document.body.appendChild(script);
        }
      } catch (err) {
        console.error('Pi SDK init error:', err);
      }
    }
    initPiSdk();
  }, []);

  // 2. Login funkcija
  const loginWithPi = async () => {
    setLoading(true);
    try {
      if (!window.Pi) throw new Error('Pi Network SDK not loaded');
      // Osiguraj inicijalizaciju
      await window.Pi.init({ version: '2.0', sandbox: false });
      const piAuth = await window.Pi.authenticate(['username', 'wallet_address']);
      const { user: piUser, accessToken } = piAuth;

      // Supabase auth preko ID tokena (Pi accessToken tretiramo kao id_token)
      try {
        await supabase.auth.signInWithIdToken({ provider: 'pi', token: accessToken });
      } catch (supabaseAuthErr) {
        console.error('Supabase signInWithIdToken error:', supabaseAuthErr);
        // Nastavljamo dalje jer korisnički red ćemo ručno obezbediti
      }

      // Osiguraj da postoji red u users tabeli (pi_user_uid unique)
      let { data: dbUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('pi_user_uid', piUser.uid)
        .single();
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      if (!dbUser) {
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            pi_user_uid: piUser.uid,
            username: piUser.username,
            wallet_address: piUser.wallet_address,
            is_premium: false
          })
          .select('*')
          .single();
        if (insertError) throw insertError;
        dbUser = newUser;
      }
      setUser(dbUser);
      await fetchLikedSongs(dbUser.id);
    } catch (err) {
      console.error('Pi login error:', err);
      setUser(null);
      setLikedSongs([]);
    } finally {
      setLoading(false);
    }
  };

  // 3. Auto login
  const autoLogin = async () => {
    setLoading(true);
    try {
      // Dohvati supabase session
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!session) {
        setUser(null);
        setLikedSongs([]);
        setLoading(false);
        return;
      }
      // Imamo session: pokušaj da upariš korisnika preko pi_user_uid ako je sačuvan u localStorage
      // (fallback) ili dohvati users red ponovo ako imamo user.id u localStorage-u
      let localUser = null;
      try {
        const raw = localStorage.getItem('pm_user');
        if (raw) localUser = JSON.parse(raw);
      } catch {}
      if (localUser?.id) {
        setUser(localUser);
        await fetchLikedSongs(localUser.id);
        setLoading(false);
        return;
      }
      // Ako nemamo localUser, probaj da rekonstruišeš preko auth user email / sub (nije definisano u Pi) – pa fallback nema korisnika.
      setUser(null);
      setLikedSongs([]);
      setLoading(false);
    } catch (err) {
      console.error('Auto login error:', err);
      setUser(null);
      setLikedSongs([]);
      setLoading(false);
    }
  };

  // 4. Logout
  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('pm_user');
      await supabase.auth.signOut();
      setUser(null);
      setLikedSongs([]);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };
  // --- Liked songs logic ---
  const fetchLikedSongs = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('liked_songs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLikedSongs(data || []);
      return data || [];
    } catch (err) {
      console.error('Fetch liked songs error:', err);
      setLikedSongs([]);
      return [];
    }
  };

  const getLikedSongs = () => likedSongs;

  const likeSong = async (songId) => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from('liked_songs')
        .insert({ user_id: user.id, song_id: songId });
      if (error) throw error;
      await fetchLikedSongs(user.id);
    } catch (err) {
      console.error('Like song error:', err);
    }
  };

  const unlikeSong = async (songId) => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from('liked_songs')
        .delete()
        .eq('user_id', user.id)
        .eq('song_id', songId);
      if (error) throw error;
      await fetchLikedSongs(user.id);
    } catch (err) {
      console.error('Unlike song error:', err);
    }
  };

  // 5. Dohvati podatke korisnika
  const getUserData = () => user;

  useEffect(() => {
    autoLogin();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        piSdkReady,
        likedSongs,
        getLikedSongs,
        likeSong,
        unlikeSong,
        loginWithPi,
        autoLogin,
        logout,
        getUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
