"use client";

import { AnimatePresence, motion } from "framer-motion";
import { GripVertical, X } from "lucide-react";
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import { useIsMobileViewport } from "@/lib/client/use-media-query";
import { backdropFade, popoverPanel } from "@/lib/ui/motion-presets";
import { cn } from "@/lib/utils";

interface WorkflowFloatingPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

function WorkflowFloatingPanelInner({
  open,
  onClose,
  title,
  closeLabel = "Close",
  icon,
  children,
  className,
}: WorkflowFloatingPanelProps) {
  const isMobile = useIsMobileViewport();
  const panelRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({
    dragging: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null,
  );

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (!open) {
      setPosition(null);
    }
  }, [open]);

  const handleBackdropClick = useCallback(
    (event: { target: EventTarget; currentTarget: EventTarget }) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  const handleDragStart = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (isMobile) return;

      const panel = panelRef.current;
      if (!panel) return;

      const rect = panel.getBoundingClientRect();
      const originX = position?.x ?? rect.left;
      const originY = position?.y ?? rect.top;

      dragState.current = {
        dragging: true,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX,
        originY,
      };

      if (position === null) {
        setPosition({ x: originX, y: originY });
      }

      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [isMobile, position],
  );

  const handleDragMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.dragging) return;
    if (event.pointerId !== dragState.current.pointerId) return;

    const deltaX = event.clientX - dragState.current.startX;
    const deltaY = event.clientY - dragState.current.startY;
    const panel = panelRef.current;
    const width = panel?.offsetWidth ?? 320;
    const height = panel?.offsetHeight ?? 400;

    const x = Math.min(
      Math.max(8, dragState.current.originX + deltaX),
      window.innerWidth - width - 8,
    );
    const y = Math.min(
      Math.max(8, dragState.current.originY + deltaY),
      window.innerHeight - height - 8,
    );

    setPosition({ x, y });
  }, []);

  const handleDragEnd = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.dragging) return;
    if (event.pointerId !== dragState.current.pointerId) return;

    dragState.current.dragging = false;
    dragState.current.pointerId = -1;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="workflow-floating-backdrop"
          className="absolute inset-0 z-30 flex items-end justify-center p-2 sm:items-start sm:justify-end sm:p-3"
          onClick={handleBackdropClick}
          role="presentation"
          initial={backdropFade.initial}
          animate={backdropFade.animate}
          exit={backdropFade.exit}
          transition={backdropFade.transition}
        >
          <motion.div
            className="absolute inset-0 bg-background/50 backdrop-blur-md"
            aria-hidden
            initial={backdropFade.initial}
            animate={backdropFade.animate}
            exit={backdropFade.exit}
            transition={backdropFade.transition}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={popoverPanel.initial}
            animate={popoverPanel.animate}
            exit={popoverPanel.exit}
            transition={popoverPanel.transition}
            className={cn(
              "relative z-10 flex max-h-[min(84vh,30rem)] w-[min(100%,22rem)] flex-col overflow-hidden rounded-xl",
              "ida-glass shadow-2xl ring-1 ring-border/50",
              isMobile && "w-full max-w-md",
              className,
            )}
            style={
              !isMobile && position
                ? { position: "fixed", left: position.x, top: position.y }
                : undefined
            }
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className={cn(
                "flex shrink-0 items-center gap-1.5 border-b border-border/40 bg-muted/20 px-2.5 py-2",
                !isMobile && "cursor-grab active:cursor-grabbing",
              )}
              onPointerDown={handleDragStart}
              onPointerMove={handleDragMove}
              onPointerUp={handleDragEnd}
              onPointerCancel={handleDragEnd}
            >
              {!isMobile ? (
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/60" />
              ) : null}
              {icon ? (
                <span className="flex shrink-0 text-primary">{icon}</span>
              ) : null}
              <h3 className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight">
                {title}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7 shrink-0 rounded-lg transition-transform hover:scale-105"
                onClick={onClose}
                aria-label={closeLabel}
              >
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2.5">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export const WorkflowFloatingPanel = memo(WorkflowFloatingPanelInner);