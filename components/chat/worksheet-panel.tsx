"use client";

import {
  AlertCircle,
  ArrowLeft,
  BookmarkPlus,
  Check,
  Copy,
  Download,
  FileCode2,
  FileText,
  FileType,
  History,
  LayoutTemplate,
  Link2,
  Loader2,
  Maximize2,
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
import { WorksheetDocumentCards } from "@/components/chat/worksheet-document-cards";
import { WorksheetFullView } from "@/components/chat/worksheet-full-view";
import { WorksheetSaveTemplateDialog } from "@/components/chat/worksheet-save-template-dialog";
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
import {
  WorksheetIconAction,
  WorksheetIconMenu,
  WorksheetOverflowMenu,
  type WorksheetOverflowMenuItem,
} from "@/components/chat/worksheet-panel-actions";
import { WorksheetVersionHistoryDialog } from "@/components/chat/worksheet-version-history-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { exportWorksheetToDocx } from "@/lib/worksheet-docx-export";
import { exportWorksheetToPdf } from "@/lib/pdf-export";
import { useResolvedWorksheetBranding } from "@/lib/worksheet-letterhead-branding";
import {
  findWorksheetVersion,
  recordWorksheetVersion,
  type WorksheetDocument,
  type WorksheetErrorCode,
} from "@/lib/worksheet";
import {
  getActiveWorksheetDocument,
  getWorksheetLetterheadSelection,
  markWorksheetDocumentExported,
  recordWorksheetDocumentVersion,
  setActiveWorksheetDocument,
  setWorksheetLetterheadSelection,
  syncWorkspaceLegacyFields,
  updateWorksheetDocument,
} from "@/lib/worksheet-workspace";
import {
  copyTextToClipboard,
  createWorksheetShare,
} from "@/lib/worksheet-share";
import { sanitizeWorksheetFilename } from "@/lib/worksheet";
import type { WorksheetTemplate } from "@/lib/worksheet-templates";
import { cn } from "@/lib/utils";

interface WorksheetPanelProps {
  locale: Locale;
  workspace: WorksheetDocument;
  onWorkspaceChange: (workspace: WorksheetDocument) => void;
  errorDetail?: string | null;
  isGenerating?: boolean;
  canRegenerate?: boolean;
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
  workspace,
  onWorkspaceChange,
  errorDetail = null,
  isGenerating = false,
  canRegenerate = false,
  onApplyTemplate,
  onRetry,
  onRegenerate,
  onClear,
  onClose,
  className,
  embedded = false,
}: WorksheetPanelProps) {
  const copy = COPY[locale];
  const error = workspace.error ?? null;
  const activeDocument = getActiveWorksheetDocument(workspace);
  const title = activeDocument?.title ?? workspace.title;
  const content = activeDocument?.content ?? workspace.content;
  const versions = activeDocument?.versions ?? workspace.versions ?? [];
  const letterheadSelection = getWorksheetLetterheadSelection(workspace);
  const showEditor = Boolean(workspace.activeDocumentId);
  const documentCount = workspace.documents?.length ?? 0;

  const commitWorkspace = useCallback(
    (next: WorksheetDocument) => {
      onWorkspaceChange(syncWorkspaceLegacyFields(next));
    },
    [onWorkspaceChange],
  );

  const {
    branding: resolvedBranding,
    activeTemplate,
    templates,
    templatesHydrated,
    hydrated: brandingHydrated,
  } = useResolvedWorksheetBranding(letterheadSelection);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editLayout, setEditLayout] = useState<WorksheetEditLayout>("visual");
  const [draftContent, setDraftContent] = useState(content);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [exportPdfDialogOpen, setExportPdfDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [brandingDialogOpen, setBrandingDialogOpen] = useState(false);
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [isFullViewOpen, setIsFullViewOpen] = useState(false);
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

  const markExported = useCallback(() => {
    const documentId = workspace.activeDocumentId;
    if (!documentId) return;
    commitWorkspace(markWorksheetDocumentExported(workspace, documentId));
  }, [commitWorkspace, workspace]);

  const handleDownloadDocx = useCallback(async () => {
    if (!hasContent || isEditing || isExportingDocx) return;

    setIsExportingDocx(true);
    try {
      await exportWorksheetToDocx({
        title,
        content,
        branding: resolvedBranding,
        locale,
        includeBranding: true,
        showExportDate: true,
        showPageNumbers: true,
      });
      markExported();
      toast.success(copy.worksheetExportDocxSuccess);
    } catch {
      toast.error(copy.worksheetExportDocxError);
    } finally {
      setIsExportingDocx(false);
    }
  }, [
    content,
    resolvedBranding,
    copy.worksheetExportDocxError,
    copy.worksheetExportDocxSuccess,
    hasContent,
    isEditing,
    isExportingDocx,
    locale,
    markExported,
    title,
  ]);

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
            ...resolvedBranding,
            enabled: settings.includeBranding,
            showPageNumbers: settings.showPageNumbers,
            showExportDate: settings.showExportDate,
            locale,
          },
        });
        markExported();
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
      markExported,
      resolvedBranding,
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

  const handleTitleChange = useCallback(
    (nextTitle: string) => {
      const documentId = workspace.activeDocumentId;
      if (!documentId) return;
      commitWorkspace(
        updateWorksheetDocument(workspace, documentId, { title: nextTitle }),
      );
    },
    [commitWorkspace, workspace],
  );

  const handleContentSave = useCallback(
    (nextContent: string) => {
      const documentId = workspace.activeDocumentId;
      if (!documentId) return;
      commitWorkspace(
        recordWorksheetDocumentVersion(workspace, documentId, {
          title,
          content: nextContent,
          source: "manual_save",
        }),
      );
    },
    [commitWorkspace, title, workspace],
  );

  const handleContentChange = useCallback(
    (nextContent: string) => {
      const documentId = workspace.activeDocumentId;
      if (!documentId) return;
      commitWorkspace(
        updateWorksheetDocument(workspace, documentId, {
          content: nextContent,
          status: "edited",
        }),
      );
    },
    [commitWorkspace, workspace],
  );

  const handleRestoreVersion = useCallback(
    (versionId: string) => {
      const documentId = workspace.activeDocumentId;
      if (!documentId) return;

      const version = findWorksheetVersion(versions, versionId);
      if (!version) return;

      commitWorkspace(
        recordWorksheetDocumentVersion(workspace, documentId, {
          title: version.title,
          content: version.content,
          source: "restored",
        }),
      );
      toast.success(copy.worksheetHistoryRestoredToast);
    },
    [commitWorkspace, copy.worksheetHistoryRestoredToast, versions, workspace],
  );

  const handleSelectDocument = useCallback(
    (documentId: string) => {
      commitWorkspace(setActiveWorksheetDocument(workspace, documentId));
    },
    [commitWorkspace, workspace],
  );

  const handleBackToDocuments = useCallback(() => {
    commitWorkspace(setActiveWorksheetDocument(workspace, null));
    if (isEditing) {
      setDraftContent(content);
      setIsEditing(false);
    }
    setIsFullViewOpen(false);
  }, [commitWorkspace, content, isEditing, workspace]);

  const handleSaveEdit = useCallback(() => {
    const trimmed = draftContent.trim();
    if (!trimmed) {
      toast.error(copy.worksheetErrorEmptyDocument);
      return;
    }

    handleContentSave(draftContent);
    setIsEditing(false);
    toast.success(copy.worksheetSaved);
  }, [
    copy.worksheetErrorEmptyDocument,
    copy.worksheetSaved,
    draftContent,
    handleContentSave,
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

  const handleFullViewContentChange = useCallback(
    (nextContent: string) => {
      handleContentChange(nextContent);
      handleContentSave(nextContent);
    },
    [handleContentChange, handleContentSave],
  );

  const handleOpenFullView = useCallback(() => {
    if (!hasContent || isGenerating) return;

    if (isEditing) {
      if (hasUnsavedChanges && !window.confirm(copy.worksheetDiscardChanges)) {
        return;
      }
      setDraftContent(content);
      setIsEditing(false);
    }

    setIsFullViewOpen(true);
  }, [
    content,
    copy.worksheetDiscardChanges,
    hasContent,
    hasUnsavedChanges,
    isEditing,
    isGenerating,
  ]);

  const overflowMenuItems = useMemo((): WorksheetOverflowMenuItem[] => {
    const items: WorksheetOverflowMenuItem[] = [];

    items.push({
      id: "share",
      label: copy.worksheetShare,
      icon: isSharing ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Link2 className="h-3.5 w-3.5" />
      ),
      disabled: !hasContent || isGenerating || isEditing || isSharing,
      onClick: () => void handleShare(),
    });

    if (onApplyTemplate) {
      items.push({
        id: "templates",
        label: copy.worksheetTemplates,
        icon: <LayoutTemplate className="h-3.5 w-3.5" />,
        disabled: isGenerating || isEditing,
        onClick: () => setTemplateDialogOpen(true),
      });
    }

    items.push({
      id: "print",
      label: copy.worksheetPrintPreview,
      icon: <Printer className="h-3.5 w-3.5" />,
      disabled: !hasContent || isGenerating,
      onClick: () => setPrintPreviewOpen(true),
    });

    if (versions.length > 0) {
      items.push({
        id: "history",
        label: copy.worksheetHistory,
        icon: <History className="h-3.5 w-3.5" />,
        disabled: isGenerating,
        onClick: () => setHistoryDialogOpen(true),
      });
    }

    if (canRegenerate && onRegenerate) {
      items.push({
        id: "regenerate",
        label: copy.worksheetRegenerate,
        icon: <RefreshCw className="h-3.5 w-3.5" />,
        disabled: isGenerating,
        onClick: onRegenerate,
      });
    }

    if (onClear) {
      items.push({
        id: "clear",
        label: copy.worksheetClear,
        icon: <Trash2 className="h-3.5 w-3.5" />,
        disabled: isGenerating || (!hasContent && !error),
        destructive: true,
        onClick: handleClear,
      });
    }

    return items;
  }, [
    canRegenerate,
    copy.worksheetClear,
    copy.worksheetHistory,
    copy.worksheetPrintPreview,
    copy.worksheetRegenerate,
    copy.worksheetShare,
    copy.worksheetTemplates,
    error,
    handleClear,
    handleShare,
    hasContent,
    isEditing,
    isGenerating,
    isSharing,
    onApplyTemplate,
    onClear,
    onRegenerate,
    versions.length,
  ]);

  const downloadMenuItems = useMemo((): WorksheetOverflowMenuItem[] => {
    const disabled = !hasContent || isGenerating || isEditing;

    return [
      {
        id: "pdf",
        label: copy.worksheetDownloadPdf,
        icon: <FileText className="h-3.5 w-3.5" />,
        disabled: disabled || isExportingPdf,
        onClick: handleOpenExportPdfDialog,
      },
      {
        id: "md",
        label: copy.worksheetDownloadMd,
        icon: <FileCode2 className="h-3.5 w-3.5" />,
        disabled,
        onClick: handleDownload,
      },
      {
        id: "docx",
        label: copy.worksheetDownloadDocx,
        icon: <FileType className="h-3.5 w-3.5" />,
        disabled: disabled || isExportingDocx,
        onClick: () => void handleDownloadDocx(),
      },
    ];
  }, [
    copy.worksheetDownloadDocx,
    copy.worksheetDownloadMd,
    copy.worksheetDownloadPdf,
    handleDownload,
    handleDownloadDocx,
    handleOpenExportPdfDialog,
    hasContent,
    isEditing,
    isExportingDocx,
    isExportingPdf,
    isGenerating,
  ]);

  const renderDocumentActionBar = () => {
    if (isGenerating) return null;

    if (isEditing) {
      return (
        <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-border/60 pt-3">
          <WorksheetIconAction
            label={copy.worksheetSave}
            onClick={handleSaveEdit}
          >
            <Save className="h-4 w-4" />
          </WorksheetIconAction>
          <WorksheetIconAction
            label={copy.worksheetCancel}
            onClick={handleCancelEdit}
          >
            <X className="h-4 w-4" />
          </WorksheetIconAction>
        </div>
      );
    }

    if (!hasContent) return null;

    return (
      <div className="mt-3 flex items-center justify-between gap-1.5 border-t border-border/60 pt-3">
        <WorksheetIconAction
          label={copy.worksheetEdit}
          disabled={!hasContent || isGenerating}
          onClick={handleStartEdit}
        >
          <Pencil className="h-4 w-4" />
        </WorksheetIconAction>
        <WorksheetIconAction
          label={copy.worksheetFullView}
          disabled={!hasContent || isGenerating}
          active={isFullViewOpen}
          onClick={handleOpenFullView}
        >
          <Maximize2 className="h-4 w-4" />
        </WorksheetIconAction>
        <WorksheetIconAction
          label={copied ? copy.worksheetCopied : copy.worksheetCopy}
          disabled={!hasContent || isGenerating}
          active={copied}
          onClick={() => void handleCopy()}
        >
          {copied ? (
            <Check className="h-4 w-4 text-primary" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </WorksheetIconAction>
        <WorksheetIconMenu
          label={copy.worksheetDownloadMenu}
          items={downloadMenuItems}
          disabled={!hasContent || isGenerating}
        >
          {isExportingDocx ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </WorksheetIconMenu>
        <WorksheetOverflowMenu
          label={copy.worksheetMoreActions}
          items={overflowMenuItems}
          disabled={isGenerating}
        />
      </div>
    );
  };

  useEffect(() => {
    if (!hasContent || isGenerating || isEditing || isFullViewOpen) return;

    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return (
        target.isContentEditable ||
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT"
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const shortcut =
        event.key.toLowerCase() === "f" &&
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey;
      const quickKey =
        event.key.toLowerCase() === "f" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey;

      if (!shortcut && !(quickKey && !isEditableTarget(event.target))) {
        return;
      }

      event.preventDefault();
      handleOpenFullView();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleOpenFullView,
    hasContent,
    isEditing,
    isFullViewOpen,
    isGenerating,
  ]);

  const handleClose = useCallback(() => {
    if (isFullViewOpen) {
      setIsFullViewOpen(false);
    }
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
    isFullViewOpen,
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
        {showEditor ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleBackToDocuments}
            aria-label={copy.worksheetDocumentsBack}
            title={copy.worksheetDocumentsBack}
            className="h-8 w-8 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        ) : (
          <FileText className="h-4 w-4 shrink-0 text-primary" />
        )}
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">
          {showEditor ? title : copy.toolsWorksheet}
        </h2>
        {hasUnsavedChanges ? (
          <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
            {copy.worksheetUnsavedChanges}
          </span>
        ) : null}
        {showEditor && !isEditing && hasContent ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setSaveTemplateDialogOpen(true)}
            aria-label={copy.worksheetSaveTemplate}
            title={copy.worksheetSaveTemplate}
            className="h-8 w-8 shrink-0"
          >
            <BookmarkPlus className="h-4 w-4" />
          </Button>
        ) : null}
        {showEditor && !isEditing ? (
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
              {errorDetail ? (
                <p className="text-[11px] leading-relaxed text-destructive/80">
                  {errorDetail}
                </p>
              ) : null}
              {onRetry && canRegenerate ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={onRetry}
                  disabled={isGenerating}
                >
                  <RefreshCw className="h-3 w-3" />
                  {copy.worksheetRetry}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {showEditor ? (
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
            onChange={(event) => handleTitleChange(event.target.value)}
            placeholder={copy.worksheetTitlePlaceholder}
            className="h-9 text-sm"
            disabled={isGenerating || isEditing}
          />
        </div>
      ) : null}

      <ScrollArea className="min-h-0 flex-1">
        <div
          className={cn(
            embedded
              ? "p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
              : "p-3 pb-4",
          )}
        >
          {!showEditor ? (
            <>
              {isGenerating ? (
                <div className="mb-4 flex min-h-[10rem] flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-background/60 px-4 py-8 text-center dark:bg-background/40">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm font-medium text-foreground/90">
                    {copy.worksheetGenerating}
                  </p>
                </div>
              ) : null}
              <WorksheetDocumentCards
                locale={locale}
                workspace={workspace}
                onSelectDocument={handleSelectDocument}
              />
              {!isGenerating && documentCount === 0 ? (
                <div className="flex min-h-[14rem] flex-col items-center justify-center rounded-xl border border-dashed bg-background/60 px-4 py-10 text-center dark:bg-background/40">
                  <FileText className="mb-3 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-foreground/90">
                    {copy.worksheetEmptyTitle}
                  </p>
                  <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
                    {copy.worksheetEmptyHint}
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
              ) : null}
            </>
          ) : isGenerating ? (
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
          ) : null}

          {showEditor ? renderDocumentActionBar() : null}
        </div>
      </ScrollArea>

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
        branding={resolvedBranding}
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
          handleRestoreVersion(versionId);
          setHistoryDialogOpen(false);
        }}
        onClose={() => setHistoryDialogOpen(false)}
      />

      <WorksheetBrandingDialog
        open={brandingDialogOpen}
        locale={locale}
        selection={letterheadSelection}
        templates={templates}
        templatesHydrated={templatesHydrated && brandingHydrated}
        activeTemplateName={activeTemplate?.name ?? null}
        previewBranding={resolvedBranding}
        onSelectionChange={(selection) =>
          commitWorkspace(setWorksheetLetterheadSelection(workspace, selection))
        }
        onClose={() => setBrandingDialogOpen(false)}
      />

      <WorksheetFullView
        open={isFullViewOpen}
        locale={locale}
        title={title}
        content={content}
        branding={resolvedBranding}
        onTitleChange={handleTitleChange}
        onContentChange={handleFullViewContentChange}
        onSaveAsTemplate={() => setSaveTemplateDialogOpen(true)}
        onClose={() => setIsFullViewOpen(false)}
      />

      <WorksheetSaveTemplateDialog
        open={saveTemplateDialogOpen}
        locale={locale}
        defaultName={title}
        branding={resolvedBranding}
        sampleContent={content}
        onClose={() => setSaveTemplateDialogOpen(false)}
      />
    </aside>
  );
}