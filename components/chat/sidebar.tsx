"use client";

import {
  ChevronLeft,
  ChevronRight,
  MessageSquarePlus,
  MessagesSquare,
} from "lucide-react";

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
  expanded?: boolean;
  onToggleExpanded?: () => void;
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
  expanded = true,
  onToggleExpanded,
  className,
}: ChatSidebarProps) {
  const copy = COPY[locale];

  return (
    <aside
      className={cn(
        "flex h-full flex-col overflow-hidden bg-muted/20 transition-[width] duration-200 ease-in-out",
        expanded ? "w-[260px]" : "w-14",
        className,
      )}
      aria-label={copy.sessionsLabel}
    >
      <div className="shrink-0 border-b p-2">
        <Button
          type="button"
          size="sm"
          className={cn(
            "h-9 text-xs",
            expanded
              ? "w-full justify-start gap-2"
              : "w-full justify-center px-0",
          )}
          onClick={onNewChat}
          title={copy.newChat}
        >
          <MessageSquarePlus className="h-4 w-4 shrink-0" />
          {expanded && <span>{copy.newChat}</span>}
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className={cn("space-y-0.5", expanded ? "p-2" : "p-1.5")}>
          {sessions.length === 0 ? (
            expanded ? (
              <p className="px-2 py-4 text-center text-[11px] text-muted-foreground">
                {copy.noSessions}
              </p>
            ) : null
          ) : (
            sessions.map((session) => {
              const isActive = session.id === currentChatId;

              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => onSelect(session.id)}
                  title={session.title}
                  className={cn(
                    "flex w-full transition-colors",
                    expanded
                      ? "flex-col items-start gap-0.5 rounded-xl px-2.5 py-2 text-left"
                      : "items-center justify-center rounded-xl p-2",
                    isActive
                      ? "bg-primary/10 text-foreground ring-1 ring-primary/20"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center",
                      expanded ? "w-full gap-1.5" : "justify-center",
                    )}
                  >
                    <MessagesSquare className="h-4 w-4 shrink-0" />
                    {expanded && (
                      <span className="truncate text-xs font-medium">
                        {session.title}
                      </span>
                    )}
                  </span>
                  {expanded && (
                    <span className="pl-5 text-[10px] text-muted-foreground">
                      {formatSessionTime(session.updatedAt, locale)}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>

      {onToggleExpanded && (
        <div className="shrink-0 border-t p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 text-xs text-muted-foreground",
              expanded ? "w-full justify-start gap-2" : "w-full justify-center px-0",
            )}
            onClick={onToggleExpanded}
            aria-label={expanded ? copy.collapseSidebar : copy.expandSidebar}
            title={expanded ? copy.collapseSidebar : copy.expandSidebar}
          >
            {expanded ? (
              <>
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span>{copy.collapseSidebar}</span>
              </>
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
          </Button>
        </div>
      )}
    </aside>
  );
}