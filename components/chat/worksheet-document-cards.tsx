"use client";

import { FileText, Layers, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import type { WorksheetDocument } from "@/lib/worksheet";
import {
  formatWorksheetDocumentDate,
  type WorksheetSavedDocument,
  worksheetStatusLabel,
} from "@/lib/worksheet-workspace";
import { cn } from "@/lib/utils";

interface WorksheetDocumentCardsProps {
  locale: Locale;
  workspace: WorksheetDocument;
  onSelectDocument: (documentId: string) => void;
  onDeleteDocument?: (documentId: string) => void;
  className?: string;
}

function statusClass(status: WorksheetSavedDocument["status"]): string {
  switch (status) {
    case "exported":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "edited":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    default:
      return "border-primary/20 bg-primary/10 text-primary";
  }
}

export function WorksheetDocumentCards({
  locale,
  workspace,
  onSelectDocument,
  onDeleteDocument,
  className,
}: WorksheetDocumentCardsProps) {
  const copy = COPY[locale];
  const documents = workspace.documents ?? [];
  const total = documents.length;

  if (total === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          {copy.worksheetDocumentsTitle}
        </p>
        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">
          <Layers className="h-3 w-3" />
          {total}
        </span>
      </div>

      <ul className="space-y-2">
        {documents.map((document) => (
          <li key={document.id}>
            <div
              className={cn(
                "flex items-stretch gap-1 rounded-xl border bg-card shadow-sm transition-colors",
                "hover:border-primary/30",
                workspace.activeDocumentId === document.id &&
                  "border-primary/40 ring-1 ring-primary/20",
              )}
            >
              <button
                type="button"
                onClick={() => onSelectDocument(document.id)}
                className="min-w-0 flex-1 rounded-l-xl p-3 text-left transition-colors hover:bg-primary/5"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold">
                        {document.title}
                      </p>
                      <span
                        className={cn(
                          "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                          statusClass(document.status),
                        )}
                      >
                        {worksheetStatusLabel(document.status, locale)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                      {document.promptSummary || copy.worksheetDocumentsNoSummary}
                    </p>
                    <p className="mt-2 text-[10px] text-muted-foreground/80">
                      {formatWorksheetDocumentDate(document.createdAt, locale)}
                    </p>
                  </div>
                </div>
              </button>
              {onDeleteDocument ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="my-2 mr-2 h-8 w-8 shrink-0 self-center text-muted-foreground hover:text-destructive"
                  aria-label={copy.worksheetDeleteDocument}
                  title={copy.worksheetDeleteDocument}
                  onClick={() => onDeleteDocument(document.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}