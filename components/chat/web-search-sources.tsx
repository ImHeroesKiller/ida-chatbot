"use client";

import { ExternalLink, Search } from "lucide-react";

import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import type { IdaWebSearchSource } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WebSearchSourcesProps {
  sources: IdaWebSearchSource[];
  locale: Locale;
  className?: string;
  /** When provided, clicking a source "card" opens the web-search tool modal (card-driven, not from toggle). External link still works via icon or stopProp. */
  onOpenPanel?: () => void;
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
  onOpenPanel,
}: WebSearchSourcesProps) {
  const copy = COPY[locale];

  if (!sources.length) return null;

  const visible = sources.slice(0, 3);
  const hiddenCount = Math.max(0, sources.length - visible.length);

  return (
    <div
      className={cn(
        "mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 px-0.5 text-[10px] text-muted-foreground/80",
        className,
      )}
    >
      <span className="shrink-0 font-medium">{copy.webSearchSources}:</span>
      {visible.map((source, index) => {
        const host = sourceLabel(source);
        const handleCardClick = (e: React.MouseEvent) => {
          // Clicking the card area (not the external link) opens the web search modal to see full results.
          if (onOpenPanel) {
            e.preventDefault();
            onOpenPanel();
          }
        };
        return (
          <span
            key={source.url}
            role={onOpenPanel ? "button" : undefined}
            tabIndex={onOpenPanel ? 0 : undefined}
            onClick={onOpenPanel ? handleCardClick : undefined}
            onKeyDown={
              onOpenPanel
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onOpenPanel();
                    }
                  }
                : undefined
            }
            className={cn(
              "group inline-flex items-center rounded border border-transparent px-1 py-0.5 transition",
              onOpenPanel && "cursor-pointer hover:border-primary/30 hover:bg-primary/5 active:bg-primary/10",
            )}
            title={onOpenPanel ? `Lihat di Web Search tool: ${source.title}` : source.title}
          >
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
              onClick={(e) => e.stopPropagation()}
              className="max-w-[9rem] truncate text-primary/80 underline-offset-2 hover:text-primary hover:underline"
            >
              {host}
            </a>
            {onOpenPanel ? (
              <Search
                className="ml-1 h-3 w-3 text-primary/60 opacity-70 transition group-hover:opacity-100"
                aria-hidden
              />
            ) : (
              <ExternalLink className="ml-1 h-3 w-3 text-primary/50 opacity-60" aria-hidden />
            )}
          </span>
        );
      })}
      {hiddenCount > 0 ? (
        <span className="opacity-60">+{hiddenCount}</span>
      ) : null}
      {onOpenPanel ? (
        <span className="ml-1 text-[9px] text-primary/70">(klik card buka panel)</span>
      ) : null}
    </div>
  );
}