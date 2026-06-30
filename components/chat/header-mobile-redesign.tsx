"use client";

import { Menu } from "lucide-react";
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
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background px-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-11 w-11 shrink-0 rounded-full transition-transform hover:bg-muted/50 active:scale-90 md:hidden"
          aria-label={openSessionsLabel}
          onClick={onOpenMobileSidebar}
        >
          <Menu className="h-7 w-7 text-foreground" />
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