"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import type { Locale } from "@/lib/config";
import { cn } from "@/lib/utils";

const TYPING_LABEL: Record<Locale, string> = {
  id: "IDA sedang mengetik",
  en: "IDA is typing",
  zh: "IDA 正在输入",
};

interface TypingIndicatorProps {
  locale: Locale;
  className?: string;
}

export function TypingIndicator({ locale, className }: TypingIndicatorProps) {
  return (
    <div
      className={cn("flex w-full items-start gap-3", className)}
      role="status"
      aria-live="polite"
      aria-label={TYPING_LABEL[locale]}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/15 dark:bg-primary/15">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden />
      </div>

      <div className="rounded-2xl rounded-bl-md border bg-card px-4 py-3 shadow-sm dark:border-border/80">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((index) => (
            <motion.span
              key={index}
              className="h-2 w-2 rounded-full bg-primary/70"
              animate={{ y: [0, -4, 0], opacity: [0.45, 1, 0.45] }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                delay: index * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}