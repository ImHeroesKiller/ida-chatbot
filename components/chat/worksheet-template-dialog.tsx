"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ClipboardList,
  FileText,
  LayoutTemplate,
  Mail,
  Presentation,
  ScrollText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import {
  getWorksheetTemplates,
  type WorksheetTemplate,
} from "@/lib/worksheet-templates";
import { cn } from "@/lib/utils";

const TEMPLATE_ICONS = {
  proposal: Presentation,
  report: ScrollText,
  letter: Mail,
  meeting: FileText,
  brief: LayoutTemplate,
  checklist: ClipboardList,
} as const;

interface WorksheetTemplateDialogProps {
  open: boolean;
  locale: Locale;
  onSelect: (template: WorksheetTemplate) => void;
  onClose: () => void;
}

export function WorksheetTemplateDialog({
  open,
  locale,
  onSelect,
  onClose,
}: WorksheetTemplateDialogProps) {
  const copy = COPY[locale];
  const templates = getWorksheetTemplates(locale);

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
            className="w-full max-w-lg"
          >
            <Card className="shadow-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <LayoutTemplate className="h-4 w-4 text-primary" />
                  {copy.worksheetTemplatesTitle}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {copy.worksheetTemplatesDescription}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <ScrollArea className="max-h-[min(60vh,26rem)] pr-2">
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {templates.map((template) => {
                      const Icon = TEMPLATE_ICONS[template.icon];
                      return (
                        <li key={template.id}>
                          <button
                            type="button"
                            onClick={() => onSelect(template)}
                            className={cn(
                              "flex h-full w-full flex-col rounded-xl border bg-card p-3 text-left shadow-sm transition-colors",
                              "hover:border-primary/40 hover:bg-muted/30",
                            )}
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Icon className="h-4 w-4" />
                              </span>
                              <span className="text-sm font-medium">
                                {template.title[locale]}
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                              {template.description[locale]}
                            </p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </ScrollArea>

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
    </AnimatePresence>
  );
}