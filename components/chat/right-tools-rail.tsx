"use client";

import { Button } from "@/components/ui/button";
import type { ToolRailItem } from "@/components/chat/tools/use-tools-coordinator";
import type { Locale } from "@/lib/config";
import type { ToolId } from "@/components/chat/tools/types";
import type { RightSidebarPanel } from "@/lib/chat-tools";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface RightToolsRailProps {
  locale: Locale;
  railItems: ToolRailItem[];
  onRailClick: (toolId: ToolId, panel: RightSidebarPanel) => void;
  className?: string;
}

export function RightToolsRail({
  locale,
  railItems,
  onRailClick,
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
      {railItems.map((item) => {
        const Icon = item.icon;

        return (
          <Button
            key={item.id}
            type="button"
            variant={item.isExpanded ? "default" : "ghost"}
            size="icon"
            disabled={item.isDisabled}
            className={cn(
              "relative h-11 w-11",
              item.isExpanded && "shadow-sm",
              item.isDisabled && "opacity-50",
            )}
            aria-label={copy[item.labelKey]}
            aria-pressed={item.isExpanded}
            title={copy[item.labelKey]}
            onClick={() => onRailClick(item.id, item.panel)}
          >
            <Icon className="h-4 w-4" />
            {item.isArmed ? (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
            ) : null}
          </Button>
        );
      })}
    </aside>
  );
}