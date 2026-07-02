"use client";

import { HEAVY_TOOLS_MIN_WIDTH } from "@/lib/client/heavy-tools-desktop";
import { useMediaQuery } from "@/lib/client/use-media-query";

/** Right sidebar and tools rail are visible at ≥1024px (Tailwind `lg`). */
export function useDesktopSidebar(): boolean {
  return useMediaQuery(`(min-width: ${HEAVY_TOOLS_MIN_WIDTH}px)`);
}