"use client";

import { useCallback, useEffect, useState } from "react";

import type { Locale } from "@/lib/config";

export const VOICE_PREFS_KEY = "ida-voice-prefs";

export interface VoicePrefs {
  autoSpeak: boolean;
  speechRate: number;
  voiceLanguage: Locale;
  sendAsVoiceNote: boolean;
  reviewVoiceBeforeSend: boolean;
}

const DEFAULT_PREFS: VoicePrefs = {
  autoSpeak: false,
  speechRate: 1,
  voiceLanguage: "id",
  sendAsVoiceNote: false,
  reviewVoiceBeforeSend: false,
};

function readPrefs(): VoicePrefs {
  try {
    const raw = localStorage.getItem(VOICE_PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<VoicePrefs>) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function writePrefs(prefs: VoicePrefs) {
  try {
    localStorage.setItem(VOICE_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function useVoicePrefs() {
  const [prefs, setPrefsState] = useState<VoicePrefs>(DEFAULT_PREFS);

  useEffect(() => {
    setPrefsState(readPrefs());
  }, []);

  const setPrefs = useCallback((patch: Partial<VoicePrefs>) => {
    setPrefsState((prev) => {
      const next = { ...prev, ...patch };
      writePrefs(next);
      return next;
    });
  }, []);

  return { prefs, setPrefs };
}