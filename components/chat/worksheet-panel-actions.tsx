"use client";

import { MoreVertical } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { WORKSHEET_POPOVER_OVERLAY_CLASS } from "@/lib/worksheet-overlay";
import { cn } from "@/lib/utils";

export function WorksheetIconAction({
  label,
  onClick,
  disabled = false,
  active = false,
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("group/worksheet-action relative", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={cn(
          "h-9 w-9 shrink-0",
          active && "border-primary/30 bg-primary/10 text-foreground",
        )}
      >
        {children}
      </Button>
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2",
          "whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-[10px] text-popover-foreground shadow-md",
          "opacity-0 transition-opacity duration-150",
          "group-hover/worksheet-action:opacity-100 group-focus-within/worksheet-action:opacity-100",
        )}
      >
        {label}
      </span>
    </div>
  );
}

export interface WorksheetOverflowMenuItem {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

export function WorksheetIconMenu({
  label,
  items,
  disabled = false,
  children,
}: {
  label: string;
  items: WorksheetOverflowMenuItem[];
  disabled?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateMenuPosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const menuWidth = menuRef.current?.offsetWidth ?? 176;

    setMenuPosition({
      top: rect.top - 8,
      left: Math.max(8, rect.right - menuWidth),
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

  const hasEnabledItem = items.some((item) => !item.disabled);

  return (
    <>
      <div className="group/worksheet-action relative">
        <Button
          ref={anchorRef}
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={disabled || !hasEnabledItem}
          aria-label={label}
          aria-expanded={open}
          aria-haspopup="menu"
          className="h-9 w-9 shrink-0"
          onClick={() => setOpen((current) => !current)}
        >
          {children}
        </Button>
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2",
            "whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-[10px] text-popover-foreground shadow-md",
            "opacity-0 transition-opacity duration-150",
            "group-hover/worksheet-action:opacity-100 group-focus-within/worksheet-action:opacity-100",
          )}
        >
          {label}
        </span>
      </div>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              className={cn(
                "fixed min-w-[11rem] -translate-y-full rounded-lg border bg-popover p-1 shadow-lg",
                WORKSHEET_POPOVER_OVERLAY_CLASS,
              )}
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    item.destructive
                      ? "text-destructive hover:bg-destructive/10"
                      : "hover:bg-muted",
                  )}
                  onClick={() => {
                    if (item.disabled) return;
                    item.onClick();
                    setOpen(false);
                  }}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="min-w-0 truncate">{item.label}</span>
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function WorksheetOverflowMenu({
  label,
  items,
  disabled = false,
}: {
  label: string;
  items: WorksheetOverflowMenuItem[];
  disabled?: boolean;
}) {
  return (
    <WorksheetIconMenu label={label} items={items} disabled={disabled}>
      <MoreVertical className="h-4 w-4" />
    </WorksheetIconMenu>
  );
}