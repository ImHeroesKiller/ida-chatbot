"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import type { WorkflowExecutionCheckpoint } from "@/lib/workflow-execution-state";
import { WORKSHEET_MODAL_OVERLAY_CLASS } from "@/lib/worksheet-overlay";
import { cn } from "@/lib/utils";

export interface WorkflowApprovalDialogProps {
  open: boolean;
  locale: Locale;
  checkpoint: WorkflowExecutionCheckpoint | null;
  isSubmitting?: boolean;
  onApprove: (note?: string) => void;
  onReject: (note?: string) => void;
  onClose?: () => void;
}

export function WorkflowApprovalDialog({
  open,
  locale,
  checkpoint,
  isSubmitting = false,
  onApprove,
  onReject,
  onClose,
}: WorkflowApprovalDialogProps) {
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

  const prompt =
    checkpoint?.approvalPrompt?.trim() ||
    checkpoint?.pendingNodeLabel ||
    copy.workflowApprovalTitle;

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
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  {copy.workflowApprovalTitle}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {copy.workflowApprovalDescription}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md border bg-muted/20 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {copy.workflowApprovalPrompt}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{prompt}</p>
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    {checkpoint.pendingNodeLabel} ({checkpoint.pendingNodeKind})
                  </p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="workflow-approval-note" className="text-xs">
                    {copy.workflowApprovalNote}
                  </Label>
                  <Textarea
                    id="workflow-approval-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={2}
                    disabled={isSubmitting}
                    className="min-h-[3rem] resize-none text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => onApprove(note.trim() || undefined)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    )}
                    {copy.workflowApprovalApprove}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 text-destructive hover:text-destructive"
                    onClick={() => onReject(note.trim() || undefined)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-1.5 h-4 w-4" />
                    )}
                    {copy.workflowApprovalReject}
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