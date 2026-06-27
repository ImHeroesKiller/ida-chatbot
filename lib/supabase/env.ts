export interface SupabasePublicConfig {
  url: string;
  anonKey: string;
}

/** Anon/publishable keys are long JWT-like strings (not empty placeholders). */
const MIN_ANON_KEY_LENGTH = 20;

/**
 * Supabase client expects the project root URL only:
 *   https://<ref>.supabase.co
 * If env contains /rest/v1 or /auth/v1, SDK builds broken paths like:
 *   /rest/v1/auth/v1/authorize  → 404
 */
export function normalizeSupabaseProjectUrl(raw: string): string | null {
  let value = raw.trim();
  if (!value) return null;

  value = value.replace(/\/+$/, "");
  value = value.replace(/\/rest\/v1$/i, "");
  value = value.replace(/\/auth\/v1$/i, "");
  value = value.replace(/\/storage\/v1$/i, "");
  value = value.replace(/\/functions\/v1$/i, "");
  value = value.replace(/\/+$/, "");

  if (!/^https?:\/\//i.test(value)) return null;

  try {
    const parsed = new URL(value);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!rawUrl || !anonKey || anonKey.length < MIN_ANON_KEY_LENGTH) {
    return null;
  }

  const url = normalizeSupabaseProjectUrl(rawUrl);
  if (!url) return null;

  return { url, anonKey };
}

export function isSupabasePublicConfigured(): boolean {
  return getSupabasePublicConfig() !== null;
}