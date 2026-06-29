"use client";

import { RESEARCH_DEPTH_CONFIG } from "@/lib/research-format";
import type { ResearchDepth } from "@/lib/research-types";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const DEPTH_OPTIONS: ResearchDepth[] = ["quick", "standard", "deep"];

interface ResearchDepthSelectorProps {
  locale: Locale;
  value: ResearchDepth;
  disabled?: boolean;
  onChange: (depth: ResearchDepth) => void;
  className?: string;
}

export function ResearchDepthSelector({
  locale,
  value,
  disabled = false,
  onChange,
  className,
}: ResearchDepthSelectorProps) {
  const copy = COPY[locale];

  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-[10px] font-medium text-muted-foreground">
        {copy.researchPanelDepthLabel}
      </p>
      <div className="grid grid-cols-1 gap-1.5">
        {DEPTH_OPTIONS.map((option) => {
          const config = RESEARCH_DEPTH_CONFIG[option];
          const selected = value === option;

          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option)}
              className={cn(
                "rounded-lg border px-2.5 py-2 text-left transition-colors",
                selected
                  ? "border-primary/40 bg-primary/10 ring-1 ring-primary/20"
                  : "border-border bg-background hover:bg-muted/40",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold">
                  {copy.researchPanelDepth[option]}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  ~{config.estimatedSeconds}s
                </span>
              </div>
              <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                {copy.researchPanelDepthHint[option]
                  .replace("{queries}", String(config.queryCount))
                  .replace("{sources}", String(config.queryCount * config.resultsPerQuery))}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}