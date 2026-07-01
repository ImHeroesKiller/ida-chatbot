"use client";

import { motion } from "framer-motion";
import { IdaLogo } from "@/components/brand/ida-logo";

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
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "flex w-full flex-col items-center justify-center px-6 text-center",
        className,
      )}
    >
      <div className="mb-7">
        <IdaLogo size="lg" className="h-20 w-20 opacity-20 grayscale" />
      </div>

      <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-foreground/80">
        {copy.emptyStateTitle}
      </h1>
      <p className="mx-auto max-w-sm text-lg leading-relaxed font-medium text-muted-foreground">
        {copy.emptyStateSubtitle}
      </p>
    </motion.div>
  );
}