"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Printer } from "lucide-react";
import toast from "react-hot-toast";

import { MarkdownContent } from "@/components/chat/markdown-content";
import {
  WorksheetLetterheadFooter,
  WorksheetLetterheadHeader,
} from "@/components/chat/worksheet-letterhead";
import { WorksheetPrintTypographyStyles } from "@/components/chat/worksheet-print-typography-styles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { formatPdfPageLabel } from "@/lib/pdf-export";
import { useWorksheetBrandingPrefs } from "@/lib/worksheet-branding-prefs";
import { openWorksheetPrintPreview } from "@/lib/worksheet-print";
import { WORKSHEET_PRINT_PAPER_CLASS } from "@/lib/worksheet-print-typography";
import { cn } from "@/lib/utils";

interface WorksheetPrintPreviewDialogProps {
  open: boolean;
  locale: Locale;
  title: string;
  content: string;
  onClose: () => void;
}

export function WorksheetPrintPreviewDialog({
  open,
  locale,
  title,
  content,
  onClose,
}: WorksheetPrintPreviewDialogProps) {
  const copy = COPY[locale];
  const { prefs } = useWorksheetBrandingPrefs();
  const samplePageLabel = formatPdfPageLabel(1, 3, locale);

  const handlePrint = () => {
    try {
      openWorksheetPrintPreview({
        title,
        content,
        branding: prefs,
        locale,
      });
    } catch {
      toast.error(copy.worksheetPrintPreviewError);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[min(92vh,48rem)] w-full max-w-3xl flex-col"
          >
            <Card className="relative flex min-h-0 flex-1 flex-col shadow-2xl">
              <WorksheetPrintTypographyStyles />
              <CardHeader className="shrink-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Printer className="h-4 w-4 text-primary" />
                  {copy.worksheetPrintPreviewTitle}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {copy.worksheetPrintPreviewDescription}
                </p>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
                <ScrollArea className="min-h-0 flex-1 rounded-xl border bg-muted/20 p-3">
                  <div
                    className={cn(
                      WORKSHEET_PRINT_PAPER_CLASS,
                      "mx-auto max-w-[210mm] rounded-sm border border-[#ddd] bg-white px-[16mm] py-[18mm] text-[#181818]",
                    )}
                  >
                    <WorksheetLetterheadHeader
                      branding={prefs}
                      documentTitle={title}
                      compact
                      className="mb-6"
                    />

                    <MarkdownContent
                      locale={locale}
                      content={content}
                      variant="print"
                    />

                    <WorksheetLetterheadFooter
                      branding={prefs}
                      locale={locale}
                      pageLabel={samplePageLabel}
                      className="mt-8"
                    />
                  </div>
                </ScrollArea>

                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={onClose}
                  >
                    {copy.handoffClose}
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 gap-1.5"
                    onClick={handlePrint}
                  >
                    <Printer className="h-4 w-4" />
                    {copy.worksheetPrint}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}