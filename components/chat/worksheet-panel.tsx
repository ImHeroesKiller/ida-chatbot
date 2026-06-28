"use client";

import {
  AlertCircle,
  Copy,
  Download,
  FileText,
  Loader2,
  PanelRightClose,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { MarkdownContent } from "@/components/chat/markdown-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import {
  sanitizeWorksheetFilename,
  type WorksheetErrorCode,
} from "@/lib/worksheet";
import { cn } from "@/lib/utils";

interface WorksheetPanelProps {
  locale: Locale;
  title: string;
  content: string;
  error?: WorksheetErrorCode | null;
  isGenerating?: boolean;
  canRegenerate?: boolean;
  onTitleChange: (title: string) => void;
  onRetry?: () => void;
  onRegenerate?: () => void;
  onClear?: () => void;
  onClose: () => void;
  className?: string;
  embedded?: boolean;
}

export function WorksheetPanel({
  locale,
  title,
  content,
  error = null,
  isGenerating = false,
  canRegenerate = false,
  onTitleChange,
  onRetry,
  onRegenerate,
  onClear,
  onClose,
  className,
  embedded = false,
}: WorksheetPanelProps) {
  const copy = COPY[locale];
  const [copied, setCopied] = useState(false);
  const panelRef = useRef<HTMLElement>(null);

  const hasContent = Boolean(content.trim());

  useEffect(() => {
    if (!embedded) return;
    panelRef.current?.focus({ preventScroll: true });
  }, [embedded]);

  const errorMessage = useMemo(() => {
    if (!error) return null;

    switch (error) {
      case "parse_failed":
        return copy.worksheetErrorParseFailed;
      case "empty_document":
        return copy.worksheetErrorEmptyDocument;
      case "generate_failed":
        return copy.worksheetErrorGenerateFailed;
      default:
        return copy.errors.generic;
    }
  }, [copy, error]);

  const handleCopy = useCallback(async () => {
    if (!hasContent) return;

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success(copy.worksheetCopied);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(copy.errors.generic);
    }
  }, [content, copy.errors.generic, copy.worksheetCopied, hasContent]);

  const handleDownload = useCallback(() => {
    if (!hasContent) return;

    const filename = `${sanitizeWorksheetFilename(title)}.md`;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(copy.worksheetDownloaded);
  }, [content, copy.worksheetDownloaded, hasContent, title]);

  const handleClear = useCallback(() => {
    if (!hasContent && !error) return;
    if (!window.confirm(copy.worksheetClearConfirm)) return;
    onClear?.();
  }, [copy.worksheetClearConfirm, error, hasContent, onClear]);

  return (
    <aside
      ref={panelRef}
      tabIndex={-1}
      className={cn(
        "flex h-full min-h-0 flex-col border-l bg-background outline-none",
        embedded
          ? "w-full"
          : "relative z-10 w-[min(100%,24rem)] shrink-0 bg-muted/10 dark:bg-muted/5",
        className,
      )}
      aria-label={copy.toolsWorksheet}
      role="complementary"
    >
      <div
        className={cn(
          "flex shrink-0 items-center gap-2 border-b",
          embedded ? "px-4 py-3" : "px-3 py-2.5",
        )}
      >
        <FileText className="h-4 w-4 shrink-0 text-primary" />
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">
          {copy.toolsWorksheet}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label={copy.rightSidebarClose}
          title={copy.rightSidebarClose}
          className="h-8 w-8 shrink-0"
        >
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>

      {errorMessage && !isGenerating ? (
        <div className="shrink-0 border-b bg-destructive/5 px-3 py-2.5">
          <div className="flex gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-xs leading-relaxed text-destructive">
                {errorMessage}
              </p>
              {onRetry ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={onRetry}
                >
                  <RefreshCw className="h-3 w-3" />
                  {copy.worksheetRetry}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "shrink-0 space-y-2 border-b",
          embedded ? "px-4 py-3.5" : "px-3 py-3",
        )}
      >
        <label className="text-[11px] font-medium text-muted-foreground">
          {copy.worksheetTitleLabel}
        </label>
        <Input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder={copy.worksheetTitlePlaceholder}
          className="h-9 text-sm"
          disabled={isGenerating}
        />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className={cn(embedded ? "p-4" : "p-3")}>
          {isGenerating ? (
            <div className="flex min-h-[14rem] flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-background/60 px-4 py-10 text-center dark:bg-background/40">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground/90">
                {copy.worksheetGenerating}
              </p>
              <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                {copy.worksheetGeneratingSubtext}
              </p>
            </div>
          ) : hasContent ? (
            <div className="rounded-xl border bg-card p-3 shadow-sm">
              <MarkdownContent
                locale={locale}
                content={content}
                className="chat-text text-sm"
              />
            </div>
          ) : (
            <div className="flex min-h-[14rem] flex-col items-center justify-center rounded-xl border border-dashed bg-background/60 px-4 py-10 text-center dark:bg-background/40">
              <FileText className="mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium text-foreground/90">
                {copy.worksheetEmptyTitle}
              </p>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
                {copy.worksheetEmptyHint}
              </p>
              <pre className="mt-4 max-w-xs whitespace-pre-wrap text-left text-[11px] leading-relaxed text-muted-foreground">
                {copy.worksheetEmptySteps}
              </pre>
            </div>
          )}
        </div>
      </ScrollArea>

      <div
        className={cn(
          "flex shrink-0 flex-col gap-2.5 border-t bg-muted/10 dark:bg-muted/5",
          embedded
            ? "p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
            : "p-3",
        )}
      >
        {(canRegenerate || onClear) && !isGenerating ? (
          <div className="flex gap-2">
            {canRegenerate && onRegenerate ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  "flex-1 gap-1.5 text-xs",
                  embedded ? "h-10 min-h-10" : "h-8",
                )}
                onClick={onRegenerate}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {copy.worksheetRegenerate}
              </Button>
            ) : null}
            {onClear ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  "flex-1 gap-1.5 text-xs text-destructive hover:text-destructive",
                  embedded ? "h-10 min-h-10" : "h-8",
                )}
                disabled={!hasContent && !error}
                onClick={handleClear}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {copy.worksheetClear}
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "flex-1 gap-1.5 text-xs",
              embedded ? "h-10 min-h-10" : "h-9",
            )}
            disabled={!hasContent || isGenerating}
            onClick={() => void handleCopy()}
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? copy.worksheetCopied : copy.worksheetCopy}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "flex-1 gap-1.5 text-xs",
              embedded ? "h-10 min-h-10" : "h-9",
            )}
            disabled={!hasContent || isGenerating}
            onClick={handleDownload}
          >
            <Download className="h-3.5 w-3.5" />
            {copy.worksheetDownload}
          </Button>
        </div>
      </div>
    </aside>
  );
}