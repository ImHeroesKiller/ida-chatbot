"use client";

import {
  ExternalLink,
  FileText,
  GitBranch,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import type {
  IdaWorkflowResultCard,
  IdaWorksheetResultCard,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface ChatToolResultCardProps {
  locale: Locale;
  workflowResult?: IdaWorkflowResultCard;
  worksheetResult?: IdaWorksheetResultCard;
  onOpenWorkflow?: () => void;
  onOpenWorksheet?: () => void;
  className?: string;
}

export function ChatToolResultCard({
  locale,
  workflowResult,
  worksheetResult,
  onOpenWorkflow,
  onOpenWorksheet,
  className,
}: ChatToolResultCardProps) {
  const copy = COPY[locale];

  if (workflowResult) {
    const isDiscovery = workflowResult.status === "discovery";
    const modeLabel =
      workflowResult.mode === "edited"
        ? copy.workflowResultEdited
        : copy.workflowResultCreated;

    const openLabel = `${copy.workflowResultOpenCanvas}: ${workflowResult.name}`;

    if (isDiscovery) {
      return (
        <div
          role="article"
          className={cn(
            "w-full rounded-xl border bg-card/80 p-3 text-left shadow-sm",
            className,
          )}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {copy.workflowResultDiscovery}
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                {workflowResult.name}
              </p>
              {workflowResult.description ? (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {workflowResult.description}
                </p>
              ) : null}
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                {copy.workflowResultDiscoveryHint}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={onOpenWorkflow}
        disabled={!onOpenWorkflow}
        aria-label={openLabel}
        className={cn(
          "w-full rounded-xl border bg-card/80 p-3 text-left shadow-sm transition-colors",
          onOpenWorkflow
            ? "cursor-pointer hover:border-primary/40 hover:bg-muted/30 active:bg-muted/40"
            : "cursor-default",
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              isDiscovery
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                : "bg-primary/10 text-primary",
            )}
          >
            {isDiscovery ? (
              <Sparkles className="h-4 w-4" aria-hidden />
            ) : (
              <GitBranch className="h-4 w-4" aria-hidden />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {isDiscovery
                ? copy.workflowResultDiscovery
                : copy.workflowResultTitle}
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
              {workflowResult.name}
            </p>
            {workflowResult.description ? (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {workflowResult.description}
              </p>
            ) : null}
            {!isDiscovery ? (
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                {modeLabel} · {workflowResult.nodeCount}{" "}
                {copy.workflowResultNodes} · {workflowResult.edgeCount}{" "}
                {copy.workflowResultEdges}
              </p>
            ) : (
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                {copy.workflowResultDiscoveryHint}
              </p>
            )}
          </div>
          {!isDiscovery && onOpenWorkflow ? (
            <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
          ) : null}
        </div>
        {!isDiscovery && onOpenWorkflow ? (
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              size="xs"
              variant="secondary"
              className="h-7 text-[10px]"
              onClick={(event) => {
                event.stopPropagation();
                onOpenWorkflow();
              }}
            >
              {copy.workflowResultOpenCanvas}
            </Button>
          </div>
        ) : null}
      </button>
    );
  }

  if (worksheetResult) {
    return (
      <button
        type="button"
        onClick={onOpenWorksheet}
        disabled={!onOpenWorksheet}
        aria-label={`${copy.worksheetResultOpenPanel}: ${worksheetResult.title}`}
        className={cn(
          "w-full rounded-xl border bg-card/80 p-3 text-left shadow-sm transition-colors",
          onOpenWorksheet
            ? "cursor-pointer hover:border-primary/40 hover:bg-muted/30 active:bg-muted/40"
            : "cursor-default",
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            <FileText className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.worksheetResultTitle}
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
              {worksheetResult.title}
            </p>
            {worksheetResult.summary ? (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {worksheetResult.summary}
              </p>
            ) : null}
          </div>
          {onOpenWorksheet ? (
            <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
          ) : null}
        </div>
        {onOpenWorksheet ? (
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              size="xs"
              variant="secondary"
              className="h-7 text-[10px]"
              onClick={(event) => {
                event.stopPropagation();
                onOpenWorksheet();
              }}
            >
              {copy.worksheetResultOpenPanel}
            </Button>
          </div>
        ) : null}
      </button>
    );
  }

  return null;
}