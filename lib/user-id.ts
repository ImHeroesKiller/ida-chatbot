const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates anonymous user ID (UUID v1-v5 format).
 * Note: Supabase auth user IDs may have different formats - those should be validated separately.
 */
export function isValidAnonymousUserId(value: string): boolean {
  return UUID_RE.test(value);
}

/**
 * Validates any user ID - accepts both anonymous UUID and Supabase auth user IDs.
 * Supabase user IDs can be UUID v4 or other formats.
 */
export function isValidUserId(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  
  // Accept standard UUID format (any version)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(value)) return true;
  
  // Accept Supabase-style user IDs (may include additional characters)
  const supabasePattern = /^[a-zA-Z0-9-_]{20,}$/;
  return supabasePattern.test(value);
}