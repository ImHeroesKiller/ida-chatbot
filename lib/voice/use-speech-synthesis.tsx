"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { Locale } from "@/lib/config";
import { useVoicePrefs } from "@/lib/voice/voice-prefs";

const LOCALE_TAGS: Record<Locale, string> = {
  id: "id-ID",
  en: "en-US",
  zh: "zh-CN",
};

interface SpeechSynthesisContextValue {
  isSupported: boolean;
  speakingMessageId: string | null;
  speak: (messageId: string, text: string) => void;
  stop: () => void;
  toggle: (messageId: string, text: string) => void;
}

const SpeechSynthesisContext =
  createContext<SpeechSynthesisContextValue | null>(null);

export function SpeechSynthesisProvider({ children }: { children: ReactNode }) {
  const { prefs } = useVoicePrefs();
  const [isSupported, setIsSupported] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(
    null,
  );
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setIsSupported(
      typeof window !== "undefined" && "speechSynthesis" in window,
    );
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setSpeakingMessageId(null);
  }, []);

  const speak = useCallback(
    (messageId: string, text: string) => {
      if (!isSupported || !text.trim()) return;

      stop();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LOCALE_TAGS[prefs.voiceLanguage];
      utterance.rate = prefs.speechRate;

      utterance.onstart = () => setSpeakingMessageId(messageId);
      utterance.onend = () => setSpeakingMessageId(null);
      utterance.onerror = () => setSpeakingMessageId(null);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, prefs.speechRate, prefs.voiceLanguage, stop],
  );

  const toggle = useCallback(
    (messageId: string, text: string) => {
      if (speakingMessageId === messageId) stop();
      else speak(messageId, text);
    },
    [speak, speakingMessageId, stop],
  );

  return (
    <SpeechSynthesisContext.Provider
      value={{ isSupported, speakingMessageId, speak, stop, toggle }}
    >
      {children}
    </SpeechSynthesisContext.Provider>
  );
}

export function useSpeechSynthesis() {
  const context = useContext(SpeechSynthesisContext);
  if (!context) {
    throw new Error(
      "useSpeechSynthesis must be used within SpeechSynthesisProvider",
    );
  }
  return context;
}