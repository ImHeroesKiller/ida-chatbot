"use client";

import {
  buildExecutiveSummary,
  groupSourcesByQuery,
} from "@/lib/research-format";
import type { ResearchResult } from "@/components/chat/tools/research/use-research";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ResearchSummaryViewProps {
  locale: Locale;
  result: ResearchResult;
  className?: string;
}

export function ResearchSummaryView({
  locale,
  result,
  className,
}: ResearchSummaryViewProps) {
  const copy = COPY[locale];
  const executive =
    buildExecutiveSummary(result.topic, result.sources) ||
    result.summary.split("\n").find((line) => line.trim().length > 12) ||
    "";

  const grouped = groupSourcesByQuery(result.sources, result.topic);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary capitalize">
          {copy.researchPanelDepth[result.depth]}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {copy.researchPanelSourceCount.replace(
            "{count}",
            String(result.sources.length),
          )}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {copy.researchPanelQueriesUsed.replace(
            "{count}",
            String(result.queries.length),
          )}
        </span>
      </div>

      {executive ? (
        <div className="rounded-lg bg-muted/25 px-3 py-2.5">
          <p className="mb-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            {copy.researchPanelExecutiveSummary}
          </p>
          <p className="text-xs leading-relaxed text-foreground/90">
            {executive}
          </p>
        </div>
      ) : null}

      {grouped.size > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            {copy.researchPanelKeyFindings}
          </p>
          {[...grouped.entries()].slice(0, 4).map(([query, sources]) => (
            <div
              key={query}
              className="rounded-lg border border-border/60 bg-background/60 px-2.5 py-2"
            >
              <p className="mb-1 text-[10px] font-semibold text-foreground/80">
                {query}
              </p>
              <ul className="space-y-1">
                {sources.slice(0, 2).map((source) => (
                  <li
                    key={source.url}
                    className="text-[11px] leading-relaxed text-muted-foreground"
                  >
                    <span className="font-medium text-foreground/85">
                      {source.title}
                    </span>
                    {source.snippet ? ` — ${source.snippet.slice(0, 120)}…` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}