"use client";

import { FileText, Map, PanelRightClose, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Locale } from "@/lib/config";
import type { RightSidebarPanel } from "@/lib/chat-tools";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface RightSidebarProps {
  locale: Locale;
  panel: RightSidebarPanel;
  onClose: () => void;
  className?: string;
  embedded?: boolean;
}

const PANEL_ICONS = {
  canvas: FileText,
  map: Map,
  research: Search,
} as const;

export function RightSidebar({
  locale,
  panel,
  onClose,
  className,
  embedded = false,
}: RightSidebarProps) {
  const copy = COPY[locale];
  const Icon = PANEL_ICONS[panel];

  const title =
    panel === "canvas"
      ? copy.toolsCanvas
      : panel === "map"
        ? copy.toolsMap
        : copy.toolsResearch;

  const description =
    panel === "canvas"
      ? copy.canvasPlaceholderDesc
      : panel === "map"
        ? copy.mapPlaceholderDesc
        : copy.researchPlaceholderDesc;

  const previewContent =
    panel === "map"
      ? copy.mapPlaceholderContent
      : copy.researchPlaceholderContent;

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col border-l bg-muted/10 dark:bg-muted/5",
        embedded ? "w-full" : "w-[min(100%,22rem)] shrink-0",
        className,
      )}
      aria-label={title}
    >
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2.5">
        <Icon className="h-4 w-4 shrink-0 text-primary" />
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
        {panel === "canvas" ? (
          <div className="flex min-h-[calc(100dvh-12rem)] flex-col items-center justify-center p-6 text-center">
            <div className="flex w-full max-w-xs flex-col items-center rounded-2xl border border-dashed bg-background/60 px-6 py-10 dark:bg-background/40">
              <FileText className="mb-3 h-9 w-9 text-muted-foreground/60" />
              <p className="text-sm font-medium text-foreground/90">
                {copy.canvasEmptyState}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {copy.canvasPlaceholderDesc}
              </p>
            </div>
          </div>
        ) : (
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
        )}
      </ScrollArea>
    </aside>
  );
}