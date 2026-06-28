"use client";

import type { ModelSelection, TtsEngine } from "@/lib/admin/types";

export interface AppFeatures {
  rag: boolean;
  voice: boolean;
  ocr: boolean;
  autoSpeak: boolean;
  webSearch: boolean;
}

export interface AppTtsConfig {
  engine: TtsEngine;
  voiceId: string;
  speed: number;
  pitch: number;
}

export interface AppFeaturesResponse {
  features: AppFeatures;
  tts: AppTtsConfig;
  visionModel: ModelSelection;
  ttsEngines: Record<TtsEngine, boolean>;
  webSearchAvailable: boolean;
}

const DEFAULT_FEATURES: AppFeatures = {
  rag: true,
  voice: true,
  ocr: true,
  autoSpeak: false,
  webSearch: true,
};

const DEFAULT_TTS: AppTtsConfig = {
  engine: "browser",
  voiceId: "",
  speed: 1,
  pitch: 1,
};

let cached: AppFeaturesResponse | null = null;

export async function fetchAppFeatures(): Promise<AppFeaturesResponse> {
  if (cached) return cached;

  try {
    const response = await fetch("/api/features");
    if (!response.ok) {
      return {
        features: DEFAULT_FEATURES,
        tts: DEFAULT_TTS,
        visionModel: { id: "gemini-2.5-flash", provider: "google" },
        ttsEngines: {
          browser: true,
          openai: false,
          xai: false,
          groq: false,
        },
        webSearchAvailable: false,
      };
    }

    const data = (await response.json()) as Partial<AppFeaturesResponse>;
    cached = {
      features: { ...DEFAULT_FEATURES, ...data.features },
      tts: { ...DEFAULT_TTS, ...data.tts },
      visionModel: data.visionModel ?? {
        id: "gemini-2.5-flash",
        provider: "google",
      },
      ttsEngines: {
        browser: true,
        openai: Boolean(data.ttsEngines?.openai),
        xai: Boolean(data.ttsEngines?.xai),
        groq: false,
        ...data.ttsEngines,
      },
      webSearchAvailable: Boolean(data.webSearchAvailable),
    };
    return cached;
  } catch {
    return {
      features: DEFAULT_FEATURES,
      tts: DEFAULT_TTS,
      visionModel: { id: "gemini-2.5-flash", provider: "google" },
      ttsEngines: {
        browser: true,
        openai: false,
        xai: false,
        groq: false,
      },
      webSearchAvailable: false,
    };
  }
}

export function invalidateFeaturesCache(): void {
  cached = null;
}