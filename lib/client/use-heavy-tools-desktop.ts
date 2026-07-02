"use client";

import { useEffect, useState } from "react";

import {
  HEAVY_TOOLS_MIN_WIDTH,
  shouldAllowHeavyTools,
} from "@/lib/client/heavy-tools-desktop";

function readHeavyToolsAllowed(): boolean {
  if (typeof window === "undefined") return true;

  return shouldAllowHeavyTools({
    viewportWidth: window.innerWidth,
    userAgent: navigator.userAgent,
  });
}

/**
 * Worksheet & Workflow are desktop-only (≥1024px and non-mobile UA).
 */
export function useHeavyToolsDesktop(): {
  allowed: boolean;
  isRestricted: boolean;
} {
  const [allowed, setAllowed] = useState(readHeavyToolsAllowed);

  useEffect(() => {
    const update = () => setAllowed(readHeavyToolsAllowed());

    update();
    window.addEventListener("resize", update);

    const media = window.matchMedia(
      `(min-width: ${HEAVY_TOOLS_MIN_WIDTH}px)`,
    );
    media.addEventListener("change", update);

    return () => {
      window.removeEventListener("resize", update);
      media.removeEventListener("change", update);
    };
  }, []);

  return {
    allowed,
    isRestricted: !allowed,
  };
}