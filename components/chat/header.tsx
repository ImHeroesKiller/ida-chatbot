"use client";

import { Menu, MessageSquarePlus } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { IDA_CONFIG } from "@/lib/config";

interface ChatHeaderProps {
  title: string;
  subtitle: string;
  openSessionsLabel: string;
  newChatLabel: string;
  onOpenMobileSidebar: () => void;
  onNewChat: () => void;
  accountButton?: ReactNode;
}

export function ChatHeader({
  title,
  subtitle,
  openSessionsLabel,
  newChatLabel,
  onOpenMobileSidebar,
  onNewChat,
  accountButton,
}: ChatHeaderProps) {
  return (
    <header className="flex shrink-0 items-center gap-2 border-b px-2.5 py-2.5 sm:gap-3 sm:px-5 sm:py-3">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-10 w-10 shrink-0 md:hidden"
        aria-label={openSessionsLabel}
        onClick={onOpenMobileSidebar}
      >
        <Menu className="h-4 w-4" />
      </Button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold tracking-tight">
          {title || IDA_CONFIG.name}
        </p>
        <p className="hidden truncate text-[11px] text-muted-foreground sm:block">
          {subtitle}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0 sm:h-9 sm:w-auto sm:gap-1.5 sm:px-3"
          onClick={onNewChat}
          aria-label={newChatLabel}
          title={newChatLabel}
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span className="hidden sm:inline">{newChatLabel}</span>
        </Button>
        {accountButton}
      </div>
    </header>
  );
}