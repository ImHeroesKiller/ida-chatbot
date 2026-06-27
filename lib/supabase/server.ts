import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import {
  getSupabasePublicConfig,
  isSupabasePublicConfigured,
} from "@/lib/supabase/env";

export function isSupabaseAuthConfigured(): boolean {
  return isSupabasePublicConfigured();
}

export async function createSupabaseServerClient() {
  const config = getSupabasePublicConfig();

  if (!config) {
    throw new Error(
      "Supabase auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(
    config.url,
    config.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component — middleware handles refresh.
          }
        },
      },
    },
  );
}