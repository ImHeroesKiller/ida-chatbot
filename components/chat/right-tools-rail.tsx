"use client";

import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { notifyToolComingSoon } from "@/components/chat/tool-rail-notify";
import type { ToolRailGroup } from "@/components/chat/tools/coordinator-types";
import type { ToolId } from "@/components/chat/tools/types";
import type { Locale } from "@/lib/config";
import type { RightSidebarPanel } from "@/lib/chat-tools";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface RightToolsRailProps {
  locale: Locale;
  railGroups: ToolRailGroup[];
  onRailClick: (toolId: ToolId, panel: RightSidebarPanel) => void;
  className?: string;
}

export function RightToolsRail({
  locale,
  railGroups,
  onRailClick,
  className,
}: RightToolsRailProps) {
  const copy = COPY[locale];

  return (
    <aside
      className={cn(
        "relative z-10 flex h-full w-14 shrink-0 flex-col items-center gap-1 overflow-y-auto py-2.5",
        "ida-glass-subtle border-l border-border/30",
        className,
      )}
      aria-label={copy.toolsMenu}
    >
      {railGroups.map((group, groupIndex) => (
        <div
          key={group.id}
          className={cn(
            "flex w-full flex-col items-center gap-1 px-1",
            groupIndex > 0 && "mt-0.5 border-t border-border/40 pt-2",
          )}
        >
          {group.items.map((item) => {
            const Icon = item.icon;
            const label = copy[item.labelKey];
            const title = item.comingSoon
              ? `${label} — ${copy.toolsComingSoon}`
              : label;

            return (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
              >
                <Button
                  type="button"
                  variant={item.isExpanded ? "default" : "ghost"}
                  size="icon"
                  disabled={item.isDisabled}
                  className={cn(
                    "relative h-9 w-9 rounded-lg transition-shadow duration-200",
                    item.isExpanded &&
                      "shadow-md shadow-primary/20 ring-1 ring-primary/25",
                    item.isDisabled && "opacity-60",
                    item.comingSoon && "opacity-80 hover:opacity-100",
                    !item.isExpanded &&
                      "hover:bg-accent/80 hover:shadow-sm",
                  )}
                  aria-label={title}
                  aria-pressed={item.isExpanded}
                  title={title}
                  onClick={() => {
                    if (item.comingSoon) {
                      notifyToolComingSoon(locale, item.labelKey);
                      return;
                    }
                    if (!item.panel) return;
                    onRailClick(item.id as ToolId, item.panel);
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {item.comingSoon ? (
                    <span className="absolute -right-0.5 -bottom-0.5 rounded bg-muted px-0.5 text-[7px] font-semibold uppercase tracking-wide text-muted-foreground ring-1 ring-border">
                      ···
                    </span>
                  ) : null}
                  {item.isArmed ? (
                    <motion.span
                      layoutId={`rail-armed-${item.id}`}
                      className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background"
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  ) : null}
                </Button>
              </motion.div>
            );
          })}
        </div>
      ))}
    </aside>
  );
}