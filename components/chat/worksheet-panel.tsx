"use client";

import {
  AlertCircle,
  Copy,
  Download,
  FileText,
  History,
  LayoutTemplate,
  Link2,
  Loader2,
  Palette,
  PanelRightClose,
  Pencil,
  Printer,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { MarkdownContent } from "@/components/chat/markdown-content";
import { WorksheetBrandingDialog } from "@/components/chat/worksheet-branding-dialog";
import {
  WorksheetSplitEditor,
  type WorksheetEditLayout,
} from "@/components/chat/worksheet-split-editor";
import {
  WorksheetExportPdfDialog,
  type WorksheetPdfExportSettings,
} from "@/components/chat/worksheet-export-pdf-dialog";
import { WorksheetPrintPreviewDialog } from "@/components/chat/worksheet-print-preview-dialog";
import { WorksheetTemplateDialog } from "@/components/chat/worksheet-template-dialog";
import { WorksheetVersionHistoryDialog } from "@/components/chat/worksheet-version-history-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { exportWorksheetToPdf } from "@/lib/pdf-export";
import { useWorksheetBrandingPrefs } from "@/lib/worksheet-branding-prefs";
import {
  copyTextToClipboard,
  createWorksheetShare,
} from "@/lib/worksheet-share";
import {
  sanitizeWorksheetFilename,
  type WorksheetErrorCode,
  type WorksheetVersion,
} from "@/lib/worksheet";
import type { WorksheetTemplate } from "@/lib/worksheet-templates";
import { cn } from "@/lib/utils";

interface WorksheetPanelProps {
  locale: Locale;
  title: string;
  content: string;
  error?: WorksheetErrorCode | null;
  isGenerating?: boolean;
  canRegenerate?: boolean;
  onTitleChange: (title: string) => void;
  onContentSave?: (content: string) => void;
  versions?: WorksheetVersion[];
  onRestoreVersion?: (versionId: string) => void;
  onApplyTemplate?: (template: WorksheetTemplate) => void;
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
  onContentSave,
  versions = [],
  onRestoreVersion,
  onApplyTemplate,
  onRetry,
  onRegenerate,
  onClear,
  onClose,
  className,
  embedded = false,
}: WorksheetPanelProps) {
  const copy = COPY[locale];
  const { prefs: brandingPrefs } = useWorksheetBrandingPrefs();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editLayout, setEditLayout] = useState<WorksheetEditLayout>("visual");
  const [draftContent, setDraftContent] = useState(content);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [exportPdfDialogOpen, setExportPdfDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [brandingDialogOpen, setBrandingDialogOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const pendingTemplateEditRef = useRef(false);

  const hasContent = Boolean(content.trim());
  const hasUnsavedChanges = isEditing && draftContent !== content;

  useEffect(() => {
    if (!embedded) return;
    panelRef.current?.focus({ preventScroll: true });
  }, [embedded]);

  useEffect(() => {
    if (!isEditing) {
      setDraftContent(content);
    }
  }, [content, isEditing]);

  useEffect(() => {
    if (!pendingTemplateEditRef.current || !content.trim() || isGenerating) {
      return;
    }

    pendingTemplateEditRef.current = false;
    setDraftContent(content);
    setIsEditing(true);
  }, [content, isGenerating]);

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

  const actionButtonClass = cn(
    "gap-1.5 text-xs",
    embedded ? "h-10 min-h-10" : "h-9",
  );

  const handleCopy = useCallback(async () => {
    if (!hasContent || isEditing) return;

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success(copy.worksheetCopied);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(copy.errors.generic);
    }
  }, [content, copy.errors.generic, copy.worksheetCopied, hasContent, isEditing]);

  const handleDownload = useCallback(() => {
    if (!hasContent || isEditing) return;

    const filename = `${sanitizeWorksheetFilename(title)}.md`;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success(copy.worksheetDownloaded);
  }, [content, copy.worksheetDownloaded, hasContent, isEditing, title]);

  const handleOpenExportPdfDialog = useCallback(() => {
    if (!hasContent || isEditing || isExportingPdf) return;
    setExportPdfDialogOpen(true);
  }, [hasContent, isEditing, isExportingPdf]);

  const handleExportPdfConfirm = useCallback(
    async (settings: WorksheetPdfExportSettings) => {
      if (!hasContent || isEditing || isExportingPdf) return;

      setIsExportingPdf(true);
      try {
        await exportWorksheetToPdf({
          title,
          content,
          paper: settings.paper,
          orientation: settings.orientation,
          branding: {
            enabled: settings.includeBranding,
            brandName: brandingPrefs.brandName,
            footerText: brandingPrefs.footerText,
            logoDataUrl: brandingPrefs.logoDataUrl,
            showPageNumbers: settings.showPageNumbers,
            showExportDate: settings.showExportDate,
            locale,
          },
        });
        toast.success(copy.worksheetExportPdfSuccess);
        setExportPdfDialogOpen(false);
      } catch {
        toast.error(copy.worksheetExportPdfError);
      } finally {
        setIsExportingPdf(false);
      }
    },
    [
      content,
      copy.worksheetExportPdfError,
      copy.worksheetExportPdfSuccess,
      hasContent,
      isEditing,
      brandingPrefs.brandName,
      brandingPrefs.footerText,
      brandingPrefs.logoDataUrl,
      isExportingPdf,
      locale,
      title,
    ],
  );

  const handleShare = useCallback(async () => {
    if (!hasContent || isEditing || isSharing) return;

    setIsSharing(true);
    try {
      const share = await createWorksheetShare({ title, content, locale });
      await copyTextToClipboard(share.url);
      toast.success(copy.worksheetShareCopied);
    } catch (error) {
      const message =
        error instanceof Error &&
        error.message.toLowerCase().includes("rate limit")
          ? copy.errors.rateLimit
          : copy.worksheetShareError;
      toast.error(message);
    } finally {
      setIsSharing(false);
    }
  }, [
    content,
    copy.errors.rateLimit,
    copy.worksheetShareCopied,
    copy.worksheetShareError,
    hasContent,
    isEditing,
    isSharing,
    locale,
    title,
  ]);

  const handleStartEdit = useCallback(() => {
    if (!hasContent || isGenerating) return;
    setDraftContent(content);
    setIsEditing(true);
  }, [content, hasContent, isGenerating]);

  const handleCancelEdit = useCallback(() => {
    if (hasUnsavedChanges && !window.confirm(copy.worksheetDiscardChanges)) {
      return;
    }
    setDraftContent(content);
    setIsEditing(false);
  }, [content, copy.worksheetDiscardChanges, hasUnsavedChanges]);

  const handleSaveEdit = useCallback(() => {
    const trimmed = draftContent.trim();
    if (!trimmed) {
      toast.error(copy.worksheetErrorEmptyDocument);
      return;
    }

    onContentSave?.(draftContent);
    setIsEditing(false);
    toast.success(copy.worksheetSaved);
  }, [
    copy.worksheetErrorEmptyDocument,
    copy.worksheetSaved,
    draftContent,
    onContentSave,
  ]);

  const handleSelectTemplate = useCallback(
    (template: WorksheetTemplate) => {
      if (hasContent && !window.confirm(copy.worksheetTemplateOverwriteConfirm)) {
        return;
      }

      pendingTemplateEditRef.current = true;
      onApplyTemplate?.(template);
      setTemplateDialogOpen(false);
    },
    [copy.worksheetTemplateOverwriteConfirm, hasContent, onApplyTemplate],
  );

  const handleClear = useCallback(() => {
    if (isEditing) return;
    if (!hasContent && !error) return;
    if (!window.confirm(copy.worksheetClearConfirm)) return;
    onClear?.();
  }, [copy.worksheetClearConfirm, error, hasContent, isEditing, onClear]);

  const handleClose = useCallback(() => {
    if (isEditing && hasUnsavedChanges) {
      if (!window.confirm(copy.worksheetDiscardChanges)) return;
      setDraftContent(content);
      setIsEditing(false);
    }
    onClose();
  }, [
    content,
    copy.worksheetDiscardChanges,
    hasUnsavedChanges,
    isEditing,
    onClose,
  ]);

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
        {hasUnsavedChanges ? (
          <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
            {copy.worksheetUnsavedChanges}
          </span>
        ) : null}
        {!isEditing ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setBrandingDialogOpen(true)}
            aria-label={copy.worksheetBranding}
            title={copy.worksheetBranding}
            className="h-8 w-8 shrink-0"
          >
            <Palette className="h-4 w-4" />
          </Button>
        ) : null}
        {versions.length > 0 && !isEditing ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setHistoryDialogOpen(true)}
            aria-label={copy.worksheetHistory}
            title={copy.worksheetHistory}
            className="h-8 w-8 shrink-0"
          >
            <History className="h-4 w-4" />
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleClose}
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
          disabled={isGenerating || isEditing}
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
          ) : isEditing ? (
            <WorksheetSplitEditor
              locale={locale}
              value={draftContent}
              onChange={setDraftContent}
              layout={editLayout}
              onLayoutChange={setEditLayout}
              embedded={embedded}
            />
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
              <p className="mt-4 max-w-xs text-left text-[11px] leading-relaxed text-muted-foreground/90">
                {copy.worksheetEmptyEditHint}
              </p>
              {onApplyTemplate ? (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="mt-5 h-10 gap-1.5 px-4 text-xs"
                  onClick={() => setTemplateDialogOpen(true)}
                >
                  <LayoutTemplate className="h-3.5 w-3.5" />
                  {copy.worksheetTemplates}
                </Button>
              ) : null}
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
        {isEditing ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              className={cn("flex-1", actionButtonClass)}
              onClick={handleSaveEdit}
            >
              <Save className="h-3.5 w-3.5" />
              {copy.worksheetSave}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn("flex-1", actionButtonClass)}
              onClick={handleCancelEdit}
            >
              <X className="h-3.5 w-3.5" />
              {copy.worksheetCancel}
            </Button>
          </div>
        ) : (
          <>
            {(canRegenerate || onClear) && !isGenerating ? (
              <div className="flex gap-2">
                {canRegenerate && onRegenerate ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn("flex-1", embedded ? "h-10 min-h-10" : "h-8")}
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
              {onApplyTemplate ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn("flex-1", actionButtonClass)}
                  disabled={isGenerating || isEditing}
                  onClick={() => setTemplateDialogOpen(true)}
                >
                  <LayoutTemplate className="h-3.5 w-3.5" />
                  {copy.worksheetTemplates}
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn("flex-1", actionButtonClass)}
                disabled={!hasContent || isGenerating}
                onClick={handleStartEdit}
              >
                <Pencil className="h-3.5 w-3.5" />
                {copy.worksheetEdit}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn("flex-1", actionButtonClass)}
                disabled={!hasContent || isGenerating}
                onClick={() => void handleCopy()}
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? copy.worksheetCopied : copy.worksheetCopy}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn("flex-1", actionButtonClass)}
                disabled={!hasContent || isGenerating}
                onClick={handleDownload}
              >
                <Download className="h-3.5 w-3.5" />
                {copy.worksheetDownload}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn("flex-1", actionButtonClass)}
                disabled={!hasContent || isGenerating}
                onClick={() => setPrintPreviewOpen(true)}
              >
                <Printer className="h-3.5 w-3.5" />
                {copy.worksheetPrintPreview}
              </Button>
            </div>

            <div className="flex gap-2">
              {versions.length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn("flex-1", actionButtonClass)}
                  disabled={isGenerating}
                  onClick={() => setHistoryDialogOpen(true)}
                >
                  <History className="h-3.5 w-3.5" />
                  {copy.worksheetHistory}
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn("flex-1", actionButtonClass)}
                disabled={!hasContent || isGenerating || isSharing}
                onClick={() => void handleShare()}
              >
                {isSharing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Link2 className="h-3.5 w-3.5" />
                )}
                {copy.worksheetShare}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn("flex-1", actionButtonClass)}
                disabled={!hasContent || isGenerating || isExportingPdf}
                onClick={handleOpenExportPdfDialog}
              >
                {isExportingPdf ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}
                {copy.worksheetExportPdf}
              </Button>
            </div>
          </>
        )}
      </div>

      <WorksheetExportPdfDialog
        open={exportPdfDialogOpen}
        locale={locale}
        isExporting={isExportingPdf}
        onConfirm={(settings) => void handleExportPdfConfirm(settings)}
        onCancel={() => {
          if (!isExportingPdf) setExportPdfDialogOpen(false);
        }}
      />

      <WorksheetPrintPreviewDialog
        open={printPreviewOpen}
        locale={locale}
        title={title}
        content={content}
        onClose={() => setPrintPreviewOpen(false)}
      />

      <WorksheetTemplateDialog
        open={templateDialogOpen}
        locale={locale}
        onSelect={handleSelectTemplate}
        onClose={() => setTemplateDialogOpen(false)}
      />

      <WorksheetVersionHistoryDialog
        open={historyDialogOpen}
        locale={locale}
        versions={versions}
        onRestore={(versionId) => {
          onRestoreVersion?.(versionId);
          setHistoryDialogOpen(false);
        }}
        onClose={() => setHistoryDialogOpen(false)}
      />

      <WorksheetBrandingDialog
        open={brandingDialogOpen}
        locale={locale}
        onClose={() => setBrandingDialogOpen(false)}
      />
    </aside>
  );
}