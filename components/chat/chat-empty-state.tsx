"use client";

import { motion } from "framer-motion";

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
        "rounded-2xl border border-dashed bg-muted/20 px-4 py-6 text-center sm:px-8 sm:py-10",
        "dark:bg-muted/10",
        className,
      )}
    >
      <div className="mx-auto flex max-w-md flex-col items-center">
        <p className="text-base font-semibold tracking-tight">
          {copy.emptyStateTitle}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {copy.emptyStateSubtitle}
        </p>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {copy.emptyStateHint}
        </p>

        <div className="mt-5 w-full rounded-xl border bg-background/80 p-4 text-left dark:bg-background/60">
          <p className="mb-3 text-xs font-medium text-muted-foreground">
            {copy.emptyStateTipsTitle}
          </p>
          <ul className="space-y-2">
            {copy.emptyStateTips.map((tip, index) => (
              <motion.li
                key={tip}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.06 }}
                className="text-sm leading-relaxed text-muted-foreground"
              >
                {tip}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}