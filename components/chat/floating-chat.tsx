"use client";

/**
 * @deprecated Disabled — full-page ChatRoom is the default at / and /chat.
 * Kept for optional embed on other pages; not mounted on the main route.
 */

import type { Locale } from "@/lib/config";

interface FloatingChatProps {
  defaultLocale?: Locale;
}

/** @deprecated Use ChatRoom at / instead. */
export function FloatingChat(_: FloatingChatProps = {}) {
  return null;
}