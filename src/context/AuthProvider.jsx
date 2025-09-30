// Kompletna implementacija AuthProvider prema zahtevima:
// - loginWithPi: Pi.authenticate -> Supabase auth -> upsert/insert users red
// - Auto load session -> učitavanje/kreiranje users reda
// - logout resetuje stanje (ne briše red u bazi)
// - Izlaže: user, loading, likedSongs, loginWithPi, logout

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);              // Red iz users tabele
  const [likedSongs, setLikedSongs] = useState([]);    // Lista lajkovanih pesama
  const [loading, setLoading] = useState(true);        // Global auth/loading state

  // ----------------------------- Helpers ---------------------------------

  const fetchLikedSongs = async (userId) => {
    if (!userId) { setLikedSongs([]); return; }
    try {
      const { data, error } = await supabase
        .from('liked_songs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLikedSongs(data || []);
    } catch (e) {
      console.error('fetchLikedSongs error:', e);
      setLikedSongs([]);
    }
  };

  const ensureUserRow = async ({ authUserId, piProfile }) => {
    try {
      // Pokušaj da dohvatiš postojeći red
      const { data: existing, error: selErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .single();

      if (selErr && selErr.code !== 'PGRST116') throw selErr; // druga greška osim "not found"

      const username = piProfile?.username ?? existing?.username ?? null;
      const wallet_address = piProfile?.wallet_address || piProfile?.wallet?.address || existing?.wallet_address || null;
      const pi_user_uid = piProfile?.uid || existing?.pi_user_uid || null;

      if (existing) {
        // Ažuriraj ako imamo nove podatke
        const { data: updated, error: updErr } = await supabase
          .from('users')
          .update({ username, wallet_address })
          .eq('id', authUserId)
          .select('*')
          .single();
        if (updErr) { console.error('ensureUserRow update error:', updErr); return existing; }
        return updated;
      }

      // Kreiraj novi red (zahtev: is_premium = false, created_at = now())
      const insertPayload = {
        id: authUserId,
        pi_user_uid: pi_user_uid,
        username: username,
        wallet_address: wallet_address,
        is_premium: false,
        created_at: new Date().toISOString()
      };

      const { data: inserted, error: insErr } = await supabase
        .from('users')
        .insert(insertPayload)
        .select('*')
        .single();
      if (insErr) throw insErr;
      return inserted;
    } catch (e) {
      console.error('ensureUserRow error:', e);
      return null;
    }
  };

  // ----------------------------- Actions ---------------------------------

  const loginWithPi = async () => {
    setLoading(true);
    try {
      // Uveri se da je Pi SDK prisutan (ako nije, pokušaj dinamički load)
      if (!window.Pi) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
            script.src = 'https://sdk.minepi.com/pi-sdk.js';
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
      }

      if (!window.Pi) throw new Error('Pi SDK nije učitan');

      // Init Pi SDK
      try { await window.Pi.init({ version: '2.0', sandbox: false }); } catch (piInitErr) {
        console.error('Pi init error:', piInitErr);
      }

      // Authenticate preko Pi Network-a
      const authResult = await window.Pi.authenticate(['username', 'wallet_address']);
      const piUser = authResult?.user;
      const accessToken = authResult?.accessToken;
      if (!piUser || !accessToken) throw new Error('Pi authenticate nije vratio user ili accessToken');

      // Keširaj Pi profil
      try { localStorage.setItem('pi_profile', JSON.stringify(piUser)); } catch {}

      // Kreiraj Supabase session
      const { error: signErr } = await supabase.auth.signInWithIdToken({ provider: 'pi', token: accessToken });
      if (signErr) throw signErr;

      // Uzmi session
      const { data: { session }, error: sesErr } = await supabase.auth.getSession();
      if (sesErr) throw sesErr;
      if (!session?.user?.id) throw new Error('Supabase session nema user.id');

      // Upsert / ensure users red
      const profile = await ensureUserRow({ authUserId: session.user.id, piProfile: piUser });
      setUser(profile);
      await fetchLikedSongs(profile?.id);
    } catch (e) {
      console.error('loginWithPi error:', e);
      setUser(null);
      setLikedSongs([]);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('logout error:', e);
    } finally {
      setUser(null);
      setLikedSongs([]);
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!session?.user?.id) return null;
      const { data, error: selErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (selErr) throw selErr;
      setUser(data);
      await fetchLikedSongs(data.id);
      return data;
    } catch (e) {
      console.error('refreshUser error:', e);
      return null;
    }
  };

  // -------------------------- Initial / Session Sync ---------------------

  const loadExistingSession = async () => {
    setLoading(true);
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!session?.user?.id) {
        setUser(null);
        setLikedSongs([]);
        return;
      }

      // Pokušaj dohvat korisnika
      const { data: existing, error: selErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (selErr && selErr.code !== 'PGRST116') throw selErr; // realna greška

      if (existing) {
        setUser(existing);
        await fetchLikedSongs(existing.id);
        return;
      }

      // Ako ne postoji red → napravi minimalan
      const minimalRow = {
        id: session.user.id,
        pi_user_uid: null,
        username: null,
        wallet_address: null,
        is_premium: false,
        created_at: new Date().toISOString()
      };
      const { data: inserted, error: insErr } = await supabase
        .from('users')
        .insert(minimalRow)
        .select('*')
        .single();
      if (insErr) throw insErr;
      setUser(inserted);
      await fetchLikedSongs(inserted.id);
    } catch (e) {
      console.error('loadExistingSession error:', e);
      setUser(null);
      setLikedSongs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Inicijalno učitavanje postojećeg session-a
    loadExistingSession();

    // Slušalac promene auth stanja
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLikedSongs([]);
          return;
        }
        if (session?.user?.id) {
          // Dohvati ili kreiraj user red (bez Pi profila ovde – nema tokena, ali kreiramo minimalan ako treba)
            const { data: existing, error: selErr } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            if (selErr && selErr.code !== 'PGRST116') { console.error('onAuthStateChange select error:', selErr); return; }
            if (existing) {
              setUser(existing);
              await fetchLikedSongs(existing.id);
            } else {
              const minimalRow = {
                id: session.user.id,
                pi_user_uid: null,
                username: null,
                wallet_address: null,
                is_premium: false,
                created_at: new Date().toISOString()
              };
              const { data: inserted, error: insErr } = await supabase
                .from('users')
                .insert(minimalRow)
                .select('*')
                .single();
              if (insErr) { console.error('onAuthStateChange insert error:', insErr); return; }
              setUser(inserted);
              await fetchLikedSongs(inserted.id);
            }
        }
      } catch (listenerErr) {
        console.error('onAuthStateChange handler error:', listenerErr);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ----------------------------- Context Value ---------------------------

  const contextValue = {
    user,
    loading,
    likedSongs,
    loginWithPi,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
