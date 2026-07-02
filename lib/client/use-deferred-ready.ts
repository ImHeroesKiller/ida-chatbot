"use client";

import { useEffect, useState } from "react";

const IDLE_TIMEOUT_MS = 120;

function scheduleIdle(callback: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(callback, { timeout: IDLE_TIMEOUT_MS });
    return () => window.cancelIdleCallback(id);
  }

  const id = window.setTimeout(callback, 0);
  return () => window.clearTimeout(id);
}

/** Defer non-critical subtree until after first paint / idle. */
export function useDeferredReady(enabled = true): boolean {
  const [ready, setReady] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setReady(false);
      return;
    }

    return scheduleIdle(() => setReady(true));
  }, [enabled]);

  return ready;
}