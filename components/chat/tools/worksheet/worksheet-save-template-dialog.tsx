"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookmarkPlus, ExternalLink, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

import { MarkdownContent } from "@/components/chat/markdown-content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import type { WorksheetBrandingConfig } from "@/lib/worksheet-branding-config";
import { summarizeWorksheetContent } from "@/lib/worksheet-workspace";
import { WORKSHEET_MODAL_OVERLAY_CLASS } from "@/lib/worksheet-overlay";
import { cn } from "@/lib/utils";

type SaveTemplateMode = "branding_only" | "branding_and_structure";
type DialogStep = "form" | "confirm";

interface WorksheetSaveTemplateDialogProps {
  open: boolean;
  locale: Locale;
  defaultName: string;
  branding: WorksheetBrandingConfig;
  sampleContent: string;
  onClose: () => void;
  onSaved?: () => void;
}

async function checkAdminAccess(): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/me", { cache: "no-store" });
    if (!response.ok) return false;
    const data = (await response.json()) as {
      configured?: boolean;
      authenticated?: boolean;
    };
    return Boolean(data.configured && data.authenticated);
  } catch {
    return false;
  }
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
  const [saveMode, setSaveMode] =
    useState<SaveTemplateMode>("branding_and_structure");
  const [step, setStep] = useState<DialogStep>("form");
  const [saving, setSaving] = useState(false);
  const [canViewAdmin, setCanViewAdmin] = useState(false);

  const previewSnippet = useMemo(
    () => summarizeWorksheetContent(sampleContent, 220),
    [sampleContent],
  );

  useEffect(() => {
    if (!open) return;
    setName(defaultName);
    setSaveMode("branding_and_structure");
    setStep("form");
    void checkAdminAccess().then(setCanViewAdmin);
  }, [defaultName, open]);

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const handleContinue = () => {
    if (!name.trim()) {
      toast.error(copy.worksheetSaveTemplateNameRequired);
      return;
    }
    setStep("confirm");
  };

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
          sampleContent:
            saveMode === "branding_and_structure"
              ? sampleContent.trim() || undefined
              : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save template.");
      }

      window.dispatchEvent(new Event("ida:letterhead-templates-changed"));
      onSaved?.();

      const savedName = name.trim();
      toast.success(
        (toastInstance) => (
          <div className="flex max-w-sm flex-col gap-2.5">
            <p className="text-sm font-medium leading-snug">
              {copy.worksheetSaveTemplateSuccessNamed.replace(
                "{name}",
                savedName,
              )}
            </p>
            {canViewAdmin ? (
              <Link
                href="/admin"
                onClick={() => toast.dismiss(toastInstance.id)}
                className="inline-flex h-7 w-fit items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium hover:bg-muted"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {copy.worksheetSaveTemplateViewInAdmin}
              </Link>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                {copy.worksheetSaveTemplateSuccess}
              </p>
            )}
          </div>
        ),
        { duration: 6000 },
      );

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
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg"
          >
            <Card className="max-h-[min(90vh,720px)] overflow-hidden shadow-2xl">
              <CardHeader className="border-b pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookmarkPlus className="h-4 w-4 text-primary" />
                  {step === "form"
                    ? copy.worksheetSaveTemplateTitle
                    : copy.worksheetSaveTemplateConfirmTitle}
                </CardTitle>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {step === "form"
                    ? copy.worksheetSaveTemplateDescription
                    : copy.worksheetSaveTemplateConfirmDescription}
                </p>
              </CardHeader>

              <CardContent className="max-h-[calc(min(90vh,720px)-7rem)] space-y-4 overflow-y-auto py-4">
                {step === "form" ? (
                  <>
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

                    <div className="space-y-2">
                      <Label className="text-xs">
                        {copy.worksheetSaveTemplateSaveTypeLabel}
                      </Label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setSaveMode("branding_only")}
                          className={cn(
                            "rounded-xl border p-3 text-left transition-colors",
                            saveMode === "branding_only"
                              ? "border-primary/40 bg-primary/5 ring-1 ring-primary/15"
                              : "hover:border-primary/20 hover:bg-muted/30",
                          )}
                        >
                          <p className="text-xs font-semibold">
                            {copy.worksheetSaveTemplateBrandingOnly}
                          </p>
                          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                            {copy.worksheetSaveTemplateBrandingOnlyHint}
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSaveMode("branding_and_structure")}
                          className={cn(
                            "rounded-xl border p-3 text-left transition-colors",
                            saveMode === "branding_and_structure"
                              ? "border-primary/40 bg-primary/5 ring-1 ring-primary/15"
                              : "hover:border-primary/20 hover:bg-muted/30",
                          )}
                        >
                          <p className="text-xs font-semibold">
                            {copy.worksheetSaveTemplateBrandingAndStructure}
                          </p>
                          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                            {copy.worksheetSaveTemplateBrandingAndStructureHint}
                          </p>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">
                        {copy.worksheetSaveTemplatePreviewLabel}
                      </Label>
                      <div className="rounded-xl border bg-muted/20 p-3">
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                          {name.trim() || copy.worksheetSaveTemplateNamePlaceholder}
                        </div>
                        {saveMode === "branding_and_structure" && previewSnippet ? (
                          <MarkdownContent
                            locale={locale}
                            content={previewSnippet}
                            className="chat-text max-h-36 overflow-hidden text-xs text-muted-foreground [&_*]:text-xs"
                          />
                        ) : (
                          <p className="text-[11px] leading-relaxed text-muted-foreground">
                            {copy.worksheetSaveTemplateBrandingOnlyHint}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3 rounded-xl border bg-muted/15 p-4 text-sm">
                    <div>
                      <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                        {copy.worksheetSaveTemplateNameLabel}
                      </p>
                      <p className="mt-1 font-medium">{name.trim()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                        {copy.worksheetSaveTemplateSaveTypeLabel}
                      </p>
                      <p className="mt-1 text-sm">
                        {saveMode === "branding_only"
                          ? copy.worksheetSaveTemplateBrandingOnly
                          : copy.worksheetSaveTemplateBrandingAndStructure}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  {step === "form" ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={handleClose}
                        disabled={saving}
                      >
                        {copy.worksheetCancel}
                      </Button>
                      <Button
                        type="button"
                        className="flex-1 gap-1.5"
                        onClick={handleContinue}
                        disabled={saving}
                      >
                        {copy.worksheetSaveTemplateReviewAction}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setStep("form")}
                        disabled={saving}
                      >
                        {copy.worksheetSaveTemplateBack}
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
                        {copy.worksheetSaveTemplateConfirmAction}
                      </Button>
                    </>
                  )}
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