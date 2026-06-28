"use client";

import { Menu, MessageSquarePlus } from "lucide-react";

import { IdaLogo } from "@/components/brand/ida-logo";
import { Button } from "@/components/ui/button";
import { IDA_CONFIG } from "@/lib/config";

interface ChatHeaderProps {
  title: string;
  subtitle: string;
  openSessionsLabel: string;
  newChatLabel: string;
  onOpenMobileSidebar: () => void;
  onNewChat: () => void;
}

export function ChatHeader({
  title,
  subtitle,
  openSessionsLabel,
  newChatLabel,
  onOpenMobileSidebar,
  onNewChat,
}: ChatHeaderProps) {
  return (
    <header className="flex shrink-0 items-center gap-2.5 border-b px-3 py-3 sm:gap-3 sm:px-5">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0 transition-transform hover:scale-105 active:scale-95 md:hidden"
        aria-label={openSessionsLabel}
        onClick={onOpenMobileSidebar}
      >
        <Menu className="h-4 w-4" />
      </Button>

      <IdaLogo size="header" priority />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold tracking-tight">
          {title || IDA_CONFIG.name}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 shrink-0 gap-1.5 px-2.5 text-xs sm:h-9 sm:px-3"
        onClick={onNewChat}
        aria-label={newChatLabel}
        title={newChatLabel}
      >
        <MessageSquarePlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">{newChatLabel}</span>
      </Button>
    </header>
  );
}