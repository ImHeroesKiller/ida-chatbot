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

import { useAppFeatures } from "@/lib/client/use-app-features";
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

async function playServerTts(text: string): Promise<void> {
  const response = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "TTS request failed.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  await new Promise<void>((resolve, reject) => {
    const audio = new Audio(url);
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to play TTS audio."));
    };
    void audio.play().catch(reject);
  });
}

export function SpeechSynthesisProvider({ children }: { children: ReactNode }) {
  const { prefs } = useVoicePrefs();
  const appFeatures = useAppFeatures();
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
      if (!text.trim()) return;

      stop();

      const plainText = stripMarkdownForSpeech(text);
      if (!plainText) return;

      const ttsConfig = appFeatures?.tts;
      const engine = ttsConfig?.engine ?? "browser";

      if (engine !== "browser") {
        setSpeakingMessageId(messageId);
        void playServerTts(plainText)
          .catch((error) => console.error("[IDA TTS]", error))
          .finally(() => setSpeakingMessageId(null));
        return;
      }

      if (!isSupported) return;

      const detectedLocale = detectSpeechLanguage(plainText);
      const voiceLocale = prefs.voiceLanguage ?? detectedLocale;
      const lang = getLocaleTag(voiceLocale);
      const adminVoiceId = ttsConfig?.voiceId?.trim();
      const voice =
        adminVoiceId
          ? voices.find((item) => item.name.includes(adminVoiceId)) ??
            pickBestVoice(voices, voiceLocale)
          : pickBestVoice(voices, voiceLocale);

      const utterance = new SpeechSynthesisUtterance(plainText);
      utterance.lang = lang;
      utterance.rate = ttsConfig?.speed ?? prefs.speechRate;
      utterance.pitch = ttsConfig?.pitch ?? prefs.speechPitch;
      if (voice) utterance.voice = voice;

      utterance.onstart = () => setSpeakingMessageId(messageId);
      utterance.onend = () => setSpeakingMessageId(null);
      utterance.onerror = () => setSpeakingMessageId(null);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [
      appFeatures?.tts,
      isSupported,
      prefs.speechPitch,
      prefs.speechRate,
      prefs.voiceLanguage,
      stop,
      voices,
    ],
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