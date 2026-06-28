"use client";

import {
  FileText,
  Globe,
  Map,
  Search,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { getAllTools, isToolEnabled } from "@/components/chat/tools/registry";
import type { ToolId } from "@/components/chat/tools/types";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/config";
import type { RightSidebarPanel } from "@/lib/chat-tools";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ToolsMenuProps {
  locale: Locale;
  disabled?: boolean;
  webSearchEnabled: boolean;
  webSearchAvailable: boolean;
  worksheetEnabled: boolean;
  activePanel: RightSidebarPanel | null;
  onWebSearchChange: (enabled: boolean) => void;
  onWorksheetChange: (enabled: boolean) => void;
  onOpenPanel: (panel: RightSidebarPanel) => void;
}

type ToolLabelKey =
  | "toolsWebSearch"
  | "toolsMap"
  | "toolsResearch"
  | "toolsWorksheet";

type ToolMenuConfig = {
  icon: LucideIcon;
  labelKey: ToolLabelKey;
  kind: "toggle-web-search" | "toggle-worksheet" | "open-panel";
  panel?: RightSidebarPanel;
};

const TOOL_DISPLAY_ORDER: ToolId[] = [
  "web-search",
  "map",
  "research",
  "worksheet",
];

const TOOL_MENU_CONFIG: Record<ToolId, ToolMenuConfig> = {
  "web-search": {
    icon: Globe,
    labelKey: "toolsWebSearch",
    kind: "toggle-web-search",
  },
  worksheet: {
    icon: FileText,
    labelKey: "toolsWorksheet",
    kind: "toggle-worksheet",
  },
  map: {
    icon: Map,
    labelKey: "toolsMap",
    kind: "open-panel",
    panel: "map",
  },
  research: {
    icon: Search,
    labelKey: "toolsResearch",
    kind: "open-panel",
    panel: "research",
  },
};

export function ToolsMenu({
  locale,
  disabled = false,
  webSearchEnabled,
  webSearchAvailable,
  worksheetEnabled,
  activePanel,
  onWebSearchChange,
  onWorksheetChange,
  onOpenPanel,
}: ToolsMenuProps) {
  const copy = COPY[locale];
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const tools = useMemo(
    () =>
      getAllTools()
        .filter((tool) => isToolEnabled(tool.id))
        .sort(
          (a, b) =>
            TOOL_DISPLAY_ORDER.indexOf(a.id) - TOOL_DISPLAY_ORDER.indexOf(b.id),
        ),
    [],
  );

  const isToolActive = useCallback(
    (toolId: ToolId): boolean => {
      switch (toolId) {
        case "web-search":
          return webSearchEnabled;
        case "worksheet":
          return worksheetEnabled;
        case "map":
          return activePanel === "map";
        case "research":
          return activePanel === "research";
        default:
          return false;
      }
    },
    [activePanel, webSearchEnabled, worksheetEnabled],
  );

  const isActive =
    webSearchEnabled || worksheetEnabled || activePanel !== null;

  const activeToolLabels = tools
    .filter((tool) => isToolActive(tool.id))
    .map((tool) => copy[TOOL_MENU_CONFIG[tool.id].labelKey]);

  const buttonTitle =
    activeToolLabels.length > 0
      ? `${copy.toolsMenu} — ${activeToolLabels.join(", ")}`
      : copy.toolsMenu;

  const updateMenuPosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    setMenuPosition({
      top: rect.top - 8,
      left: rect.left,
    });
  }, []);

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
        anchorRef.current?.contains(target) ||
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
    const config = TOOL_MENU_CONFIG[toolId];

    switch (config.kind) {
      case "toggle-web-search":
        if (!webSearchAvailable) return;
        onWebSearchChange(!webSearchEnabled);
        break;
      case "toggle-worksheet":
        onWorksheetChange(!worksheetEnabled);
        setOpen(false);
        break;
      case "open-panel":
        if (config.panel) {
          onOpenPanel(config.panel);
          setOpen(false);
        }
        break;
    }
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
        "z-[80] w-52",
        "rounded-xl border bg-popover p-1.5 shadow-lg",
      )}
    >
      {tools.map((tool) => {
        const config = TOOL_MENU_CONFIG[tool.id];
        const Icon = config.icon;
        const active = isToolActive(tool.id);
        const isToggle =
          config.kind === "toggle-web-search" ||
          config.kind === "toggle-worksheet";
        const isWebSearch = tool.id === "web-search";
        const itemDisabled = isWebSearch && !webSearchAvailable;

        return (
          <button
            key={tool.id}
            type="button"
            role="menuitem"
            disabled={itemDisabled}
            onClick={() => handleToolClick(tool.id)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs",
              "transition-colors hover:bg-muted",
              active && "bg-primary/10 ring-1 ring-primary/20",
              itemDisabled && "cursor-not-allowed opacity-50",
            )}
          >
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 font-medium">{copy[config.labelKey]}</span>
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

      {!webSearchAvailable &&
      tools.some((tool) => tool.id === "web-search") ? (
        <p className="px-2.5 pt-1 text-[10px] text-muted-foreground">
          {copy.webSearchUnavailable}
        </p>
      ) : null}
    </div>
  ) : null;

  return (
    <div className="relative z-30 shrink-0">
      <Button
        ref={anchorRef}
        type="button"
        variant={isActive ? "default" : "outline"}
        size="icon"
        disabled={disabled}
        aria-label={copy.toolsMenu}
        aria-expanded={open}
        aria-haspopup="menu"
        title={buttonTitle}
        className={cn(
          "relative h-12 w-12 sm:h-11 sm:w-11",
          isActive && "ring-2 ring-primary/40",
          open && "ring-2 ring-primary/60",
        )}
        onClick={() => setOpen((value) => !value)}
      >
        <Wrench className="h-4 w-4" />
        {isActive ? (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
        ) : null}
      </Button>

      {typeof document !== "undefined" && menuContent
        ? createPortal(menuContent, document.body)
        : null}
    </div>
  );
}