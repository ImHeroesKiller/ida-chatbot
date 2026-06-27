"use client";

import { motion } from "framer-motion";
import { Lightbulb, Sparkles, Zap } from "lucide-react";

import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ChatEmptyStateProps {
  locale: Locale;
  className?: string;
}

export function ChatEmptyState({ locale, className }: ChatEmptyStateProps) {
  const copy = COPY[locale];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-dashed",
        "bg-gradient-to-br from-primary/5 via-muted/30 to-transparent",
        "px-5 py-8 text-center sm:px-8 sm:py-10",
        "dark:from-primary/10 dark:via-muted/15",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -top-10 left-1/2 h-36 w-36 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex max-w-md flex-col items-center">
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/25 shadow-sm dark:bg-primary/15"
        >
          <Sparkles className="h-7 w-7 text-primary" />
        </motion.div>

        <p className="text-base font-semibold tracking-tight">
          {copy.emptyStateTitle}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {copy.emptyStateSubtitle}
        </p>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {copy.emptyStateHint}
        </p>

        <div className="mt-6 w-full rounded-xl border bg-background/80 p-4 text-left shadow-sm backdrop-blur-sm dark:bg-background/60">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Lightbulb className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            {copy.emptyStateTipsTitle}
          </div>
          <ul className="space-y-2.5">
            {copy.emptyStateTips.map((tip, index) => (
              <motion.li
                key={tip}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.06 }}
                className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground"
              >
                <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
                <span>{tip}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}