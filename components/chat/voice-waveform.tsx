"use client";

import { cn } from "@/lib/utils";

interface VoiceWaveformProps {
  levels: number[];
  className?: string;
}

export function VoiceWaveform({ levels, className }: VoiceWaveformProps) {
  return (
    <div className={cn("flex h-8 items-end gap-0.5", className)}>
      {levels.map((level, index) => (
        <span
          key={index}
          className="w-1 rounded-full bg-primary/80 transition-all duration-75"
          style={{ height: `${Math.round(level * 100)}%` }}
        />
      ))}
    </div>
  );
}