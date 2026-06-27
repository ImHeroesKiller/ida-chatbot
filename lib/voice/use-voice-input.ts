"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Locale } from "@/lib/config";

const LOCALE_TAGS: Record<Locale, string> = {
  id: "id-ID",
  en: "en-US",
  zh: "zh-CN",
};

export type VoiceInputErrorCode =
  | "unsupported"
  | "not-allowed"
  | "no-speech"
  | "network"
  | "mic-failed"
  | "start-failed"
  | "aborted"
  | "unknown";

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;

  const win = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };

  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

function mapRecognitionError(error: string): VoiceInputErrorCode {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "not-allowed";
    case "no-speech":
      return "no-speech";
    case "network":
      return "network";
    case "aborted":
      return "aborted";
    case "audio-capture":
      return "mic-failed";
    default:
      return "unknown";
  }
}

export function useVoiceInput(locale: Locale) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<VoiceInputErrorCode | null>(null);
  const [waveformLevels, setWaveformLevels] = useState<number[]>(
    Array(12).fill(0.15),
  );

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wantListeningRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    setIsSupported(Boolean(getSpeechRecognition()));
  }, []);

  const stopWaveform = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    setWaveformLevels(Array(12).fill(0.15));
  }, []);

  const startWaveform = useCallback(
    (stream: MediaStream) => {
      stopWaveform();
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(data);
        const bars = 12;
        const step = Math.floor(data.length / bars);
        const next = Array.from({ length: bars }, (_, index) => {
          const value = data[index * step] ?? 0;
          return Math.max(0.12, value / 255);
        });
        setWaveformLevels(next);
        rafRef.current = requestAnimationFrame(tick);
      };

      tick();
    },
    [stopWaveform],
  );

  const requestMicrophone = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new DOMException("Microphone unavailable.", "NotSupportedError");
    }
    return navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
  }, []);

  const stopRecognition = useCallback(() => {
    wantListeningRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    stopWaveform();
    setIsListening(false);
  }, [stopWaveform]);

  const launchRecognitionRef = useRef<() => void>(() => {});

  const launchRecognition = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor || !wantListeningRef.current) return;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = LOCALE_TAGS[locale];

    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (!result) continue;
        const chunk = result[0]?.transcript ?? "";
        if (result.isFinal) finalText += chunk;
        else interim += chunk;
      }

      if (finalText) {
        setTranscript((prev) => {
          const combined = `${prev} ${finalText}`.trim();
          return combined;
        });
      }
      setInterimTranscript(interim);
      setError(null);
    };

    recognition.onerror = (event) => {
      const code = mapRecognitionError(event.error);
      if (code === "aborted") return;

      if (code === "no-speech" && wantListeningRef.current) {
        return;
      }

      setError(code);

      if (code === "not-allowed" || code === "network" || code === "mic-failed") {
        wantListeningRef.current = false;
        setIsListening(false);
        stopWaveform();
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (wantListeningRef.current) {
        window.setTimeout(() => launchRecognitionRef.current(), 200);
        return;
      }
      setIsListening(false);
      stopWaveform();
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch {
      setError("start-failed");
      wantListeningRef.current = false;
      setIsListening(false);
      stopWaveform();
    }
  }, [locale, stopWaveform]);

  useEffect(() => {
    launchRecognitionRef.current = launchRecognition;
  }, [launchRecognition]);

  const startListening = useCallback(async () => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setError("unsupported");
      return;
    }

    setError(null);
    setTranscript("");
    setInterimTranscript("");

    try {
      const stream = await requestMicrophone();
      startWaveform(stream);
      wantListeningRef.current = true;
      launchRecognition();
    } catch (err) {
      wantListeningRef.current = false;
      stopWaveform();

      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("not-allowed");
        return;
      }

      setError("mic-failed");
    }
  }, [launchRecognition, requestMicrophone, startWaveform, stopWaveform]);

  const stopListening = useCallback(() => {
    stopRecognition();
  }, [stopRecognition]);

  const toggleListening = useCallback(() => {
    if (isListening || wantListeningRef.current) stopListening();
    else void startListening();
  }, [isListening, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  useEffect(() => () => stopRecognition(), [stopRecognition]);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    displayTranscript: `${transcript} ${interimTranscript}`.trim(),
    error,
    waveformLevels,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
}