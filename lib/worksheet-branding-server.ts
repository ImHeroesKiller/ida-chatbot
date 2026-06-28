import {
  DEFAULT_WORKSHEET_BRANDING_CONFIG,
  parseWorksheetBrandingConfig,
  WORKSHEET_BRANDING_CONFIG_KEY,
  type WorksheetBrandingConfig,
} from "@/lib/worksheet-branding-config";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";

let memoryCache: { value: WorksheetBrandingConfig; loadedAt: number } | null =
  null;
const CACHE_TTL_MS = 15_000;

export async function loadWorksheetBrandingConfig(options?: {
  bypassCache?: boolean;
}): Promise<WorksheetBrandingConfig> {
  if (
    !options?.bypassCache &&
    memoryCache &&
    Date.now() - memoryCache.loadedAt < CACHE_TTL_MS
  ) {
    return memoryCache.value;
  }

  if (!isSupabaseConfigured()) {
    const value = DEFAULT_WORKSHEET_BRANDING_CONFIG;
    memoryCache = { value, loadedAt: Date.now() };
    return value;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("ida_app_config")
      .select("value")
      .eq("key", WORKSHEET_BRANDING_CONFIG_KEY)
      .maybeSingle();

    if (error) {
      console.error("[IDA worksheet-branding load]", error);
      return DEFAULT_WORKSHEET_BRANDING_CONFIG;
    }

    const value = parseWorksheetBrandingConfig(data?.value ?? null);
    memoryCache = { value, loadedAt: Date.now() };
    return value;
  } catch (error) {
    console.error("[IDA worksheet-branding load]", error);
    return DEFAULT_WORKSHEET_BRANDING_CONFIG;
  }
}

export async function saveWorksheetBrandingConfig(
  config: WorksheetBrandingConfig,
): Promise<void> {
  const normalized = parseWorksheetBrandingConfig(config);

  if (!isSupabaseConfigured()) {
    memoryCache = { value: normalized, loadedAt: Date.now() };
    return;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("ida_app_config").upsert(
    {
      key: WORKSHEET_BRANDING_CONFIG_KEY,
      value: normalized,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    throw new Error(error.message);
  }

  memoryCache = { value: normalized, loadedAt: Date.now() };
}

export function invalidateWorksheetBrandingCache(): void {
  memoryCache = null;
}