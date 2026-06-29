const ALLOWED_PREFIXES = ["/chat", "/agent", "/account"] as const;

/** Safe post-login paths (open redirect protection). */
export function isAllowedAuthRedirect(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  return ALLOWED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export function resolveAuthRedirect(
  path: string | null | undefined,
  fallback = "/chat",
): string {
  if (path && isAllowedAuthRedirect(path)) return path;
  return fallback;
}