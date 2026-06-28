"use client";

import {
  FileText,
  Globe,
  Map,
  Search,
  Wrench,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

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

  const isActive =
    webSearchEnabled || worksheetEnabled || activePanel !== null;

  const activeToolLabels = [
    webSearchEnabled ? copy.toolsWebSearch : null,
    worksheetEnabled ? copy.toolsWorksheet : null,
    activePanel === "map" ? copy.toolsMap : null,
    activePanel === "research" ? copy.toolsResearch : null,
  ].filter(Boolean);

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
          <button
            type="button"
            role="menuitem"
            disabled={!webSearchAvailable}
            onClick={() => {
              if (!webSearchAvailable) return;
              onWebSearchChange(!webSearchEnabled);
            }}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs",
              "transition-colors hover:bg-muted",
              webSearchEnabled && "bg-primary/10 ring-1 ring-primary/20",
              !webSearchAvailable && "cursor-not-allowed opacity-50",
            )}
          >
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 font-medium">{copy.toolsWebSearch}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                webSearchEnabled
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {webSearchEnabled ? copy.toolsOn : copy.toolsOff}
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onOpenPanel("map");
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs",
              "transition-colors hover:bg-muted",
              activePanel === "map" && "bg-primary/10 ring-1 ring-primary/20",
            )}
          >
            <Map className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 font-medium">{copy.toolsMap}</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onOpenPanel("research");
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs",
              "transition-colors hover:bg-muted",
              activePanel === "research" && "bg-primary/10 ring-1 ring-primary/20",
            )}
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 font-medium">{copy.toolsResearch}</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onWorksheetChange(!worksheetEnabled);
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs",
              "transition-colors hover:bg-muted",
              worksheetEnabled && "bg-primary/10 ring-1 ring-primary/20",
            )}
          >
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 font-medium">{copy.toolsWorksheet}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                worksheetEnabled
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {worksheetEnabled ? copy.toolsOn : copy.toolsOff}
            </span>
          </button>

          {!webSearchAvailable ? (
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