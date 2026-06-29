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
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex shrink-0 items-center justify-between gap-3 border-b border-border/40 px-4 py-3 sm:px-5 sm:py-3 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 md:hidden hover:bg-muted/60 transition-colors"
          aria-label={openSessionsLabel}
          onClick={onOpenMobileSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="truncate text-base font-semibold tracking-tight"
        >
          {title || IDA_CONFIG.name}
        </motion.p>
      </div>

      {accountButton && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          {accountButton}
        </motion.div>
      )}
    </motion.header>
  );
}
