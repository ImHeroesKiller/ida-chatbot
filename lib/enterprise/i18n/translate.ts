export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function interpolate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (str, [key, value]) => str.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function translate(
  messages: Record<string, unknown>,
  key: string,
  params?: Record<string, string | number>,
  fallback?: string,
): string {
  const value = getNestedValue(messages, key);
  if (typeof value === "string") {
    return interpolate(value, params);
  }
  return fallback ?? key;
}