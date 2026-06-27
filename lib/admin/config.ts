import { IDA_CONFIG } from "@/lib/config";
import type { ModelProvider } from "@/lib/admin/models";
import type { IdaAppConfig } from "@/lib/admin/types";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";

export const APP_CONFIG_KEY = "app_settings";

export const DEFAULT_APP_CONFIG: IdaAppConfig = {
  defaultModel: {
    id: IDA_CONFIG.model,
    provider: "google",
  },
  fallbackModel: {
    id: "gemini-2.5-flash-lite",
    provider: "google",
  },
  visionModel: {
    id: "gemini-2.5-flash",
    provider: "google",
  },
  tts: {
    engine: "browser",
    voiceId: "",
    speed: 1,
    pitch: 1,
  },
  features: {
    rag: true,
    voice: true,
    ocr: true,
    autoSpeak: false,
    webSearch: true,
  },
  systemPromptOverride: null,
  rag: {
    confidenceThreshold: IDA_CONFIG.ragConfidenceThreshold,
    topK: IDA_CONFIG.retrievalTopK,
    retrievalThreshold: IDA_CONFIG.retrievalThreshold,
  },
  webSearch: {
    maxResults: 5,
  },
};

function mergeConfig(partial: Partial<IdaAppConfig> | null): IdaAppConfig {
  if (!partial) return DEFAULT_APP_CONFIG;

  return {
    defaultModel: {
      id: partial.defaultModel?.id ?? DEFAULT_APP_CONFIG.defaultModel.id,
      provider:
        (partial.defaultModel?.provider as ModelProvider | undefined) ??
        DEFAULT_APP_CONFIG.defaultModel.provider,
    },
    fallbackModel: partial.fallbackModel ?? DEFAULT_APP_CONFIG.fallbackModel,
    visionModel: {
      id: partial.visionModel?.id ?? DEFAULT_APP_CONFIG.visionModel.id,
      provider:
        (partial.visionModel?.provider as ModelProvider | undefined) ??
        DEFAULT_APP_CONFIG.visionModel.provider,
    },
    tts: {
      engine: partial.tts?.engine ?? DEFAULT_APP_CONFIG.tts.engine,
      voiceId: partial.tts?.voiceId ?? DEFAULT_APP_CONFIG.tts.voiceId,
      speed: partial.tts?.speed ?? DEFAULT_APP_CONFIG.tts.speed,
      pitch: partial.tts?.pitch ?? DEFAULT_APP_CONFIG.tts.pitch,
    },
    features: {
      rag: partial.features?.rag ?? DEFAULT_APP_CONFIG.features.rag,
      voice: partial.features?.voice ?? DEFAULT_APP_CONFIG.features.voice,
      ocr: partial.features?.ocr ?? DEFAULT_APP_CONFIG.features.ocr,
      autoSpeak:
        partial.features?.autoSpeak ?? DEFAULT_APP_CONFIG.features.autoSpeak,
      webSearch:
        partial.features?.webSearch ?? DEFAULT_APP_CONFIG.features.webSearch,
    },
    systemPromptOverride:
      partial.systemPromptOverride ?? DEFAULT_APP_CONFIG.systemPromptOverride,
    rag: {
      confidenceThreshold:
        partial.rag?.confidenceThreshold ??
        DEFAULT_APP_CONFIG.rag.confidenceThreshold,
      topK: partial.rag?.topK ?? DEFAULT_APP_CONFIG.rag.topK,
      retrievalThreshold:
        partial.rag?.retrievalThreshold ??
        DEFAULT_APP_CONFIG.rag.retrievalThreshold,
    },
    webSearch: {
      maxResults:
        partial.webSearch?.maxResults ??
        DEFAULT_APP_CONFIG.webSearch.maxResults,
    },
  };
}

let memoryCache: { value: IdaAppConfig; loadedAt: number } | null = null;
const CACHE_TTL_MS = 15_000;

export async function loadAppConfig(options?: {
  bypassCache?: boolean;
}): Promise<IdaAppConfig> {
  if (
    !options?.bypassCache &&
    memoryCache &&
    Date.now() - memoryCache.loadedAt < CACHE_TTL_MS
  ) {
    return memoryCache.value;
  }

  if (!isSupabaseConfigured()) {
    const value = DEFAULT_APP_CONFIG;
    memoryCache = { value, loadedAt: Date.now() };
    return value;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("ida_app_config")
      .select("value")
      .eq("key", APP_CONFIG_KEY)
      .maybeSingle();

    if (error) {
      console.error("[IDA app-config load]", error);
      return DEFAULT_APP_CONFIG;
    }

    const value = mergeConfig((data?.value as Partial<IdaAppConfig>) ?? null);
    memoryCache = { value, loadedAt: Date.now() };
    return value;
  } catch (error) {
    console.error("[IDA app-config load]", error);
    return DEFAULT_APP_CONFIG;
  }
}

export async function saveAppConfig(config: IdaAppConfig): Promise<void> {
  if (!isSupabaseConfigured()) {
    memoryCache = { value: config, loadedAt: Date.now() };
    return;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("ida_app_config").upsert(
    {
      key: APP_CONFIG_KEY,
      value: config,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    throw new Error(error.message);
  }

  memoryCache = { value: config, loadedAt: Date.now() };
}

export function invalidateAppConfigCache(): void {
  memoryCache = null;
}