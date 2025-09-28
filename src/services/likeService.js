import { supabase } from '../supabaseClient';
import { getCurrentUser } from './userService';

// Get current user ID from persistent session
const getCurrentUserId = () => {
  const user = getCurrentUser();
  return user?.pi_user_uid || null;
};

// Check if song is liked by current user
export const checkSongLiked = async (songId) => {
  try {
    if (!songId) return false;
    
    const userId = getCurrentUserId();
    if (!userId) return false;
    
    const { data, error } = await supabase
      .from('liked_songs')
      .select('id')
      .eq('user_id', userId)
      .eq('song_id', songId)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking if song is liked:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error checking if song is liked:', error);
    return false;
  }
};

// Like a song
export const likeSong = async (song) => {
  try {
    if (!song.id) {
      console.error('Cannot like song: missing song ID');
      return false;
    }
    
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('Cannot like song: user not logged in');
      return false;
    }
    
    const { data, error } = await supabase
      .from('liked_songs')
      .upsert({
        user_id: userId,
        song_id: song.id,
        song_title: song.title,
        song_artist: song.artist,
        song_cover: song.cover,
        song_src: song.src
      }, {
        onConflict: 'user_id,song_id'
      });
    
    if (error) {
      console.error('Error liking song:', error);
      return false;
    }
    
    console.log('Song liked successfully:', song.title);
    return true;
  } catch (error) {
    console.error('Error liking song:', error);
    return false;
  }
};

// Unlike a song
export const unlikeSong = async (songId) => {
  try {
    const userId = getCurrentUserId();
    
    const { error } = await supabase
      .from('liked_songs')
      .delete()
      .eq('user_id', userId)
      .eq('song_id', songId);
    
    if (error) {
      console.error('Error unliking song:', error);
      return false;
    }
    
    console.log('Song unliked successfully');
    return true;
  } catch (error) {
    console.error('Error unliking song:', error);
    return false;
  }
};

// Get all liked songs for current user
export const getLikedSongs = async () => {
  try {
    const userId = getCurrentUserId();
    
    const { data, error } = await supabase
      .from('liked_songs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting liked songs:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error getting liked songs:', error);
    return [];
  }
};

// Set user ID (for simple authentication)
// setUserId nem szükséges, persistent session van

// Check if user is logged in (for real authentication)
export const isUserLoggedIn = () => {
  const userId = getCurrentUserId();
  return !!userId;
};