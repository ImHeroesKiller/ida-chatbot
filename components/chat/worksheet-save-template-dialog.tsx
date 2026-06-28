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
import type { WorksheetBrandingConfig } from "@/lib/worksheet-branding-config";
import { WORKSHEET_MODAL_OVERLAY_CLASS } from "@/lib/worksheet-overlay";
import { cn } from "@/lib/utils";

interface WorksheetSaveTemplateDialogProps {
  open: boolean;
  locale: Locale;
  defaultName: string;
  branding: WorksheetBrandingConfig;
  sampleContent: string;
  onClose: () => void;
  onSaved?: () => void;
}

export function WorksheetSaveTemplateDialog({
  open,
  locale,
  defaultName,
  branding,
  sampleContent,
  onClose,
  onSaved,
}: WorksheetSaveTemplateDialogProps) {
  const copy = COPY[locale];
  const [name, setName] = useState(defaultName);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setName(defaultName);
  }, [defaultName, open]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(copy.worksheetSaveTemplateNameRequired);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/worksheet/save-letterhead-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          brandingConfig: branding,
          sampleContent: sampleContent.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save template.");
      }

      toast.success(copy.worksheetSaveTemplateSuccess);
      onSaved?.();
      onClose();
    } catch {
      toast.error(copy.worksheetSaveTemplateError);
    } finally {
      setSaving(false);
    }
  };

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
          onClick={saving ? undefined : onClose}
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
                  {copy.worksheetSaveTemplateTitle}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {copy.worksheetSaveTemplateDescription}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="worksheet-template-name" className="text-xs">
                    {copy.worksheetSaveTemplateNameLabel}
                  </Label>
                  <Input
                    id="worksheet-template-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={copy.worksheetSaveTemplateNamePlaceholder}
                    className="h-9 text-sm"
                    disabled={saving}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={onClose}
                    disabled={saving}
                  >
                    {copy.worksheetCancel}
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 gap-1.5"
                    onClick={() => void handleSave()}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <BookmarkPlus className="h-4 w-4" />
                    )}
                    {copy.worksheetSaveTemplateAction}
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