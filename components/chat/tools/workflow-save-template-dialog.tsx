"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookmarkPlus, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import type { WorkflowDefinition } from "@/lib/workflow";
import { WORKSHEET_MODAL_OVERLAY_CLASS } from "@/lib/worksheet-overlay";
import { cn } from "@/lib/utils";

export interface WorkflowSaveTemplateDialogProps {
  open: boolean;
  locale: Locale;
  workflow: WorkflowDefinition | null;
  onClose: () => void;
  onSaved?: () => void;
}

export function WorkflowSaveTemplateDialog({
  open,
  locale,
  workflow,
  onClose,
  onSaved,
}: WorkflowSaveTemplateDialogProps) {
  const copy = COPY[locale];
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(workflow?.name ?? "");
  }, [open, workflow?.name]);

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const handleSave = async () => {
    if (!workflow) return;
    if (!name.trim()) {
      toast.error(copy.workflowTemplateSaveNameRequired);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/workflow/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: workflow.description,
          category: "custom",
          definition: {
            name: name.trim(),
            description: workflow.description,
            nodes: workflow.nodes,
            edges: workflow.edges,
          },
        }),
      });

      if (response.status === 401) {
        toast.error(copy.workflowTemplateSaveAuthRequired);
        return;
      }

      if (!response.ok) {
        toast.error(copy.workflowTemplateSaveFailed);
        return;
      }

      toast.success(copy.workflowTemplateSaved);
      onSaved?.();
      onClose();
    } catch {
      toast.error(copy.workflowTemplateSaveFailed);
    } finally {
      setSaving(false);
    }
  };

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
                  <BookmarkPlus className="h-4 w-4 text-primary" />
                  {copy.workflowTemplateSaveTitle}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {copy.workflowTemplateSaveDescription}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="workflow-template-name" className="text-xs">
                    {copy.workflowTemplateSaveName}
                  </Label>
                  <Input
                    id="workflow-template-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="h-9 text-sm"
                    disabled={saving || !workflow}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => void handleSave()}
                    disabled={saving || !workflow}
                  >
                    {saving ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : null}
                    {copy.workflowTemplateSave}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={saving}
                  >
                    {copy.handoffClose}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}