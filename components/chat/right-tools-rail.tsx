"use client";

import { useMemo } from "react";

import {
  getAllTools,
  isToolEnabled,
  TOOL_DISPLAY_ORDER,
  TOOL_UI_CONFIG,
} from "@/components/chat/tools";
import { webSearchTool } from "@/components/chat/tools/web-search/web-search-tool";
import { worksheetTool } from "@/components/chat/tools/worksheet/worksheet-tool";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/config";
import type { RightSidebarPanel } from "@/lib/chat-tools";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface RightToolsRailProps {
  locale: Locale;
  activePanel: RightSidebarPanel | null;
  worksheetEnabled: boolean;
  webSearchEnabled: boolean;
  webSearchAvailable: boolean;
  onSelectPanel: (panel: RightSidebarPanel) => void;
  onWebSearchChange: (enabled: boolean) => void;
  className?: string;
}

export function RightToolsRail({
  locale,
  activePanel,
  worksheetEnabled,
  webSearchEnabled,
  webSearchAvailable,
  onSelectPanel,
  onWebSearchChange,
  className,
}: RightToolsRailProps) {
  const copy = COPY[locale];

  const railTools = useMemo(
    () =>
      getAllTools()
        .filter(
          (tool) =>
            isToolEnabled(tool.id) && TOOL_UI_CONFIG[tool.id].railPanel,
        )
        .sort(
          (a, b) =>
            TOOL_DISPLAY_ORDER.indexOf(a.id) -
            TOOL_DISPLAY_ORDER.indexOf(b.id),
        ),
    [],
  );

  const handleRailClick = (toolId: string, panel: RightSidebarPanel) => {
    if (toolId === webSearchTool.id) {
      if (!webSearchAvailable) return;
      if (!webSearchEnabled) {
        onWebSearchChange(true);
      }
      onSelectPanel(panel);
      return;
    }

    onSelectPanel(panel);
  };

  return (
    <aside
      className={cn(
        "relative z-10 flex h-full w-14 shrink-0 flex-col items-center gap-1 border-l bg-muted/20 py-3 dark:bg-muted/10",
        className,
      )}
      aria-label={copy.toolsMenu}
    >
      {railTools.map((tool) => {
        const config = TOOL_UI_CONFIG[tool.id];
        const panel = config.railPanel!;
        const Icon = config.icon;
        const isExpanded = activePanel === panel;
        const isWorksheetArmed =
          tool.id === worksheetTool.id && worksheetEnabled && !isExpanded;
        const isWebSearchArmed =
          tool.id === webSearchTool.id &&
          webSearchEnabled &&
          !isExpanded &&
          webSearchAvailable;
        const isDisabled =
          tool.id === webSearchTool.id && !webSearchAvailable;

        return (
          <Button
            key={tool.id}
            type="button"
            variant={isExpanded ? "default" : "ghost"}
            size="icon"
            disabled={isDisabled}
            className={cn(
              "relative h-11 w-11",
              isExpanded && "shadow-sm",
              isDisabled && "opacity-50",
            )}
            aria-label={copy[config.labelKey]}
            aria-pressed={isExpanded}
            title={copy[config.labelKey]}
            onClick={() => handleRailClick(tool.id, panel)}
          >
            <Icon className="h-4 w-4" />
            {isWorksheetArmed || isWebSearchArmed ? (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
            ) : null}
          </Button>
        );
      })}
    </aside>
  );
}