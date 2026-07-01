"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LayoutTemplate } from "lucide-react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { WORKSHEET_MODAL_OVERLAY_CLASS } from "@/lib/worksheet-overlay";
import { cn } from "@/lib/utils";
import type { WorkflowTemplateApplyMode } from "@/lib/workflow";

export interface WorkflowTemplateApplyDialogProps {
  open: boolean;
  locale: Locale;
  templateTitle: string;
  hasActiveWorkflow: boolean;
  onApply: (mode: WorkflowTemplateApplyMode) => void;
  onClose: () => void;
}

export function WorkflowTemplateApplyDialog({
  open,
  locale,
  templateTitle,
  hasActiveWorkflow,
  onApply,
  onClose,
}: WorkflowTemplateApplyDialogProps) {
  const copy = COPY[locale];

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "fixed inset-0 flex items-center justify-center bg-black/50 p-4",
            WORKSHEET_MODAL_OVERLAY_CLASS,
          )}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md"
          >
            <Card className="shadow-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <LayoutTemplate className="h-4 w-4 text-primary" />
                  {copy.workflowTemplateApplyTitle}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {copy.workflowTemplateApplyDescription}
                </p>
                <p className="text-sm font-medium">{templateTitle}</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {hasActiveWorkflow ? (
                  <Button
                    type="button"
                    onClick={() => onApply("replace")}
                  >
                    {copy.workflowTemplateApplyReplace}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant={hasActiveWorkflow ? "outline" : "default"}
                  onClick={() => onApply("append")}
                >
                  {copy.workflowTemplateApplyAppend}
                </Button>
                <Button type="button" variant="ghost" onClick={onClose}>
                  {copy.handoffClose}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}