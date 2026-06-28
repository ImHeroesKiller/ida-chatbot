"use client";

import { Globe } from "lucide-react";

import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import type { IdaWebSearchSource } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WebSearchSourcesProps {
  sources: IdaWebSearchSource[];
  locale: Locale;
  className?: string;
}

function sourceLabel(source: IdaWebSearchSource): string {
  try {
    const host = new URL(source.url).hostname.replace(/^www\./, "");
    return host || source.title;
  } catch {
    return source.title;
  }
}

export function WebSearchSources({
  sources,
  locale,
  className,
}: WebSearchSourcesProps) {
  const copy = COPY[locale];

  if (!sources.length) return null;

  const visible = sources.slice(0, 3);
  const hiddenCount = Math.max(0, sources.length - visible.length);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-1.5 gap-y-0.5 px-0.5 text-[10px] text-muted-foreground/80",
        className,
      )}
    >
      <Globe className="size-3 shrink-0 opacity-50" aria-hidden />
      <span className="shrink-0">{copy.webSearchSources}:</span>
      {visible.map((source, index) => (
        <span key={source.url} className="inline-flex items-center">
          {index > 0 ? (
            <span className="mx-1 opacity-40" aria-hidden>
              ·
            </span>
          ) : null}
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            title={source.title}
            className="max-w-[9rem] truncate text-primary/80 underline-offset-2 hover:text-primary hover:underline"
          >
            {sourceLabel(source)}
          </a>
        </span>
      ))}
      {hiddenCount > 0 ? (
        <span className="opacity-60">+{hiddenCount}</span>
      ) : null}
    </div>
  );
}