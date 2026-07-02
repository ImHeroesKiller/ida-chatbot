"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ToolModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ToolModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  /** If true, clicking backdrop does not close (for complex tools) */
  disableBackdropClose?: boolean;
  /** Size of the modal, defaults to 'lg' */
  size?: ToolModalSize;
  /** Additional classes for the scrollable content area (useful for heavy tools) */
  contentClassName?: string;
}

export function ToolModal({
  open,
  onClose,
  title,
  children,
  className,
  disableBackdropClose = false,
  size = 'lg',
  contentClassName,
}: ToolModalProps) {
  const sizeClasses: Record<ToolModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw] w-[95vw]',
  };

  const bodyPadding = size === 'full' ? 'p-3 sm:p-4' : 'p-4 sm:p-6';

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={disableBackdropClose ? undefined : onClose}
            aria-hidden
          />

          {/* Modal Content - glassmorphism, modern, responsive */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
            className={cn(
              "relative z-10 flex w-full max-h-[92vh] flex-col overflow-hidden rounded-2xl",
              sizeClasses[size],
              size === 'full' ? 'max-h-[95vh]' : '',
              "ida-glass border border-border/40 shadow-2xl",
              "sm:rounded-3xl",
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border/30 bg-muted/10 px-4 py-3 sm:px-5 sm:py-3.5">
              <h2 className="min-w-0 truncate text-base font-semibold tracking-tight text-foreground/90 sm:text-lg">
                {title}
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                aria-label="Close modal"
                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Scrollable Body - tool content goes here */}
            <div className={cn(
              "flex-1 overflow-y-auto overscroll-contain",
              bodyPadding,
              contentClassName
            )}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
