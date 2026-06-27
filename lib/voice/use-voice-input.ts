"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { transcribeAudioBlob } from "@/lib/client/transcribe-audio";
import type { Locale } from "@/lib/config";


export type VoiceInputErrorCode =
  | "unsupported"
  | "not-allowed"
  | "no-speech"
  | "mic-failed"
  | "transcribe-failed"
  | "unknown";

function pickRecorderMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];

  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }

  return "audio/webm";
}

async function probeMicrophonePermission(): Promise<void> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new DOMException("Microphone unavailable.", "NotSupportedError");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
    },
  });

  stream.getTracks().forEach((track) => track.stop());
}

export function useVoiceInput(locale: Locale, sessionId?: string) {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [hasVoiceInput, setHasVoiceInput] = useState(false);
  const [error, setError] = useState<VoiceInputErrorCode | null>(null);
  const [recorderLevels, setRecorderLevels] = useState<number[]>(
    Array(12).fill(0.15),
  );

  const wantListeningRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    setIsSupported(Boolean(navigator.mediaDevices?.getUserMedia));
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
    setRecorderLevels(Array(12).fill(0.15));
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
        setRecorderLevels(next);
        rafRef.current = requestAnimationFrame(tick);
      };

      tick();
    },
    [stopWaveform],
  );

  const stopRecorder = useCallback(async (): Promise<Blob | null> => {
    const recorder = recorderRef.current;
    recorderRef.current = null;

    if (!recorder || recorder.state === "inactive") {
      return chunksRef.current.length
        ? new Blob(chunksRef.current, {
            type: recorder?.mimeType ?? "audio/webm",
          })
        : null;
    }

    return new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        chunksRef.current = [];
        resolve(blob.size > 0 ? blob : null);
      };
      recorder.stop();
    });
  }, []);

  const transcribeRecording = useCallback(
    async (blob: Blob) => {
      setIsTranscribing(true);
      setError(null);

      try {
        const text = await transcribeAudioBlob({ blob, locale, sessionId });
        if (text) {
          setTranscript((prev) => `${prev} ${text}`.trim());
        } else {
          setError("no-speech");
        }
      } catch {
        setError("transcribe-failed");
      } finally {
        setIsTranscribing(false);
      }
    },
    [locale, sessionId],
  );

  const startRecorder = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      startWaveform(stream);

      const mimeType = pickRecorderMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.start(300);
      recorderRef.current = recorder;
      setIsListening(true);
      setError(null);
    } catch (err) {
      wantListeningRef.current = false;
      stopWaveform();
      setIsListening(false);

      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("not-allowed");
        return;
      }

      setError("mic-failed");
    }
  }, [startWaveform, stopWaveform]);

  const stopListening = useCallback(async () => {
    wantListeningRef.current = false;

    const blob = await stopRecorder();
    stopWaveform();
    setIsListening(false);

    if (blob) await transcribeRecording(blob);
  }, [stopRecorder, stopWaveform, transcribeRecording]);

  const startListening = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("unsupported");
      return;
    }

    setError(null);
    setTranscript("");
    setHasVoiceInput(true);

    try {
      await probeMicrophonePermission();
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("not-allowed");
        return;
      }
      setError("mic-failed");
      return;
    }

    wantListeningRef.current = true;
    await startRecorder();
  }, [startRecorder]);

  const toggleListening = useCallback(() => {
    if (isListening || isTranscribing) {
      void stopListening();
      return;
    }
    void startListening();
  }, [isListening, isTranscribing, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setHasVoiceInput(false);
    setError(null);
  }, []);

  useEffect(
    () => () => {
      wantListeningRef.current = false;
      void stopRecorder();
      stopWaveform();
    },
    [stopRecorder, stopWaveform],
  );

  return {
    isSupported,
    isListening,
    isTranscribing,
    hasVoiceInput,
    mode: isListening ? ("recorder" as const) : null,
    transcript,
    interimTranscript: "",
    displayTranscript: transcript,
    error,
    waveformLevels: recorderLevels,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
}