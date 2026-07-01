"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import type { PdfOrientation, PdfPaperFormat } from "@/lib/pdf-export";
import { WORKSHEET_MODAL_OVERLAY_CLASS } from "@/lib/worksheet-overlay";
import { cn } from "@/lib/utils";

export interface WorksheetPdfExportSettings {
  paper: PdfPaperFormat;
  orientation: PdfOrientation;
  includeBranding: boolean;
  showPageNumbers: boolean;
  showExportDate: boolean;
}

export interface WorksheetExportDialogProps {
  open: boolean;
  locale: Locale;
  isExporting?: boolean;
  onConfirm: (settings: WorksheetPdfExportSettings) => void;
  onCancel: () => void;
}

function BrandingToggle({
  id,
  label,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-3.5 w-3.5 rounded border-input"
      />
      <span>{label}</span>
    </label>
  );
}

export function WorksheetExportDialog({
  open,
  locale,
  isExporting = false,
  onConfirm,
  onCancel,
}: WorksheetExportDialogProps) {
  const copy = COPY[locale];
  const [paper, setPaper] = useState<PdfPaperFormat>("a4");
  const [orientation, setOrientation] = useState<PdfOrientation>("portrait");
  const [includeBranding, setIncludeBranding] = useState(true);
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const [showExportDate, setShowExportDate] = useState(true);

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
          onClick={isExporting ? undefined : onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
          >
            <Card className="w-full max-w-sm shadow-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-primary" />
                  {copy.worksheetExportPdfTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="worksheet-pdf-paper" className="text-xs">
                    {copy.worksheetExportPdfPaper}
                  </Label>
                  <select
                    id="worksheet-pdf-paper"
                    value={paper}
                    disabled={isExporting}
                    onChange={(event) =>
                      setPaper(event.target.value as PdfPaperFormat)
                    }
                    className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="a4">{copy.worksheetExportPdfPaperA4}</option>
                    <option value="letter">
                      {copy.worksheetExportPdfPaperLetter}
                    </option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="worksheet-pdf-orientation" className="text-xs">
                    {copy.worksheetExportPdfOrientation}
                  </Label>
                  <select
                    id="worksheet-pdf-orientation"
                    value={orientation}
                    disabled={isExporting}
                    onChange={(event) =>
                      setOrientation(event.target.value as PdfOrientation)
                    }
                    className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="portrait">
                      {copy.worksheetExportPdfPortrait}
                    </option>
                    <option value="landscape">
                      {copy.worksheetExportPdfLandscape}
                    </option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">
                    {copy.worksheetExportPdfBranding}
                  </Label>
                  <div className="space-y-2">
                    <BrandingToggle
                      id="worksheet-pdf-branding"
                      label={copy.worksheetExportPdfIncludeBranding}
                      checked={includeBranding}
                      disabled={isExporting}
                      onChange={setIncludeBranding}
                    />
                    <BrandingToggle
                      id="worksheet-pdf-page-numbers"
                      label={copy.worksheetExportPdfPageNumbers}
                      checked={showPageNumbers}
                      disabled={isExporting || !includeBranding}
                      onChange={setShowPageNumbers}
                    />
                    <BrandingToggle
                      id="worksheet-pdf-export-date"
                      label={copy.worksheetExportPdfExportDate}
                      checked={showExportDate}
                      disabled={isExporting || !includeBranding}
                      onChange={setShowExportDate}
                    />
                  </div>
                </div>

                {isExporting ? (
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {copy.worksheetExportPdfGenerating}
                  </p>
                ) : null}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={isExporting}
                    onClick={onCancel}
                  >
                    {copy.worksheetCancel}
                  </Button>
                  <Button
                    className="flex-1 gap-1.5"
                    disabled={isExporting}
                    onClick={() =>
                      onConfirm({
                        paper,
                        orientation,
                        includeBranding,
                        showPageNumbers,
                        showExportDate,
                      })
                    }
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    {copy.worksheetExportPdf}
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