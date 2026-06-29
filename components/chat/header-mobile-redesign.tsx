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
      className="flex shrink-0 items-center justify-between gap-3 bg-background/95 backdrop-blur-xl px-4 py-4 border-b border-border/40 fixed top-0 left-0 right-0 z-[50] h-[64px]"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-11 w-11 shrink-0 md:hidden rounded-full hover:bg-muted/50 active:scale-90 transition-transform"
          aria-label={openSessionsLabel}
          onClick={onOpenMobileSidebar}
        >
          <Menu className="h-7 w-7 text-foreground" />
        </Button>

        <p className="truncate text-xl font-extrabold tracking-tight text-foreground leading-none">
          {title || IDA_CONFIG.name}
        </p>
      </div>

      {accountButton && (
        <div className="shrink-0 scale-125 origin-right pr-1">
          {accountButton}
        </div>
      )}
    </motion.header>
  );
}
