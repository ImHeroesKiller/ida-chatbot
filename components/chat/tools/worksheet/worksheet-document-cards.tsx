"use client";

import {
  Download,
  FileText,
  FileType,
  Layers,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react";
import { memo, useCallback, useRef } from "react";

import { WorksheetGeneratingIndicator } from "@/components/chat/tools/worksheet/worksheet-generating-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import {
  countWorksheetWords,
  formatWorksheetDocumentDate,
  formatWorksheetWordCount,
  summarizeWorksheetPrompt,
  type WorksheetSavedDocument,
  worksheetStatusLabel,
} from "@/lib/worksheet-workspace";
import { cn } from "@/lib/utils";

/** Threshold for a future virtualized list implementation. */
export const WORKSHEET_CARDS_VIRTUALIZATION_THRESHOLD = 40;

interface WorksheetDocumentCardsProps {
  locale: Locale;
  documents: WorksheetSavedDocument[];
  totalCount: number;
  activeDocumentId?: string | null;
  isGenerating?: boolean;
  onSelectDocument: (documentId: string) => void;
  onDeleteDocument?: (documentId: string) => void;
  className?: string;
}

interface WorksheetDocumentCardProps {
  locale: Locale;
  document: WorksheetSavedDocument;
  isActive: boolean;
  noSummaryLabel: string;
  onSelectDocument: (documentId: string) => void;
  onDeleteDocument?: (documentId: string) => void;
}

const StatusBadge = memo(function StatusBadge({
  document,
  locale,
}: {
  document: WorksheetSavedDocument;
  locale: Locale;
}) {
  const label = worksheetStatusLabel(document.status, locale);

  const config = {
    generated: {
      icon: Sparkles,
      className:
        "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    },
    edited: {
      icon: Pencil,
      className:
        "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    },
    exported: {
      icon: Download,
      className:
        "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    },
  } as const;

  const { icon: Icon, className } = config[document.status];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
});

const ExportFormatBadges = memo(function ExportFormatBadges({
  document,
  locale,
}: {
  document: WorksheetSavedDocument;
  locale: Locale;
}) {
  const copy = COPY[locale];
  const formats =
    document.exportedFormats ??
    (document.status === "exported" ? (["pdf"] as const) : []);

  if (formats.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="text-[10px] text-muted-foreground/80">
        {copy.worksheetDocumentsExportedLabel}:
      </span>
      {formats.includes("pdf") ? (
        <Badge variant="outline" className="h-5 gap-1 px-1.5 text-[10px]">
          <FileText className="h-3 w-3" />
          {copy.worksheetDocumentsExportedPdf}
        </Badge>
      ) : null}
      {formats.includes("docx") ? (
        <Badge variant="outline" className="h-5 gap-1 px-1.5 text-[10px]">
          <FileType className="h-3 w-3" />
          {copy.worksheetDocumentsExportedDocx}
        </Badge>
      ) : null}
    </div>
  );
});

const WorksheetDocumentCard = memo(function WorksheetDocumentCard({
  locale,
  document,
  isActive,
  noSummaryLabel,
  onSelectDocument,
  onDeleteDocument,
}: WorksheetDocumentCardProps) {
  const copy = COPY[locale];
  const wordCount = countWorksheetWords(document.content);
  const wasEdited = document.updatedAt > document.createdAt + 1000;
  const summary =
    summarizeWorksheetPrompt(document.promptSummary, 80) || noSummaryLabel;

  const handleSelect = useCallback(() => {
    onSelectDocument(document.id);
  }, [document.id, onSelectDocument]);

  const handleDelete = useCallback(() => {
    onDeleteDocument?.(document.id);
  }, [document.id, onDeleteDocument]);

  return (
    <li
      className="[contain-intrinsic-size:0_7.5rem] [content-visibility:auto]"
      data-document-id={document.id}
    >
      <div
        className={cn(
          "group flex items-stretch overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-200",
          "hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md",
          isActive && "border-primary/35 ring-1 ring-primary/15",
        )}
      >
        <button
          type="button"
          onClick={handleSelect}
          className="min-w-0 flex-1 p-3.5 text-left transition-colors group-hover:bg-primary/[0.03] sm:p-4"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br from-primary/10 to-primary/5">
              <FileText className="h-4 w-4 text-primary" />
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-2 text-sm leading-snug font-semibold">
                  {document.title}
                </p>
                <StatusBadge document={document} locale={locale} />
              </div>

              <p className="line-clamp-2 rounded-lg border border-dashed bg-muted/20 px-2.5 py-1.5 text-[11px] leading-relaxed text-muted-foreground">
                {summary}
              </p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground/90">
                <span>{formatWorksheetWordCount(wordCount, locale)}</span>
                <span aria-hidden>·</span>
                <span>
                  {copy.worksheetDocumentsCreated}{" "}
                  {formatWorksheetDocumentDate(document.createdAt, locale, {
                    short: true,
                  })}
                </span>
                {wasEdited ? (
                  <>
                    <span aria-hidden>·</span>
                    <span>
                      {copy.worksheetDocumentsEdited}{" "}
                      {formatWorksheetDocumentDate(document.updatedAt, locale, {
                        short: true,
                      })}
                    </span>
                  </>
                ) : null}
              </div>

              <ExportFormatBadges document={document} locale={locale} />
            </div>
          </div>
        </button>

        {onDeleteDocument ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="my-3 mr-2 h-8 w-8 shrink-0 self-start text-muted-foreground opacity-80 transition-opacity hover:text-destructive group-hover:opacity-100 sm:my-4"
            aria-label={copy.worksheetDeleteDocument}
            title={copy.worksheetDeleteDocument}
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </li>
  );
}, areWorksheetDocumentCardPropsEqual);

function areWorksheetDocumentCardPropsEqual(
  prev: WorksheetDocumentCardProps,
  next: WorksheetDocumentCardProps,
): boolean {
  return (
    prev.document === next.document &&
    prev.isActive === next.isActive &&
    prev.locale === next.locale &&
    prev.noSummaryLabel === next.noSummaryLabel &&
    prev.onSelectDocument === next.onSelectDocument &&
    prev.onDeleteDocument === next.onDeleteDocument
  );
}

export const WorksheetDocumentCards = memo(function WorksheetDocumentCards({
  locale,
  documents,
  totalCount,
  activeDocumentId,
  isGenerating = false,
  onSelectDocument,
  onDeleteDocument,
  className,
}: WorksheetDocumentCardsProps) {
  const copy = COPY[locale];
  const noSummaryLabel = copy.worksheetDocumentsNoSummary;

  const selectRef = useRef(onSelectDocument);
  const deleteRef = useRef(onDeleteDocument);
  selectRef.current = onSelectDocument;
  deleteRef.current = onDeleteDocument;

  const handleSelectDocument = useCallback((documentId: string) => {
    selectRef.current(documentId);
  }, []);

  const handleDeleteDocument = useCallback((documentId: string) => {
    deleteRef.current?.(documentId);
  }, []);

  if (documents.length === 0 && !isGenerating) {
    return null;
  }

  const useVirtualizationHint =
    documents.length >= WORKSHEET_CARDS_VIRTUALIZATION_THRESHOLD;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          {copy.worksheetDocumentsTitle}
        </p>
        <span className="inline-flex items-center gap-1 rounded-full border bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground">
          <Layers className="h-3 w-3" />
          {isGenerating ? totalCount + 1 : totalCount}
        </span>
      </div>

      <ul
        className="space-y-2.5"
        data-virtualization-ready={useVirtualizationHint ? "true" : undefined}
      >
        {isGenerating ? (
          <WorksheetGeneratingIndicator locale={locale} variant="card" />
        ) : null}
        {documents.map((document) => (
          <WorksheetDocumentCard
            key={document.id}
            locale={locale}
            document={document}
            isActive={activeDocumentId === document.id}
            noSummaryLabel={noSummaryLabel}
            onSelectDocument={handleSelectDocument}
            onDeleteDocument={
              onDeleteDocument ? handleDeleteDocument : undefined
            }
          />
        ))}
      </ul>
    </div>
  );
});
