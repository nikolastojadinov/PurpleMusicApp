import { supabase } from '../supabaseClient';

export async function listCovers() {
  const { data, error } = await supabase.storage.from('Covers').list('', { limit: 100 });
  if (error) throw error;
  return data.map(f => f.name);
}
