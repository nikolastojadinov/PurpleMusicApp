import { createClient } from '@supabase/supabase-js';
// Supabase client (public) – expects environment variables to be set at build/deploy time.
// Never commit keys directly; Netlify / Render should provide REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
	// eslint-disable-next-line no-console
	console.warn('[supabaseClient] Missing Supabase env vars; client features may fail.');
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '');