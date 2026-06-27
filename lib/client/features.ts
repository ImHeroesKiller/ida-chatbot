"use client";

export interface AppFeatures {
  rag: boolean;
  voice: boolean;
  ocr: boolean;
  autoSpeak: boolean;
}

const DEFAULT_FEATURES: AppFeatures = {
  rag: true,
  voice: true,
  ocr: true,
  autoSpeak: false,
};

let cachedFeatures: AppFeatures | null = null;

export async function fetchAppFeatures(): Promise<AppFeatures> {
  if (cachedFeatures) return cachedFeatures;

  try {
    const response = await fetch("/api/features");
    if (!response.ok) return DEFAULT_FEATURES;

    const data = (await response.json()) as { features?: AppFeatures };
    cachedFeatures = { ...DEFAULT_FEATURES, ...data.features };
    return cachedFeatures;
  } catch {
    return DEFAULT_FEATURES;
  }
}

export function invalidateFeaturesCache(): void {
  cachedFeatures = null;
}