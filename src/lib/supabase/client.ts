// Supabase client setup (ready to wire up when credentials are provided)

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize Supabase client
 */
export function initSupabase(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in environment variables.'
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

/**
 * Get Supabase client (returns null if not configured)
 */
export function getSupabaseClient(): SupabaseClient | null {
  try {
    return initSupabase();
  } catch {
    return null;
  }
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

