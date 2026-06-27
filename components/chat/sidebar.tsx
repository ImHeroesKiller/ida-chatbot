"use client";

import { MessageSquarePlus, MessagesSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatSession } from "@/lib/chat-store";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentChatId: string;
  locale: Locale;
  onSelect: (chatId: string) => void;
  onNewChat: () => void;
  className?: string;
}

function formatSessionTime(timestamp: number, locale: Locale): string {
  const localeTag =
    locale === "zh" ? "zh-CN" : locale === "en" ? "en-US" : "id-ID";

  return new Intl.DateTimeFormat(localeTag, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function ChatSidebar({
  sessions,
  currentChatId,
  locale,
  onSelect,
  onNewChat,
  className,
}: ChatSidebarProps) {
  const copy = COPY[locale];

  return (
    <aside
      className={cn("flex h-full w-full flex-col bg-muted/20", className)}
      aria-label={copy.sessionsLabel}
    >
      <div className="border-b p-2.5">
        <Button
          type="button"
          size="sm"
          className="h-8 w-full justify-start gap-2 text-xs"
          onClick={onNewChat}
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          {copy.newChat}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-0.5 p-2">
          {sessions.length === 0 ? (
            <p className="px-2 py-4 text-center text-[11px] text-muted-foreground">
              {copy.noSessions}
            </p>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === currentChatId;

              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => onSelect(session.id)}
                  className={cn(
                    "flex w-full flex-col items-start gap-0.5 rounded-xl px-2.5 py-2 text-left transition-colors",
                    isActive
                      ? "bg-primary/10 text-foreground ring-1 ring-primary/20"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <span className="flex w-full items-center gap-1.5">
                    <MessagesSquare className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate text-xs font-medium">
                      {session.title}
                    </span>
                  </span>
                  <span className="pl-5 text-[10px] text-muted-foreground">
                    {formatSessionTime(session.updatedAt, locale)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}