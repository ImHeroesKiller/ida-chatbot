export interface SupabasePublicConfig {
  url: string;
  anonKey: string;
}

/** Anon/publishable keys are long JWT-like strings (not empty placeholders). */
const MIN_ANON_KEY_LENGTH = 20;

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey || anonKey.length < MIN_ANON_KEY_LENGTH) {
    return null;
  }

  try {
    new URL(url);
  } catch {
    return null;
  }

  return { url, anonKey };
}

export function isSupabasePublicConfigured(): boolean {
  return getSupabasePublicConfig() !== null;
}