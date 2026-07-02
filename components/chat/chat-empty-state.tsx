"use client";

import { IdaLogo } from "@/components/brand/ida-logo";

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
        "flex w-full flex-col items-center justify-center px-6 text-center",
        className,
      )}
    >
      <div className="mb-7">
        <IdaLogo
          size={80}
          priority
          className="h-20 w-20 opacity-20 grayscale"
        />
      </div>

      <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-foreground/80">
        {copy.emptyStateTitle}
      </h1>
      <p className="mx-auto max-w-sm text-lg font-medium leading-relaxed text-muted-foreground">
        {copy.emptyStateSubtitle}
      </p>
    </div>
  );
}