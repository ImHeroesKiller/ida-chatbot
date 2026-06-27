"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Copy, X } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChatContext } from "@/components/chat/chat-provider";
import { COPY } from "@/lib/i18n";

export function HandoffDialog() {
  const { locale, handoffPrefill, closeHandoff } = useChatContext();
  const copy = COPY[locale];

  const handleCopy = async () => {
    if (!handoffPrefill) return;

    const text = `Topic: ${handoffPrefill.topic}\n\n${handoffPrefill.description}`;

    try {
      await navigator.clipboard.writeText(text);
      toast.success(
        locale === "id"
          ? "Ringkasan disalin"
          : locale === "zh"
            ? "摘要已复制"
            : "Summary copied",
      );
    } catch {
      toast.error(copy.errors.generic);
    }
  };

  return (
    <AnimatePresence>
      {handoffPrefill && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={closeHandoff}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
          >
            <Card className="w-full max-w-md shadow-2xl">
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <CardTitle className="text-base">{copy.handoffTitle}</CardTitle>
                <button
                  type="button"
                  onClick={closeHandoff}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                  aria-label={copy.handoffClose}
                >
                  <X className="h-4 w-4" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    {copy.handoffTopic}
                  </p>
                  <p className="rounded-lg bg-muted px-3 py-2 text-sm capitalize">
                    {handoffPrefill.topic}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    {copy.handoffDescription}
                  </p>
                  <p className="max-h-48 overflow-y-auto rounded-lg bg-muted px-3 py-2 text-sm whitespace-pre-wrap">
                    {handoffPrefill.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCopy}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {copy.handoffCopy}
                  </Button>
                  <Button className="flex-1" onClick={closeHandoff}>
                    {copy.handoffClose}
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