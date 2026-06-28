"use client";

import { FileText, LayoutTemplate, SearchX, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface WorksheetDocumentsEmptyStateProps {
  locale: Locale;
  variant: "no-documents" | "no-results";
  onApplyTemplate?: () => void;
  className?: string;
}

export function WorksheetDocumentsEmptyState({
  locale,
  variant,
  onApplyTemplate,
  className,
}: WorksheetDocumentsEmptyStateProps) {
  const copy = COPY[locale];

  if (variant === "no-results") {
    return (
      <div
        className={cn(
          "flex min-h-[12rem] flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-4 py-8 text-center",
          className,
        )}
      >
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border bg-background shadow-sm">
          <SearchX className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground/90">
          {copy.worksheetDocumentsNoResults}
        </p>
        <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
          {copy.worksheetDocumentsNoResultsHint}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-gradient-to-b from-primary/5 via-card to-card shadow-sm",
        className,
      )}
    >
      <div className="border-b bg-primary/5 px-4 py-5 text-center sm:px-6">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/15 bg-background shadow-sm">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm font-semibold text-foreground/90">
          {copy.worksheetEmptyTitle}
        </p>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
          {copy.worksheetEmptyHint}
        </p>
      </div>

      <div className="space-y-3 px-4 py-4 sm:px-6">
        <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          {copy.worksheetEmptyStepsTitle}
        </p>
        <ol className="space-y-2.5">
          {copy.worksheetEmptySteps.split("\n").map((step, index) => (
            <li
              key={step}
              className="flex items-start gap-2.5 text-xs leading-relaxed text-foreground/85"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border bg-muted/40 text-[10px] font-semibold text-primary">
                {index + 1}
              </span>
              <span>{step.replace(/^\d+\.\s*/, "")}</span>
            </li>
          ))}
        </ol>
        <p className="rounded-lg border border-dashed bg-muted/20 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          <FileText className="mr-1.5 inline h-3.5 w-3.5 align-[-2px] text-primary/80" />
          {copy.worksheetEmptyEditHint}
        </p>
        {onApplyTemplate ? (
          <Button
            type="button"
            variant="default"
            size="sm"
            className="h-10 w-full gap-1.5 text-xs sm:w-auto"
            onClick={onApplyTemplate}
          >
            <LayoutTemplate className="h-3.5 w-3.5" />
            {copy.worksheetTemplates}
          </Button>
        ) : null}
      </div>
    </div>
  );
}