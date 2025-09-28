// src/services/likedSongsSupabase.js
import { supabase } from '../supabaseClient';
import { getCurrentUser } from './userService';

export async function getLikedSongsSupabase() {
  const user = getCurrentUser();
  if (!user || !user.pi_user_uid) {
    console.warn('No user_id available for liked songs fetch');
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('likes')
      .select('track_url, cover_url, title, artist, liked_at')
      .eq('user_id', user.pi_user_uid)
      .order('liked_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error loading liked songs from Supabase:', err);
    return [];
  }
}
