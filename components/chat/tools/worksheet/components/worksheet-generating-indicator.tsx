"use client";

import { Loader2, Sparkles } from "lucide-react";

import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface WorksheetGeneratingIndicatorProps {
  locale: Locale;
  variant?: "panel" | "compact" | "card";
  className?: string;
}

export function WorksheetGeneratingIndicator({
  locale,
  variant = "panel",
  className,
}: WorksheetGeneratingIndicatorProps) {
  const copy = COPY[locale];

  if (variant === "card") {
    return (
      <li
        className={cn("list-none", className)}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="overflow-hidden rounded-2xl border border-dashed border-primary/30 bg-primary/[0.04] shadow-sm">
          <div className="flex items-start gap-3 p-3.5 sm:p-4">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
            <div className="min-w-0 flex-1 space-y-2.5">
              <p className="text-sm font-semibold text-foreground/90">
                {copy.worksheetGeneratingCardLabel}
              </p>
              <div className="space-y-2">
                <div className="h-2.5 w-[88%] animate-pulse rounded-full bg-primary/10" />
                <div className="h-2.5 w-[72%] animate-pulse rounded-full bg-primary/10" />
                <div className="h-2.5 w-[56%] animate-pulse rounded-full bg-muted" />
              </div>
            </div>
          </div>
        </div>
      </li>
    );
  }

  const isCompact = variant === "compact";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-primary/25 bg-background/60 text-center dark:bg-background/40",
        isCompact ? "gap-2 px-4 py-8" : "gap-3 px-4 py-10",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/15" />
        <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-foreground/90">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {copy.worksheetGenerating}
        </p>
        <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
          {copy.worksheetGeneratingSubtext}
        </p>
      </div>
      {!isCompact ? (
        <div className="mt-1 w-full max-w-sm space-y-2 rounded-xl border bg-card/80 p-3">
          <div className="h-2.5 w-[90%] animate-pulse rounded-full bg-muted" />
          <div className="h-2.5 w-[75%] animate-pulse rounded-full bg-muted" />
          <div className="h-2.5 w-[60%] animate-pulse rounded-full bg-muted/80" />
        </div>
      ) : null}
    </div>
  );
}