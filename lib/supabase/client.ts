"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getSupabasePublicConfig,
  isSupabasePublicConfigured,
} from "@/lib/supabase/env";

let browserClient: SupabaseClient | null = null;

export function isSupabaseBrowserConfigured(): boolean {
  return isSupabasePublicConfigured();
}

/** Browser Supabase client with persisted auth session (singleton). */
export function getSupabaseBrowser(): SupabaseClient {
  const config = getSupabasePublicConfig();

  if (!config) {
    throw new Error(
      "Supabase browser client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  if (!browserClient) {
    browserClient = createBrowserClient(config.url, config.anonKey);
  }

  return browserClient;
}