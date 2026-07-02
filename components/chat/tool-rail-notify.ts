"use client";

import toast from "react-hot-toast";

import type { ToolRailLabelKey } from "@/components/chat/tool-rail-config";
import { dispatchHeavyToolsDesktopNotice } from "@/lib/client/heavy-tools-desktop";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";

export function notifyToolComingSoon(
  locale: Locale,
  labelKey: ToolRailLabelKey,
): void {
  const copy = COPY[locale];
  toast(`${copy[labelKey]} — ${copy.toolsComingSoon}`, { duration: 2500 });
}

export function notifyHeavyToolsDesktopOnly(_locale: Locale): void {
  dispatchHeavyToolsDesktopNotice();
}