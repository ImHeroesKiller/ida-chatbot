"use client";

import { Menu } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { IDA_CONFIG } from "@/lib/config";
import { cn } from "@/lib/utils";

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
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between px-4",
      "bg-[#F5F5F7]/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-border/40 shadow-sm"
    )}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-11 w-11 shrink-0 rounded-full transition-all hover:bg-muted/60 active:scale-90"
          aria-label={openSessionsLabel}
          onClick={onOpenMobileSidebar}
        >
          <Menu className="h-7 w-7 text-foreground/70" />
        </Button>

        <p className="truncate text-xl font-extrabold leading-none tracking-tight text-foreground">
          {title || IDA_CONFIG.name}
        </p>
      </div>

      {accountButton ? (
        <div className="origin-right shrink-0 scale-125 pr-1">{accountButton}</div>
      ) : null}
    </header>
  );
}
