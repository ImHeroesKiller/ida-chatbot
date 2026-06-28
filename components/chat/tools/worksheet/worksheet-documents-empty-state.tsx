"use client";

import {
  FileText,
  LayoutTemplate,
  MessageSquarePlus,
  RotateCcw,
  SearchX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface WorksheetDocumentsEmptyStateProps {
  locale: Locale;
  variant: "no-documents" | "no-results";
  onCreateFirstDocument?: () => void;
  onApplyTemplate?: () => void;
  onResetFilters?: () => void;
  className?: string;
}

export function WorksheetDocumentsEmptyState({
  locale,
  variant,
  onCreateFirstDocument,
  onApplyTemplate,
  onResetFilters,
  className,
}: WorksheetDocumentsEmptyStateProps) {
  const copy = COPY[locale];
  const steps = copy.worksheetEmptySteps
    .split("\n")
    .map((step) => step.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 3);

  if (variant === "no-results") {
    return (
      <div
        className={cn(
          "flex min-h-[11rem] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/15 px-4 py-8 text-center sm:min-h-[12rem] sm:px-6",
          className,
        )}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border/70 bg-background shadow-sm">
          <SearchX className="h-5 w-5 text-muted-foreground" aria-hidden />
        </div>
        <p className="max-w-sm text-sm font-semibold tracking-tight text-foreground">
          {copy.worksheetDocumentsNoResults}
        </p>
        <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
          {copy.worksheetDocumentsNoResultsHint}
        </p>
        {onResetFilters ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-5 h-9 gap-1.5 text-xs"
            onClick={onResetFilters}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            {copy.worksheetDocumentsResetFilters}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm",
        className,
      )}
    >
      <div className="border-b border-border/60 bg-muted/20 px-4 py-6 text-center sm:px-6 sm:py-7">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/70 bg-background shadow-sm">
          <FileText
            className="h-7 w-7 text-muted-foreground"
            aria-hidden
          />
        </div>
        <h3 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
          {copy.worksheetEmptyTitle}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {copy.worksheetEmptyHint}
        </p>
      </div>

      <div className="space-y-4 px-4 py-5 sm:px-6">
        <div>
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            {copy.worksheetEmptyStepsTitle}
          </p>
          <ol className="mt-3 space-y-3">
            {steps.map((step, index) => (
              <li
                key={step}
                className="flex items-start gap-3 text-xs leading-relaxed text-foreground/90 sm:text-sm"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/70 bg-muted/30 text-[11px] font-semibold text-foreground/80">
                  {index + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {onCreateFirstDocument ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-10 w-full gap-1.5 text-xs sm:w-auto"
              onClick={onCreateFirstDocument}
            >
              <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden />
              {copy.worksheetEmptyCreateFirst}
            </Button>
          ) : null}
          {onApplyTemplate ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 w-full gap-1.5 text-xs sm:w-auto"
              onClick={onApplyTemplate}
            >
              <LayoutTemplate className="h-3.5 w-3.5" aria-hidden />
              {copy.worksheetEmptyUseTemplate}
            </Button>
          ) : null}
        </div>

        <p className="rounded-xl border border-dashed border-border/70 bg-muted/15 px-3.5 py-2.5 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
          {copy.worksheetEmptyEditHint}
        </p>
      </div>
    </div>
  );
}