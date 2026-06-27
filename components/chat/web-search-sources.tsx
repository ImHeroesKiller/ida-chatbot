"use client";

import { ChevronDown, ExternalLink } from "lucide-react";
import { useState } from "react";

import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import type { IdaWebSearchSource } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WebSearchSourcesProps {
  sources: IdaWebSearchSource[];
  locale: Locale;
  className?: string;
}

export function WebSearchSources({
  sources,
  locale,
  className,
}: WebSearchSourcesProps) {
  const copy = COPY[locale];
  const [expanded, setExpanded] = useState(false);

  if (!sources.length) return null;

  return (
    <div className={cn("w-full", className)}>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted/50"
        aria-expanded={expanded}
      >
        <ExternalLink className="size-3.5 shrink-0" />
        <span className="flex-1 font-medium text-foreground/80">
          {copy.webSearchSources} ({sources.length})
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded && (
        <ul className="mt-2 space-y-2 rounded-lg border border-border/60 bg-muted/20 p-2.5">
          {sources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/source block rounded-md px-2 py-1.5 transition-colors hover:bg-muted/60"
              >
                <p className="text-xs font-medium text-primary group-hover/source:underline">
                  {source.title}
                </p>
                {source.snippet ? (
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                    {source.snippet}
                  </p>
                ) : null}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}