// Supabase client configuration
// This file creates the Supabase client for frontend use
// Uses PUBLIC anon key - safe to expose (protected by RLS policies)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseEnabled) {
  console.warn('Missing Supabase environment variables. Leaderboard features disabled.');
  console.warn('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// Create Supabase client when configured
export const supabase = isSupabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false // No auth needed for this game
    }
  })
  : null;
