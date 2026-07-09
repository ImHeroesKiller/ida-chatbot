"use client";

import NextLink from "next/link";

const DEMO_URL = "https://ida.arywibowo.id/demo";
const CHAT_URL = "https://ida.arywibowo.id/chat";

export function LandingHeaderActions() {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <NextLink
        href={DEMO_URL}
        className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:px-4"
      >
        Demo
      </NextLink>
      <NextLink
        href={CHAT_URL}
        className="inline-flex h-9 items-center justify-center rounded-lg border bg-card/60 px-3 text-sm font-medium transition-colors hover:bg-muted sm:px-4"
      >
        Chat
      </NextLink>
    </div>
  );
}
