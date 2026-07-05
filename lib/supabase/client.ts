/**
 * Supabase Client Configuration
 * 
 * Centralized Supabase client initialization for use across the application.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

let supabaseClient: SupabaseClient | null = null;

/**
 * Check if Supabase is properly configured for browser usage
 */
export function isSupabaseBrowserConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Get Supabase client for browser-side operations
 */
export function getSupabaseBrowser(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseClient;
}

/**
 * Get or create Supabase client (singleton) - alias for getSupabaseBrowser
 */
export function getSupabaseClient(): SupabaseClient {
  return getSupabaseBrowser();
}

/**
 * Get Supabase client for server-side operations (with service role if available)
 */
export function getSupabaseServerClient(): SupabaseClient {
  // Use service role key for server operations if available
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  if (serviceRoleKey) {
    return createClient(url, serviceRoleKey);
  }

  // Fallback to anon key
  return getSupabaseClient();
}
