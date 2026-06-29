"use client";

import { Check, Loader2 } from "lucide-react";

import type { ResearchProgressStage } from "@/lib/research-format";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ResearchLoadingIndicatorProps {
  locale: Locale;
  topic: string;
  stage: ResearchProgressStage;
  stageIndex: number;
  totalStages: number;
  className?: string;
}

export function ResearchLoadingIndicator({
  locale,
  topic,
  stage,
  stageIndex,
  totalStages,
  className,
}: ResearchLoadingIndicatorProps) {
  const copy = COPY[locale];
  const progress = Math.min(
    100,
    Math.round(((stageIndex + 1) / totalStages) * 100),
  );

  return (
    <div
      className={cn(
        "flex min-h-[12rem] flex-col gap-4 rounded-xl border border-dashed border-primary/25 bg-primary/[0.04] px-4 py-6",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground/90">
            {copy.researchPanelSearching}
          </p>
          {topic ? (
            <p className="truncate text-xs text-muted-foreground">“{topic}”</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{copy.researchPanelProgressStage[stage]}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ol className="space-y-1.5">
        {(
          Object.keys(copy.researchPanelProgressStage) as ResearchProgressStage[]
        ).map((step, index) => {
          const done = index < stageIndex;
          const active = step === stage;

          return (
            <li
              key={step}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1 text-[11px]",
                active && "bg-primary/10 text-primary",
                done && !active && "text-muted-foreground",
                !done && !active && "text-muted-foreground/60",
              )}
            >
              {done ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
              ) : active ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              ) : (
                <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-muted-foreground/30" />
              )}
              <span>{copy.researchPanelProgressStage[step]}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}