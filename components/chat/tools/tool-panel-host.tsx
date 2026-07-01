"use client";

import { PanelRightClose, FileText } from "lucide-react";

import { MapPanel } from "@/components/chat/tools/map";
import type { MapTool } from "@/components/chat/tools/map/use-map";
import { ResearchPanel } from "@/components/chat/tools/research";
import type { useResearch } from "@/components/chat/tools/research/use-research";
import { WebSearchPanel } from "@/components/chat/tools/web-search";
import type { useWebSearch } from "@/components/chat/tools/web-search/use-web-search";
import { WorksheetPanel } from "@/components/chat/tools/worksheet";
import type { WorksheetTool } from "@/components/chat/tools/worksheet/use-worksheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Locale } from "@/lib/config";
import type { RightSidebarPanel } from "@/lib/chat-tools";
import type { ResearchSession } from "@/lib/research-types";
import type { ResearchDepth } from "@/lib/research-types";
import type { IdaWebSearchSource } from "@/lib/types";
import type { WorksheetDocument } from "@/lib/worksheet";
import type { WorksheetTemplate } from "@/lib/worksheet-templates";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type WebSearchTool = ReturnType<typeof useWebSearch>;
type ResearchTool = ReturnType<typeof useResearch>;

const PANEL_RENDERERS = {
  "web-search": "web-search",
  research: "research",
  map: "map",
  worksheet: "worksheet",
} as const;

export interface ToolPanelHostProps {
  locale: Locale;
  panel: RightSidebarPanel;
  onClose: () => void;
  embedded?: boolean;
  className?: string;
  webSearch: WebSearchTool;
  research: ResearchTool;
  map: MapTool;
  webSearchSearching?: boolean;
  researchSearching?: boolean;
  worksheet: WorksheetDocument;
  worksheetTool?: Pick<
    WorksheetTool,
    "setLocale" | "selectDocument" | "deleteDocument"
  >;
  worksheetErrorDetail?: string | null;
  worksheetGenerating?: boolean;
  worksheetCanRegenerate?: boolean;
  onWorksheetChange: (workspace: WorksheetDocument) => void;
  onWorksheetApplyTemplate?: (template: WorksheetTemplate) => void;
  onWorksheetRetry?: () => void;
  onWorksheetRegenerate?: () => void;
  onWorksheetClear?: () => void;
  onWebSearchUseAsContext?: (result: IdaWebSearchSource) => void;
  onResearchStart?: (topic: string, depth: ResearchDepth) => void;
  onResearchSaveSession?: () => void;
  onResearchOpenSession?: (session: ResearchSession) => void;
  onResearchCreateDocument?: (session: ResearchSession) => void;
  onResearchCreateDocumentFromCurrent?: () => void;
}

export function ToolPanelHost({
  locale,
  panel,
  onClose,
  embedded = false,
  className,
  webSearch,
  research,
  map,
  webSearchSearching = false,
  researchSearching = false,
  worksheet,
  worksheetTool,
  worksheetErrorDetail = null,
  worksheetGenerating = false,
  worksheetCanRegenerate = false,
  onWorksheetChange,
  onWorksheetApplyTemplate,
  onWorksheetRetry,
  onWorksheetRegenerate,
  onWorksheetClear,
  onWebSearchUseAsContext,
  onResearchStart,
  onResearchSaveSession,
  onResearchOpenSession,
  onResearchCreateDocument,
  onResearchCreateDocumentFromCurrent,
}: ToolPanelHostProps) {
  const copy = COPY[locale];

  if (panel === "web-search") {
    return (
      <WebSearchPanel
        locale={locale}
        isSearching={webSearchSearching}
        lastQuery={webSearch.lastQuery}
        searchResults={webSearch.searchResults}
        error={webSearch.error}
        onClose={onClose}
        onClearResults={webSearch.clearResults}
        onUseAsContext={onWebSearchUseAsContext}
        className={className}
        embedded={embedded}
      />
    );
  }

  if (panel === "research") {
    return (
      <ResearchPanel
        locale={locale}
        isResearching={researchSearching}
        researchResults={research.researchResults}
        researchSessions={research.researchSessions}
        error={research.error}
        onClose={onClose}
        onStartResearch={(topic, depth) => onResearchStart?.(topic, depth)}
        onClearResults={research.clearResults}
        onSaveSession={onResearchSaveSession}
        onOpenSession={onResearchOpenSession}
        onCreateDocument={onResearchCreateDocument}
        onCreateDocumentFromCurrent={onResearchCreateDocumentFromCurrent}
        className={className}
        embedded={embedded}
      />
    );
  }

  if (panel === PANEL_RENDERERS.map) {
    return (
      <MapPanel
        locale={locale}
        map={map}
        onClose={onClose}
        className={className}
        embedded={embedded}
      />
    );
  }

  if (panel === "worksheet") {
    return (
      <WorksheetPanel
        locale={locale}
        workspace={worksheet}
        worksheetTool={worksheetTool}
        onWorkspaceChange={onWorksheetChange}
        errorDetail={worksheetErrorDetail}
        isGenerating={worksheetGenerating}
        canRegenerate={worksheetCanRegenerate}
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

  const title = panel;
  const description = copy.toolsComingSoon;
  const previewContent = "";

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
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
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