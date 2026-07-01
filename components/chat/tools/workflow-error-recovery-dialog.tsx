"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Loader2,
  PlayCircle,
  RefreshCw,
  SkipForward,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import type { WorkflowExecutionCheckpoint } from "@/lib/workflow-execution-state";
import type { WorkflowResumeAction } from "@/lib/workflow-execution-state";
import { WORKSHEET_MODAL_OVERLAY_CLASS } from "@/lib/worksheet-overlay";
import { cn } from "@/lib/utils";

export interface WorkflowErrorRecoveryDialogProps {
  open: boolean;
  locale: Locale;
  checkpoint: WorkflowExecutionCheckpoint | null;
  isSubmitting?: boolean;
  onAction: (action: WorkflowResumeAction, note?: string) => void;
  onClose?: () => void;
}

export function WorkflowErrorRecoveryDialog({
  open,
  locale,
  checkpoint,
  isSubmitting = false,
  onAction,
  onClose,
}: WorkflowErrorRecoveryDialogProps) {
  const copy = COPY[locale];
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setNote("");
  }, [open, checkpoint?.pendingNodeId]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose?.();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && checkpoint ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "fixed inset-0 flex items-center justify-center bg-black/50 p-4",
            WORKSHEET_MODAL_OVERLAY_CLASS,
          )}
          onClick={handleClose}
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
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  {copy.workflowRecoveryTitle}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {copy.workflowRecoveryDescription}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {copy.workflowRecoveryError}
                  </p>
                  <p className="mt-1 text-sm text-destructive">
                    {checkpoint.errorMessage ?? copy.workflowExecuted}
                  </p>
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    {checkpoint.pendingNodeLabel} ({checkpoint.pendingNodeKind})
                    {typeof checkpoint.retryCount === "number" &&
                    typeof checkpoint.maxRetries === "number"
                      ? ` — ${checkpoint.retryCount}/${checkpoint.maxRetries} retries`
                      : null}
                  </p>
                </div>
                {checkpoint.errorSuggestion ? (
                  <div className="rounded-md border bg-muted/20 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {copy.workflowRecoverySuggestion}
                    </p>
                    <p className="mt-1 text-xs text-foreground/90">
                      {checkpoint.errorSuggestion}
                    </p>
                  </div>
                ) : null}
                <div className="space-y-1">
                  <Label htmlFor="workflow-recovery-note" className="text-xs">
                    {copy.workflowApprovalNote}
                  </Label>
                  <Textarea
                    id="workflow-recovery-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={2}
                    disabled={isSubmitting}
                    className="min-h-[3rem] resize-none text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Button
                    type="button"
                    onClick={() => onAction("retry", note.trim() || undefined)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-1.5 h-4 w-4" />
                    )}
                    {copy.workflowRecoveryRetry}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onAction("skip", note.trim() || undefined)}
                    disabled={isSubmitting}
                  >
                    <SkipForward className="mr-1.5 h-4 w-4" />
                    {copy.workflowRecoverySkip}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      onAction("continue", note.trim() || undefined)
                    }
                    disabled={isSubmitting}
                  >
                    <PlayCircle className="mr-1.5 h-4 w-4" />
                    {copy.workflowRecoveryContinue}
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