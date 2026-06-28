"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { WORKSHEET_MODAL_OVERLAY_CLASS } from "@/lib/worksheet-overlay";
import { cn } from "@/lib/utils";

interface WorksheetConfirmDialogProps {
  open: boolean;
  locale: Locale;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function WorksheetConfirmDialog({
  open,
  locale,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: WorksheetConfirmDialogProps) {
  const copy = COPY[locale];

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        event.preventDefault();
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, onCancel, open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "fixed inset-0 flex items-center justify-center bg-black/50 p-4",
            WORKSHEET_MODAL_OVERLAY_CLASS,
          )}
          onClick={() => {
            if (!loading) onCancel();
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="worksheet-confirm-title"
            aria-describedby="worksheet-confirm-description"
          >
            <Card className="shadow-2xl">
              <CardHeader className="border-b pb-3">
                <CardTitle
                  id="worksheet-confirm-title"
                  className="flex items-center gap-2 text-base"
                >
                  <AlertTriangle
                    className={cn(
                      "h-4 w-4",
                      destructive ? "text-destructive" : "text-amber-500",
                    )}
                  />
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 py-4">
                <p
                  id="worksheet-confirm-description"
                  className="text-sm leading-relaxed text-muted-foreground"
                >
                  {description}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={onCancel}
                    disabled={loading}
                  >
                    {cancelLabel ?? copy.worksheetCancel}
                  </Button>
                  <Button
                    type="button"
                    variant={destructive ? "destructive" : "default"}
                    className="flex-1 gap-1.5"
                    onClick={onConfirm}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    {confirmLabel}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}