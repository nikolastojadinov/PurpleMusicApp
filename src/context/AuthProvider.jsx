import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);      // row iz users
  const [likedSongs, setLikedSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Učitavanje lajkovanih pesama
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

  // Kreiraj ili ažuriraj users red prema auth user id + Pi profilu
  const upsertUserProfile = async ({ authUserId, piUser }) => {
    let cached = null;
    try { const raw = localStorage.getItem('pi_profile'); if (raw) cached = JSON.parse(raw); } catch {}
    const info = piUser || cached || {};
    const { uid: pi_user_uid, username, wallet_address } = info;

    let { data: existing, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUserId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;

    if (existing) {
      if (username || wallet_address || pi_user_uid) {
        const { data: updated, error: updErr } = await supabase
          .from('users')
          .update({
            username: username ?? existing.username,
            wallet_address: wallet_address ?? existing.wallet_address,
            pi_user_uid: pi_user_uid ?? existing.pi_user_uid
          })
          .eq('id', authUserId)
          .select('*')
          .single();
        if (updErr) { console.error('User update error:', updErr); return existing; }
        return updated;
      }
      return existing;
    }

    const insertPayload = { id: authUserId, username: username || null, wallet_address: wallet_address || null, pi_user_uid: pi_user_uid || null };
    const { data: inserted, error: insErr } = await supabase
      .from('users')
      .insert(insertPayload)
      .select('*')
      .single();
    if (insErr) {
      if (insErr.message?.toLowerCase().includes('uuid')) {
        const { data: altUser, error: altErr } = await supabase
          .from('users')
          .insert({ username: username || null, wallet_address: wallet_address || null, pi_user_uid: pi_user_uid || null })
          .select('*')
          .single();
        if (altErr) throw altErr;
        return altUser;
      }
      throw insErr;
    }
    return inserted;
  };

  const loginWithPi = async () => {
    setLoading(true);
    try {
      if (!window.Pi) throw new Error('Pi SDK nije učitan');
      await window.Pi.init({ version: '2.0', sandbox: false });
      const piAuth = await window.Pi.authenticate(['username', 'wallet_address']);
      const { user: piUser, accessToken } = piAuth;
      try { localStorage.setItem('pi_profile', JSON.stringify(piUser)); } catch {}
      const { error: signErr } = await supabase.auth.signInWithIdToken({ provider: 'pi', token: accessToken });
      if (signErr) console.error('signInWithIdToken error:', signErr);
      const { data: { session }, error: sesErr } = await supabase.auth.getSession();
      if (sesErr) throw sesErr;
      if (!session?.user?.id) throw new Error('Nema session.user.id');
      const profile = await upsertUserProfile({ authUserId: session.user.id, piUser });
      setUser(profile);
      await fetchLikedSongs(profile.id);
    } catch (e) {
      console.error('loginWithPi error:', e);
      setUser(null); setLikedSongs([]);
    } finally { setLoading(false); }
  };

  const initialLoad = async () => {
    setLoading(true);
    try {
      if (window.Pi) { try { await window.Pi.init({ version: '2.0', sandbox: false }); } catch(e){ console.error('Pi init error:', e);} }
      else {
        const s = document.createElement('script');
        s.src = 'https://sdk.minepi.com/pi-sdk.js';
        s.onload = async () => { try { if (window.Pi) await window.Pi.init({ version: '2.0', sandbox: false }); } catch(er){ console.error('Pi dynamic init error:', er);} };
        document.body.appendChild(s);
      }
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!session?.user?.id) { setUser(null); setLikedSongs([]); return; }
      let piProfile = null; try { const raw = localStorage.getItem('pi_profile'); if (raw) piProfile = JSON.parse(raw); } catch{}
      const profile = await upsertUserProfile({ authUserId: session.user.id, piUser: piProfile });
      setUser(profile); await fetchLikedSongs(profile.id);
    } catch(e){
      console.error('Initial auth load error:', e);
      setUser(null); setLikedSongs([]);
    } finally { setLoading(false); }
  };

  const logout = async () => {
    setLoading(true);
    try { await supabase.auth.signOut(); } catch(e){ console.error('logout error:', e);} finally { setUser(null); setLikedSongs([]); setLoading(false); }
  };

  const likeSong = async (songId) => {
    if (!user?.id) return;
    try { const { error } = await supabase.from('liked_songs').insert({ user_id: user.id, song_id: songId }); if (error) throw error; await fetchLikedSongs(user.id);} catch(e){ console.error('likeSong error:', e);} };
  const unlikeSong = async (songId) => {
    if (!user?.id) return;
    try { const { error } = await supabase.from('liked_songs').delete().eq('user_id', user.id).eq('song_id', songId); if (error) throw error; await fetchLikedSongs(user.id);} catch(e){ console.error('unlikeSong error:', e);} };

  useEffect(() => {
    let active = true;
    initialLoad();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;
      try {
        if (event === 'SIGNED_OUT') { setUser(null); setLikedSongs([]); return; }
        if (session?.user?.id) {
          if (!user || user.id !== session.user.id) {
            let piProfile = null; try { const raw = localStorage.getItem('pi_profile'); if (raw) piProfile = JSON.parse(raw); } catch{}
            const profile = await upsertUserProfile({ authUserId: session.user.id, piUser: piProfile });
            setUser(profile); await fetchLikedSongs(profile.id);
          }
        }
      } catch (listenerErr) { console.error('onAuthStateChange error:', listenerErr); }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [user]);

  const contextValue = { user, loading, likedSongs, loginWithPi, logout, likeSong, unlikeSong };
  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
