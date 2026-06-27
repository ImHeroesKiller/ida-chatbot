"use client";

import { Lightbulb, MessageSquare, Sparkles } from "lucide-react";

import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ChatEmptyStateProps {
  locale: Locale;
  className?: string;
}

export function ChatEmptyState({ locale, className }: ChatEmptyStateProps) {
  const copy = COPY[locale];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-dashed",
        "bg-gradient-to-b from-muted/40 via-muted/20 to-transparent",
        "px-5 py-8 text-center sm:px-8 sm:py-10",
        "dark:from-muted/30 dark:via-muted/10",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -top-8 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20"
        aria-hidden
      />

      <div className="relative mx-auto flex max-w-sm flex-col items-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 dark:bg-primary/15">
          <MessageSquare className="h-6 w-6 text-primary" />
        </div>

        <div className="mb-1 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <p className="text-sm font-semibold tracking-tight">
            {copy.emptyStateTitle}
          </p>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          {copy.emptyStateHint}
        </p>

        <div className="mt-5 w-full rounded-xl border bg-background/70 p-3 text-left dark:bg-background/50">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
            {copy.emptyStateTipsTitle}
          </div>
          <ul className="space-y-1.5">
            {copy.emptyStateTips.map((tip) => (
              <li
                key={tip}
                className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}