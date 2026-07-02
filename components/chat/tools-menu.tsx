"use client";

import { Wrench } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import { notifyToolComingSoon } from "@/components/chat/tool-rail-notify";
import {
  isToolRailPlaceholder,
  TOOL_RAIL_GROUPS,
} from "@/components/chat/tool-rail-config";
import {
  isToolEnabled,
  TOOL_UI_CONFIG,
} from "@/components/chat/tools";
import type { ToolId } from "@/components/chat/tools/types";
import { isHeavyToolId } from "@/lib/client/heavy-tools-desktop";
import { useHeavyToolsDesktop } from "@/lib/client/use-heavy-tools-desktop";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ToolsMenuProps {
  locale: Locale;
  disabled?: boolean;
  webSearchAvailable: boolean;
  researchAvailable: boolean;
  isToolActive: (toolId: ToolId) => boolean;
  isAnyToolActive: boolean;
  onToolClick: (toolId: ToolId) => void;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
}

export function ToolsMenu({
  locale,
  disabled = false,
  webSearchAvailable,
  researchAvailable,
  isToolActive,
  isAnyToolActive,
  onToolClick,
  className,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
  anchorRef: externalAnchorRef,
}: ToolsMenuProps) {
  const copy = COPY[locale];
  const { allowed: heavyToolsDesktop } = useHeavyToolsDesktop();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = useCallback(
    (value: boolean | ((current: boolean) => boolean)) => {
      const nextValue =
        typeof value === "function"
          ? value(isControlled ? (controlledOpen ?? false) : internalOpen)
          : value;

      if (isControlled) {
        onOpenChange?.(nextValue);
      } else {
        setInternalOpen(nextValue);
      }
    },
    [controlledOpen, internalOpen, isControlled, onOpenChange],
  );
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const positioningRef = externalAnchorRef ?? triggerRef;
  const menuRef = useRef<HTMLDivElement>(null);

  const menuGroups = useMemo(
    () =>
      TOOL_RAIL_GROUPS.map((group) => ({
        ...group,
        entries: group.entries.filter((entry) => {
          if (entry.comingSoon || isToolRailPlaceholder(entry.id)) return true;
          const toolId = entry.id as ToolId;
          if (!heavyToolsDesktop && isHeavyToolId(toolId)) return false;
          return isToolEnabled(toolId);
        }),
      })).filter((group) => group.entries.length > 0),
    [heavyToolsDesktop],
  );

  const activeToolLabels = useMemo(
    () =>
      menuGroups.flatMap((group) =>
        group.entries
          .filter((entry) => !entry.comingSoon && !isToolRailPlaceholder(entry.id))
          .filter((entry) => isToolActive(entry.id as ToolId))
          .map((entry) => copy[entry.labelKey]),
      ),
    [copy, isToolActive, menuGroups],
  );

  const buttonTitle =
    activeToolLabels.length > 0
      ? `${copy.toolsMenu} — ${activeToolLabels.join(", ")}`
      : copy.toolsMenu;

  const updateMenuPosition = useCallback(() => {
    const anchor = positioningRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    setMenuPosition({
      top: rect.top - 8,
      left: rect.left,
    });
  }, [positioningRef]);

  useLayoutEffect(() => {
    if (!open) return;

    updateMenuPosition();

    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        positioningRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleToolClick = (toolId: ToolId) => {
    onToolClick(toolId);
    setOpen(false);
  };

  const menuContent = open ? (
    <div
      ref={menuRef}
      role="menu"
      style={{
        position: "fixed",
        top: menuPosition.top,
        left: menuPosition.left,
        transform: "translateY(-100%)",
      }}
      className={cn(
        "z-[80] w-56",
        "rounded-xl border bg-popover p-1.5 shadow-lg",
      )}
    >
      {menuGroups.map((group, groupIndex) => (
        <div
          key={group.id}
          className={cn(
            groupIndex > 0 && "mt-1 border-t border-border/60 pt-1.5",
          )}
        >
          <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {copy[group.labelKey]}
          </p>

          {group.entries.map((entry) => {
            const Icon = entry.icon;
            const label = copy[entry.labelKey];
            const isComingSoon =
              entry.comingSoon || isToolRailPlaceholder(entry.id);

            if (isComingSoon) {
              return (
                <button
                  key={entry.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    notifyToolComingSoon(locale, entry.labelKey);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs",
                    "transition-colors hover:bg-muted",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 font-medium">{label}</span>
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {copy.toolsComingSoon}
                  </span>
                </button>
              );
            }

            const toolId = entry.id as ToolId;
            const config = TOOL_UI_CONFIG[toolId];
            const active = isToolActive(toolId);
            const isToggle =
              config.kind === "toggle-web-search" ||
              config.kind === "toggle-research" ||
              config.kind === "toggle-worksheet" ||
              config.kind === "toggle-map";
            const isWebSearch = toolId === "web-search";
            const isResearch = toolId === "research";
            const itemDisabled =
              (isWebSearch && !webSearchAvailable) ||
              (isResearch && !researchAvailable);

            return (
              <button
                key={entry.id}
                type="button"
                role="menuitem"
                disabled={itemDisabled}
                onClick={() => handleToolClick(toolId)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs",
                  "transition-colors hover:bg-muted",
                  active && "bg-primary/10 ring-1 ring-primary/20",
                  itemDisabled && "cursor-not-allowed opacity-50",
                )}
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 font-medium">{label}</span>
                {isToggle ? (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                      active
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {active ? copy.toolsOn : copy.toolsOff}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ))}

      {!webSearchAvailable ? (
        <p className="px-2.5 pt-1 text-[10px] text-muted-foreground">
          {copy.webSearchUnavailable}
        </p>
      ) : null}

      {!researchAvailable ? (
        <p className="px-2.5 pt-1 text-[10px] text-muted-foreground">
          {copy.researchUnavailable}
        </p>
      ) : null}
    </div>
  ) : null;

  return (
    <div className={cn("relative z-30 shrink-0", className)}>
      {!hideTrigger ? (
        <Button
          ref={triggerRef}
          type="button"
          variant={isAnyToolActive ? "default" : "outline"}
          size="icon"
          disabled={disabled}
          aria-label={copy.toolsMenu}
          aria-expanded={open}
          aria-haspopup="menu"
          title={buttonTitle}
          className={cn(
            "relative h-12 w-12 sm:h-11 sm:w-11",
            isAnyToolActive && "ring-2 ring-primary/40",
            open && "ring-2 ring-primary/60",
          )}
          onClick={() => setOpen((value) => !value)}
        >
          <Wrench className="h-4 w-4" />
          {isAnyToolActive ? (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
          ) : null}
        </Button>
      ) : null}

      {typeof document !== "undefined" && menuContent
        ? createPortal(menuContent, document.body)
        : null}
    </div>
  );
}