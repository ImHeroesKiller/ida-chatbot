"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, X } from "lucide-react";
import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

import { WORKSHEET_FULL_VIEW_OVERLAY_CLASS } from "@/lib/worksheet-overlay";

import { WorksheetPrintTypographyStyles } from "@/components/chat/worksheet-print-typography-styles";
import {
  WorksheetLetterheadFooter,
  WorksheetLetterheadHeader,
} from "@/components/chat/worksheet-letterhead";
import { WorksheetWysiwygEditor } from "@/components/chat/worksheet-wysiwyg-editor";
import { Button } from "@/components/ui/button";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { useWorksheetBrandingPrefs } from "@/lib/worksheet-branding-prefs";
import { formatPrintExportDate } from "@/lib/worksheet-print";
import { WORKSHEET_PRINT_PAPER_CLASS } from "@/lib/worksheet-print-typography";
import { cn } from "@/lib/utils";

interface WorksheetFullViewProps {
  open: boolean;
  locale: Locale;
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onClose: () => void;
}

export function WorksheetFullView({
  open,
  locale,
  title,
  content,
  onTitleChange,
  onContentChange,
  onClose,
}: WorksheetFullViewProps) {
  const copy = COPY[locale];
  const { prefs } = useWorksheetBrandingPrefs();
  const exportDate = formatPrintExportDate(locale);

  const handleContentChange = useCallback(
    (nextContent: string) => {
      onContentChange(nextContent);
    },
    [onContentChange],
  );

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "fixed inset-0 flex flex-col bg-[#e4e4e4]/95 backdrop-blur-sm dark:bg-black/80",
            WORKSHEET_FULL_VIEW_OVERLAY_CLASS,
          )}
          role="dialog"
          aria-modal="true"
          aria-label={copy.worksheetFullViewTitle}
        >
          <WorksheetPrintTypographyStyles />

          <header className="flex shrink-0 items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Maximize2 className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {copy.worksheetFullViewTitle}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {copy.worksheetFullViewDescription}
                </p>
              </div>
            </div>
            <span className="hidden shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary sm:inline">
              {copy.worksheetFullViewBadge}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              {copy.worksheetExitFullView}
            </Button>
          </header>

          <ScrollArea className="min-h-0 flex-1">
            <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
              <div className="mb-4 sm:hidden">
                <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary">
                  {copy.worksheetFullViewBadge}
                </span>
              </div>

              <div
                className={cn(
                  WORKSHEET_PRINT_PAPER_CLASS,
                  "mx-auto w-full max-w-[210mm] rounded-sm border border-[#ddd] bg-white",
                  "px-[16mm] py-[18mm] text-[#181818]",
                )}
              >
                <WorksheetLetterheadHeader
                  branding={prefs}
                  documentTitle={title}
                  titleEditable
                  onTitleChange={onTitleChange}
                  titleAriaLabel={copy.worksheetTitleLabel}
                  className="mb-7"
                />

                <WorksheetWysiwygEditor
                  locale={locale}
                  value={content}
                  onChange={handleContentChange}
                  variant="print"
                  toolbarSticky
                />

                <WorksheetLetterheadFooter
                  branding={prefs}
                  locale={locale}
                  exportDate={exportDate}
                  className="mt-10"
                />
              </div>

              <p className="mt-5 text-center text-[11px] text-muted-foreground">
                {copy.worksheetFullViewShortcutHint}
              </p>
            </div>
          </ScrollArea>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}