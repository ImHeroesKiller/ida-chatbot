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

import { detectSpeechLanguage } from "@/lib/voice/detect-language";
import { getLocaleTag, pickBestVoice } from "@/lib/voice/pick-voice";
import { stripMarkdownForSpeech } from "@/lib/voice/strip-markdown";
import { useVoicePrefs } from "@/lib/voice/voice-prefs";

interface SpeechSynthesisContextValue {
  isSupported: boolean;
  speakingMessageId: string | null;
  speak: (messageId: string, text: string) => void;
  stop: () => void;
  toggle: (messageId: string, text: string) => void;
}

const SpeechSynthesisContext =
  createContext<SpeechSynthesisContextValue | null>(null);

function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve([]);
      return;
    }

    const synth = window.speechSynthesis;
    const existing = synth.getVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }

    const onVoicesChanged = () => {
      const voices = synth.getVoices();
      if (voices.length > 0) {
        synth.removeEventListener("voiceschanged", onVoicesChanged);
        resolve(voices);
      }
    };

    synth.addEventListener("voiceschanged", onVoicesChanged);

    window.setTimeout(() => {
      synth.removeEventListener("voiceschanged", onVoicesChanged);
      resolve(synth.getVoices());
    }, 1500);
  });
}

export function SpeechSynthesisProvider({ children }: { children: ReactNode }) {
  const { prefs } = useVoicePrefs();
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(
    null,
  );
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    setIsSupported(true);

    void waitForVoices().then(setVoices);

    const synth = window.speechSynthesis;
    const refresh = () => setVoices(synth.getVoices());
    synth.addEventListener("voiceschanged", refresh);
    return () => synth.removeEventListener("voiceschanged", refresh);
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

      const plainText = stripMarkdownForSpeech(text);
      if (!plainText) return;

      const detectedLocale = detectSpeechLanguage(plainText);
      const lang = getLocaleTag(detectedLocale);
      const voice = pickBestVoice(voices, detectedLocale);

      const utterance = new SpeechSynthesisUtterance(plainText);
      utterance.lang = lang;
      utterance.rate = prefs.speechRate;
      if (voice) utterance.voice = voice;

      utterance.onstart = () => setSpeakingMessageId(messageId);
      utterance.onend = () => setSpeakingMessageId(null);
      utterance.onerror = () => setSpeakingMessageId(null);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, prefs.speechRate, stop, voices],
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