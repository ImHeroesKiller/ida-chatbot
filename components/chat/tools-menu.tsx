"use client";

import {
  FileText,
  Globe,
  Map,
  Search,
  Wrench,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
  activePanel: RightSidebarPanel | null;
  onWebSearchChange: (enabled: boolean) => void;
  onOpenPanel: (panel: RightSidebarPanel) => void;
}

export function ToolsMenu({
  locale,
  disabled = false,
  webSearchEnabled,
  webSearchAvailable,
  activePanel,
  onWebSearchChange,
  onOpenPanel,
}: ToolsMenuProps) {
  const copy = COPY[locale];
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isActive = webSearchEnabled || activePanel !== null;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
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

  return (
    <div ref={containerRef} className="relative shrink-0">
      <Button
        type="button"
        variant={isActive ? "default" : "outline"}
        size="icon"
        disabled={disabled}
        aria-label={copy.toolsMenu}
        aria-expanded={open}
        aria-haspopup="menu"
        title={copy.toolsMenu}
        className="h-12 w-12 sm:h-11 sm:w-11"
        onClick={() => setOpen((value) => !value)}
      >
        <Wrench className="h-4 w-4" />
      </Button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute bottom-full left-0 z-[60] mb-2 w-52",
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
              activePanel === "map" && "bg-muted/80",
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
              activePanel === "research" && "bg-muted/80",
            )}
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 font-medium">{copy.toolsResearch}</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onOpenPanel("canvas");
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs",
              "transition-colors hover:bg-muted",
              activePanel === "canvas" && "bg-muted/80",
            )}
          >
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 font-medium">{copy.toolsCanvas}</span>
          </button>

          {!webSearchAvailable ? (
            <p className="px-2.5 pt-1 text-[10px] text-muted-foreground">
              {copy.webSearchUnavailable}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}