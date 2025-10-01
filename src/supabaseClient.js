import { createClient } from '@supabase/supabase-js';
// If you regenerate types, update the import below
// @ts-ignore - JS environment; consumers in TS can import types directly
import { } from './types/database.types';

const SUPABASE_URL = 'https://ofkfygqrfenctzitigae.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ma2Z5Z3FyZmVuY3R6aXRpZ2FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NjgwMjcsImV4cCI6MjA3MzI0NDAyN30.-GFl3-IncJ7hno_LHE5jtCOe_HI07nxwiq3aaISHolo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);