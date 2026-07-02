"use client";

import { useEffect, useState } from "react";

const DEFAULT_IDLE_TIMEOUT_MS = 120;

export interface DeferReadyOptions {
  enabled?: boolean;
  /** Passed to `requestIdleCallback` as `timeout`. */
  idleTimeout?: number;
  /** Minimum delay after mount before becoming ready. */
  minDelay?: number;
  /** Wait for `window` `load` before scheduling idle. */
  afterWindowLoad?: boolean;
}

function scheduleIdle(
  callback: () => void,
  timeout = DEFAULT_IDLE_TIMEOUT_MS,
): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(callback, { timeout });
    return () => window.cancelIdleCallback(id);
  }

  const id = window.setTimeout(callback, 0);
  return () => window.clearTimeout(id);
}

function normalizeDeferOptions(
  options: boolean | DeferReadyOptions = true,
): Required<DeferReadyOptions> {
  if (typeof options === "boolean") {
    return {
      enabled: options,
      idleTimeout: DEFAULT_IDLE_TIMEOUT_MS,
      minDelay: 0,
      afterWindowLoad: false,
    };
  }

  return {
    enabled: options.enabled ?? true,
    idleTimeout: options.idleTimeout ?? DEFAULT_IDLE_TIMEOUT_MS,
    minDelay: options.minDelay ?? 0,
    afterWindowLoad: options.afterWindowLoad ?? false,
  };
}

/** Defer non-critical subtree until after first paint / idle (configurable). */
export function useDeferredReady(
  options: boolean | DeferReadyOptions = true,
): boolean {
  const { enabled, idleTimeout, minDelay, afterWindowLoad } =
    normalizeDeferOptions(options);
  const [ready, setReady] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setReady(false);
      return;
    }

    let cancelled = false;
    let cancelIdle: (() => void) | undefined;
    let cancelDelay: number | undefined;
    let removeLoadListener: (() => void) | undefined;

    const markReady = () => {
      if (cancelled) return;
      setReady(true);
    };

    const schedule = () => {
      if (minDelay > 0) {
        cancelDelay = window.setTimeout(() => {
          cancelIdle = scheduleIdle(markReady, idleTimeout);
        }, minDelay);
        return;
      }

      cancelIdle = scheduleIdle(markReady, idleTimeout);
    };

    if (afterWindowLoad && document.readyState !== "complete") {
      const onLoad = () => schedule();
      window.addEventListener("load", onLoad, { once: true });
      removeLoadListener = () => window.removeEventListener("load", onLoad);
    } else {
      schedule();
    }

    return () => {
      cancelled = true;
      removeLoadListener?.();
      if (cancelDelay) window.clearTimeout(cancelDelay);
      cancelIdle?.();
    };
  }, [afterWindowLoad, enabled, idleTimeout, minDelay]);

  return ready;
}