import Image from "next/image";

import { COPY } from "@/lib/i18n";
import { LCP_LOGO_PATH } from "@/components/landing/landing-lcp-logo";

/**
 * Server-rendered LCP shell for /chat.
 * Paints before client JS hydrates; hidden once ChatRoom sets data-chat-ready.
 */
export function ChatLcpShell() {
  const copy = COPY.id;

  return (
    <div
      id="chat-lcp-shell"
      className="ida-chat-lcp-shell pointer-events-none absolute inset-0 z-[1] flex min-h-0 flex-col overflow-hidden bg-background font-sans"
      aria-hidden="true"
    >
      <header className="sticky top-0 z-50 flex h-12 shrink-0 items-center justify-between gap-2 border-b bg-background px-2.5 sm:gap-3 sm:px-4 lg:h-11">
        <div className="size-10 shrink-0 rounded-2xl bg-muted/40 md:hidden" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold tracking-tight">IDA</p>
          <p className="hidden truncate text-[11px] text-muted-foreground sm:block">
            {copy.subtitle}
          </p>
        </div>
        <div className="size-9 shrink-0 rounded-lg bg-muted/40" />
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-7">
          <Image
            src={LCP_LOGO_PATH}
            alt=""
            width={80}
            height={80}
            sizes="80px"
            priority
            fetchPriority="high"
            className="h-20 w-20 rounded-2xl object-contain opacity-20 grayscale"
          />
        </div>
        <h1 className="mb-3 font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif] text-3xl font-extrabold tracking-tight text-foreground/80">
          {copy.emptyStateTitle}
        </h1>
        <p className="mx-auto max-w-sm font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif] text-lg font-medium leading-relaxed text-muted-foreground">
          {copy.emptyStateSubtitle}
        </p>
      </div>

      <div className="shrink-0 border-t px-3 py-3 sm:px-5">
        <div className="ida-message-width mx-auto h-12 rounded-2xl bg-muted/40" />
      </div>
    </div>
  );
}