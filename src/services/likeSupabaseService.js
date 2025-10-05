// src/services/likeSupabaseService.js
// Like/unlike functionality for premium users with Supabase persistence
import { supabase } from '../supabaseClient';
import { getCurrentUser } from './userService';
import { isPremiumActive } from './premiumService';

// Check if current user is premium
export function isPremiumUser() {
  const user = getCurrentUser();
  return isPremiumActive(user);
}

// Like a song
export async function likeSongSupabase(song) {
  const user = getCurrentUser();
  if (!user || !user.id) throw new Error('User not logged in');
  if (!isPremiumUser()) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pm:openPremiumModal', { detail: { source: 'likeService' } }));
    }
    return false;
  }
  try {
    const { error } = await supabase
      .from('likes')
      .insert({
        user_id: user.id,
        track_url: song.url,
        cover_url: song.cover,
        title: song.title,
        artist: song.artist,
        liked_at: new Date().toISOString()
      });
    if (error) throw error;
    return true;
  } catch (err) {
    throw err;
  }
}

// Unlike a song
export async function unlikeSongSupabase(song) {
  const user = getCurrentUser();
  if (!user || !user.id) throw new Error('User not logged in');
  try {
    const { error } = await supabase
      .from('likes')
      .delete()
  .eq('user_id', user.id)
      .eq('track_url', song.url);
    if (error) throw error;
    return true;
  } catch (err) {
    throw err;
  }
}

// Check if song is liked
export async function isSongLikedSupabase(song) {
  const user = getCurrentUser();
  if (!user || !user.id) return false;
  try {
    const { data, error } = await supabase
      .from('likes')
      .select('id')
  .eq('user_id', user.id)
      .eq('track_url', song.url)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  } catch {
    return false;
  }
}

// Fetch all liked songs for current user
export async function fetchLikedSongsSupabase() {
  const user = getCurrentUser();
  if (!user || !user.id) return [];
  try {
    const { data, error } = await supabase
      .from('likes')
      .select('*')
  .eq('user_id', user.id)
      .order('liked_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}
