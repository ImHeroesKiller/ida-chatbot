"use client";

import { FileText, Map, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/config";
import type { RightSidebarPanel } from "@/lib/chat-tools";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface RightToolsRailProps {
  locale: Locale;
  activePanel: RightSidebarPanel | null;
  worksheetEnabled: boolean;
  onSelectPanel: (panel: RightSidebarPanel) => void;
  className?: string;
}

const TOOL_ITEMS: {
  id: RightSidebarPanel;
  icon: typeof FileText;
  labelKey: "toolsWorksheet" | "toolsMap" | "toolsResearch";
}[] = [
  { id: "worksheet", icon: FileText, labelKey: "toolsWorksheet" },
  { id: "map", icon: Map, labelKey: "toolsMap" },
  { id: "research", icon: Search, labelKey: "toolsResearch" },
];

export function RightToolsRail({
  locale,
  activePanel,
  worksheetEnabled,
  onSelectPanel,
  className,
}: RightToolsRailProps) {
  const copy = COPY[locale];

  return (
    <aside
      className={cn(
        "relative z-10 flex h-full w-14 shrink-0 flex-col items-center gap-1 border-l bg-muted/20 py-3 dark:bg-muted/10",
        className,
      )}
      aria-label={copy.toolsMenu}
    >
      {TOOL_ITEMS.map((item) => {
        const Icon = item.icon;
        const isExpanded = activePanel === item.id;
        const isWorksheetArmed =
          item.id === "worksheet" && worksheetEnabled && !isExpanded;

        return (
          <Button
            key={item.id}
            type="button"
            variant={isExpanded ? "default" : "ghost"}
            size="icon"
            className={cn(
              "relative h-11 w-11",
              isExpanded && "shadow-sm",
            )}
            aria-label={copy[item.labelKey]}
            aria-pressed={isExpanded}
            title={copy[item.labelKey]}
            onClick={() => onSelectPanel(item.id)}
          >
            <Icon className="h-4 w-4" />
            {isWorksheetArmed ? (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
            ) : null}
          </Button>
        );
      })}
    </aside>
  );
}