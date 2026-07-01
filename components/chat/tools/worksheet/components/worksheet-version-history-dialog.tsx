"use client";

import { AnimatePresence, motion } from "framer-motion";
import { History, RotateCcw } from "lucide-react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import {
  formatWorksheetVersionTime,
  worksheetVersionPreview,
  type WorksheetVersion,
  type WorksheetVersionSource,
} from "@/lib/worksheet";
import { WORKSHEET_MODAL_OVERLAY_CLASS } from "@/lib/worksheet-overlay";
import { cn } from "@/lib/utils";

export interface WorksheetVersionHistoryDialogProps {
  open: boolean;
  locale: Locale;
  versions: WorksheetVersion[];
  onRestore: (versionId: string) => void;
  onClose: () => void;
}

function sourceLabel(
  source: WorksheetVersionSource,
  copy: (typeof COPY)[Locale],
): string {
  switch (source) {
    case "generated":
      return copy.worksheetHistoryGenerated;
    case "manual_save":
      return copy.worksheetHistoryManualSave;
    case "restored":
      return copy.worksheetHistoryRestored;
    case "template":
      return copy.worksheetHistoryTemplate;
    default:
      return copy.worksheetHistoryManualSave;
  }
}

export function WorksheetVersionHistoryDialog({
  open,
  locale,
  versions,
  onRestore,
  onClose,
}: WorksheetVersionHistoryDialogProps) {
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
                  <History className="h-4 w-4 text-primary" />
                  {copy.worksheetHistoryTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {versions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {copy.worksheetHistoryEmpty}
                  </p>
                ) : (
                  <ScrollArea className="max-h-[min(60vh,24rem)] pr-2">
                    <ul className="space-y-2">
                      {versions.map((version, index) => (
                        <li
                          key={version.id}
                          className={cn(
                            "rounded-xl border bg-card p-3 shadow-sm",
                            index === 0 && "border-primary/30",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {version.title || copy.worksheetEmptyTitle}
                              </p>
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                {formatWorksheetVersionTime(
                                  version.createdAt,
                                  locale,
                                )}
                              </p>
                              <span className="mt-1 inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                {sourceLabel(version.source, copy)}
                              </span>
                              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                {worksheetVersionPreview(version.content)}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 shrink-0 gap-1 text-xs"
                              onClick={() => onRestore(version.id)}
                            >
                              <RotateCcw className="h-3 w-3" />
                              {copy.worksheetHistoryRestore}
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                )}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={onClose}
                >
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