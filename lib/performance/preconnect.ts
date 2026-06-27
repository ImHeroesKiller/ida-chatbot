import { getSupabasePublicConfig } from "@/lib/supabase/env";

const GEMINI_ORIGIN = "https://generativelanguage.googleapis.com";

export function getPreconnectOrigins(): string[] {
  const origins = new Set<string>([GEMINI_ORIGIN]);

  const supabase = getSupabasePublicConfig();
  if (supabase?.url) {
    try {
      origins.add(new URL(supabase.url).origin);
    } catch {
      // ignore invalid URL
    }
  }

  return [...origins];
}