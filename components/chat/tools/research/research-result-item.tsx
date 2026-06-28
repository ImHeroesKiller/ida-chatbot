"use client";

import { ExternalLink } from "lucide-react";

import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import type { ResearchSource } from "@/lib/research-types";
import { cn } from "@/lib/utils";

interface ResearchResultItemProps {
  locale: Locale;
  result: ResearchSource;
  index: number;
  className?: string;
}

function sourceHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function ResearchResultItem({
  locale,
  result,
  index,
  className,
}: ResearchResultItemProps) {
  const copy = COPY[locale];
  const host = sourceHostname(result.url);

  return (
    <article
      className={cn(
        "rounded-xl border bg-card p-3.5 shadow-sm transition-colors hover:border-primary/20",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex max-w-full items-start gap-1.5 text-sm font-semibold leading-snug text-foreground hover:text-primary"
          >
            <span className="line-clamp-2">{result.title || host}</span>
            <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
          </a>
          <p className="text-[10px] font-medium text-muted-foreground">{host}</p>
          {result.query ? (
            <p className="text-[10px] text-muted-foreground/80">
              {copy.researchPanelQueryLabel.replace("{query}", result.query)}
            </p>
          ) : null}
          {result.snippet ? (
            <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
              {result.snippet}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}