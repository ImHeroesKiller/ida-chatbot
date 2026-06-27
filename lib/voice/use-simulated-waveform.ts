"use client";

import { useEffect, useState } from "react";

export function useSimulatedWaveform(active: boolean) {
  const [levels, setLevels] = useState<number[]>(Array(12).fill(0.15));

  useEffect(() => {
    if (!active) {
      setLevels(Array(12).fill(0.15));
      return;
    }

    const tick = () => {
      setLevels(
        Array.from({ length: 12 }, () => 0.18 + Math.random() * 0.55),
      );
    };

    tick();
    const id = window.setInterval(tick, 120);
    return () => window.clearInterval(id);
  }, [active]);

  return levels;
}