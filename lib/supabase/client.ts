/**
 * Supabase Client Configuration
 *
 * Centralized Supabase client initialization for use across the application.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  getSupabasePublicConfig,
  isSupabasePublicConfigured,
} from "@/lib/supabase/env";

let supabaseClient: SupabaseClient | null = null;

/**
 * Check if Supabase is properly configured for browser usage
 */
export function isSupabaseBrowserConfigured(): boolean {
  return isSupabasePublicConfigured();
}

/**
 * Get Supabase client for browser-side operations
 */
export function getSupabaseBrowser(): SupabaseClient {
  const config = getSupabasePublicConfig();

  if (!config) {
    throw new Error(
      "Supabase auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  if (!supabaseClient) {
    supabaseClient = createClient(config.url, config.anonKey);
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
  const config = getSupabasePublicConfig();

  if (!config) {
    throw new Error(
      "Supabase auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (serviceRoleKey) {
    return createClient(config.url, serviceRoleKey);
  }

  return getSupabaseClient();
}