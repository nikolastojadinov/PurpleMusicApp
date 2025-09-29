import { supabase } from '../supabaseClient';

// Proverava premium status korisnika preko view-a user_premium_status
export async function isCurrentlyPremium(userId) {
  const { data, error } = await supabase
    .from('user_premium_status')
    .select('is_currently_premium')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data?.is_currently_premium === true;
}
