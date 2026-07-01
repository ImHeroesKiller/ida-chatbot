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
    <div className={cn("flex flex-col items-center justify-center pt-20 pb-10", className)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="mb-8"
      >
        <IdaLogo size="lg" className="h-20 w-20 opacity-20 grayscale" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="text-center px-6"
      >
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground/80 mb-3">
          {copy.emptyStateTitle}
        </h1>
        <p className="text-lg font-medium text-muted-foreground max-w-sm mx-auto leading-relaxed">
          {copy.emptyStateSubtitle}
        </p>
      </motion.div>
    </div>
  );
}
