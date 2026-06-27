"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ScrollToBottomButtonProps {
  visible: boolean;
  locale: Locale;
  onClick: () => void;
}

export function ScrollToBottomButton({
  visible,
  locale,
  onClick,
}: ScrollToBottomButtonProps) {
  const copy = COPY[locale];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.18 }}
          className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2"
        >
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onClick}
            aria-label={copy.scrollToBottom}
            className={cn(
              "pointer-events-auto h-9 gap-1.5 rounded-full border bg-background/95 px-3 shadow-lg backdrop-blur-sm",
              "hover:bg-muted active:scale-95",
            )}
          >
            <ArrowDown className="h-3.5 w-3.5" />
            <span className="text-xs">{copy.scrollToBottom}</span>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}