// src/services/userService.js
// Supabase users table integration & persistent session management
import { supabase } from '../supabaseClient';

const USER_STORAGE_KEY = 'pm_user';

export async function loginOrRegisterUser({ pi_user_uid, username, wallet_address }) {
  try {
    // Proveri da li korisnik postoji po pi_user_uid
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('id, pi_user_uid, username, wallet_address, is_premium, premium_until, created_at')
      .eq('pi_user_uid', pi_user_uid)
      .single();
    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
    let user = userData;
    if (!user) {
      // Kreiraj novog korisnika
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert({
          pi_user_uid,
          username,
          wallet_address,
          is_premium: false
        })
        .select('id, pi_user_uid, username, wallet_address, is_premium, premium_until, created_at')
        .single();
      if (insertError) throw insertError;
      user = insertData;
    }
    // Uvek vraća ceo red sa users.id (UUID)
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    return user;
  } catch (err) {
    console.error('Supabase user login error:', err);
    throw err;
  }
}

export function restoreUserFromStorage() {
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function logoutUser() {
  window.localStorage.removeItem(USER_STORAGE_KEY);
}

export function isUserLoggedIn() {
  return !!restoreUserFromStorage();
}

export function getCurrentUser() {
  return restoreUserFromStorage();
}
