import { DEFAULT_UI_CONFIG } from "@/lib/ui-config/defaults";
import { normalizeHexColor } from "@/lib/ui-config/color";
import type {
  IdaUiConfig,
  IdaUiConfigRow,
  UiAnimationLevel,
  UiDensity,
  UiFontSize,
  UiTheme,
} from "@/lib/ui-config/types";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";

export const UI_CONFIG_ID = "global";

const FONT_SIZES: UiFontSize[] = ["small", "medium", "large"];
const DENSITIES: UiDensity[] = ["compact", "comfortable", "spacious"];
const ANIMATION_LEVELS: UiAnimationLevel[] = ["full", "reduced", "none"];
const THEMES: UiTheme[] = ["light", "dark", "system"];

function isFontSize(value: string): value is UiFontSize {
  return (FONT_SIZES as string[]).includes(value);
}

function isDensity(value: string): value is UiDensity {
  return (DENSITIES as string[]).includes(value);
}

function isAnimationLevel(value: string): value is UiAnimationLevel {
  return (ANIMATION_LEVELS as string[]).includes(value);
}

function isTheme(value: string): value is UiTheme {
  return (THEMES as string[]).includes(value);
}

function rowToConfig(row: IdaUiConfigRow | null): IdaUiConfig {
  if (!row) return DEFAULT_UI_CONFIG;

  const primary = normalizeHexColor(row.primary_color) ?? DEFAULT_UI_CONFIG.primaryColor;

  return {
    theme: isTheme(row.theme) ? row.theme : DEFAULT_UI_CONFIG.theme,
    fontSize: isFontSize(row.font_size)
      ? row.font_size
      : DEFAULT_UI_CONFIG.fontSize,
    density: isDensity(row.density) ? row.density : DEFAULT_UI_CONFIG.density,
    animationLevel: isAnimationLevel(row.animation_level)
      ? row.animation_level
      : DEFAULT_UI_CONFIG.animationLevel,
    primaryColor: primary,
    messageMaxWidth: row.message_max_width || DEFAULT_UI_CONFIG.messageMaxWidth,
  };
}

function configToRow(config: IdaUiConfig): Omit<IdaUiConfigRow, "updated_at"> {
  return {
    id: UI_CONFIG_ID,
    theme: config.theme,
    font_size: config.fontSize,
    density: config.density,
    animation_level: config.animationLevel,
    primary_color: config.primaryColor,
    message_max_width: config.messageMaxWidth,
  };
}

let memoryCache: { value: IdaUiConfig; loadedAt: number } | null = null;
const CACHE_TTL_MS = 15_000;

export async function loadUiConfig(options?: {
  bypassCache?: boolean;
}): Promise<IdaUiConfig> {
  if (
    !options?.bypassCache &&
    memoryCache &&
    Date.now() - memoryCache.loadedAt < CACHE_TTL_MS
  ) {
    return memoryCache.value;
  }

  if (!isSupabaseConfigured()) {
    const value = DEFAULT_UI_CONFIG;
    memoryCache = { value, loadedAt: Date.now() };
    return value;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("ida_ui_config")
      .select("*")
      .eq("id", UI_CONFIG_ID)
      .maybeSingle();

    if (error) {
      console.error("[IDA ui-config load]", error);
      return DEFAULT_UI_CONFIG;
    }

    const value = rowToConfig((data as IdaUiConfigRow | null) ?? null);
    memoryCache = { value, loadedAt: Date.now() };
    return value;
  } catch (error) {
    console.error("[IDA ui-config load]", error);
    return DEFAULT_UI_CONFIG;
  }
}

export async function saveUiConfig(config: IdaUiConfig): Promise<void> {
  if (!isSupabaseConfigured()) {
    memoryCache = { value: config, loadedAt: Date.now() };
    return;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("ida_ui_config").upsert(
    {
      ...configToRow(config),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(error.message);
  }

  memoryCache = { value: config, loadedAt: Date.now() };
}

export function invalidateUiConfigCache(): void {
  memoryCache = null;
}