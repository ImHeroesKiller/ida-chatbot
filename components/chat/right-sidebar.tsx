"use client";

import { Map, PanelRightClose, Search } from "lucide-react";

import { WorksheetPanel } from "@/components/chat/worksheet-panel";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Locale } from "@/lib/config";
import type { RightSidebarPanel } from "@/lib/chat-tools";
import type { WorksheetErrorCode, WorksheetVersion } from "@/lib/worksheet";
import type { WorksheetTemplate } from "@/lib/worksheet-templates";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface RightSidebarProps {
  locale: Locale;
  panel: RightSidebarPanel;
  worksheetTitle: string;
  worksheetContent: string;
  worksheetError?: WorksheetErrorCode | null;
  worksheetErrorDetail?: string | null;
  worksheetGenerating?: boolean;
  worksheetCanRegenerate?: boolean;
  onWorksheetTitleChange: (title: string) => void;
  onWorksheetContentSave?: (content: string) => void;
  onWorksheetContentChange?: (content: string) => void;
  worksheetVersions?: WorksheetVersion[];
  onWorksheetRestoreVersion?: (versionId: string) => void;
  onWorksheetApplyTemplate?: (template: WorksheetTemplate) => void;
  onWorksheetRetry?: () => void;
  onWorksheetRegenerate?: () => void;
  onWorksheetClear?: () => void;
  onClose: () => void;
  className?: string;
  embedded?: boolean;
}

const PANEL_ICONS = {
  worksheet: Map,
  map: Map,
  research: Search,
} as const;

export function RightSidebar({
  locale,
  panel,
  worksheetTitle,
  worksheetContent,
  worksheetError = null,
  worksheetErrorDetail = null,
  worksheetGenerating = false,
  worksheetCanRegenerate = false,
  onWorksheetTitleChange,
  onWorksheetContentSave,
  onWorksheetContentChange,
  worksheetVersions = [],
  onWorksheetRestoreVersion,
  onWorksheetApplyTemplate,
  onWorksheetRetry,
  onWorksheetRegenerate,
  onWorksheetClear,
  onClose,
  className,
  embedded = false,
}: RightSidebarProps) {
  const copy = COPY[locale];

  if (panel === "worksheet") {
    return (
      <WorksheetPanel
        locale={locale}
        title={worksheetTitle}
        content={worksheetContent}
        error={worksheetError}
        errorDetail={worksheetErrorDetail}
        isGenerating={worksheetGenerating}
        canRegenerate={worksheetCanRegenerate}
        onTitleChange={onWorksheetTitleChange}
        onContentSave={onWorksheetContentSave}
        onContentChange={onWorksheetContentChange}
        versions={worksheetVersions}
        onRestoreVersion={onWorksheetRestoreVersion}
        onApplyTemplate={onWorksheetApplyTemplate}
        onRetry={onWorksheetRetry}
        onRegenerate={onWorksheetRegenerate}
        onClear={onWorksheetClear}
        onClose={onClose}
        className={className}
        embedded={embedded}
      />
    );
  }

  const Icon = PANEL_ICONS[panel];

  const title = panel === "map" ? copy.toolsMap : copy.toolsResearch;

  const description =
    panel === "map" ? copy.mapPlaceholderDesc : copy.researchPlaceholderDesc;

  const previewContent =
    panel === "map" ? copy.mapPlaceholderContent : copy.researchPlaceholderContent;

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col border-l bg-muted/10 dark:bg-muted/5",
        embedded
          ? "w-full"
          : "relative z-10 w-[min(100%,22rem)] shrink-0 bg-background",
        className,
      )}
      aria-label={title}
    >
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2.5">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</h2>
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

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-4">
          <div className="rounded-xl border border-dashed bg-background/60 p-4 dark:bg-background/40">
            <p className="text-xs font-medium text-muted-foreground">
              {copy.toolsComingSoon}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">
              {description}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {copy.previewLabel}
            </p>
            <div className="min-h-[12rem] rounded-lg bg-muted/40 p-3">
              <pre className="chat-text whitespace-pre-wrap text-muted-foreground">
                {previewContent}
              </pre>
            </div>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}