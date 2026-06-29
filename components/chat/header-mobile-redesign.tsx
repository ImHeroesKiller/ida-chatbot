"use client";

import { Menu } from "lucide-react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { IDA_CONFIG } from "@/lib/config";

interface ChatHeaderMobileRedesignProps {
  title: string;
  openSessionsLabel: string;
  onOpenMobileSidebar: () => void;
  accountButton?: ReactNode;
}

export function ChatHeaderMobileRedesign({
  title,
  openSessionsLabel,
  onOpenMobileSidebar,
  accountButton,
}: ChatHeaderMobileRedesignProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="flex shrink-0 items-center justify-between gap-3 bg-background/80 backdrop-blur-md px-4 py-3 border-b border-border/30 sticky top-0 z-40"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 md:hidden rounded-full hover:bg-muted/50"
          aria-label={openSessionsLabel}
          onClick={onOpenMobileSidebar}
        >
          <Menu className="h-6 w-6 text-foreground/80" />
        </Button>

        <p className="truncate text-lg font-bold tracking-tight text-foreground/90">
          {title || IDA_CONFIG.name}
        </p>
      </div>

      {accountButton && (
        <div className="shrink-0 scale-110 origin-right">
          {accountButton}
        </div>
      )}
    </motion.header>
  );
}
