"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useAudioWaveform(active: boolean) {
  const [levels, setLevels] = useState<number[]>(Array(12).fill(0.15));
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    analyserRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    setLevels(Array(12).fill(0.15));
  }, []);

  const start = useCallback(async () => {
    stop();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(data);
        const bars = 12;
        const step = Math.floor(data.length / bars);
        const next = Array.from({ length: bars }, (_, index) => {
          const value = data[index * step] ?? 0;
          return Math.max(0.12, value / 255);
        });
        setLevels(next);
        rafRef.current = requestAnimationFrame(tick);
      };

      tick();
    } catch {
      setLevels(Array(12).fill(0.35));
    }
  }, [stop]);

  useEffect(() => {
    if (active) void start();
    else stop();

    return stop;
  }, [active, start, stop]);

  return levels;
}