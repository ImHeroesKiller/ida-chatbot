"use client";

import Link from "next/link";
import {
  MessagesSquare,
  MoreHorizontal,
  PanelLeftClose,
  Pin,
  Search,
  Trash2,
  Pencil,
  PinOff,
  Inbox,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { IdaLogo } from "@/components/brand/ida-logo";
import { SidebarNav } from "@/components/chat/sidebar-nav";
import { ConfirmDialog } from "@/components/chat/confirm-dialog";
import { RenameDialog } from "@/components/chat/rename-dialog";
import { SidebarSettings } from "@/components/chat/sidebar-settings";
import { SidebarSkeleton } from "@/components/chat/sidebar-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatSession } from "@/lib/chat-store";
import type { Locale } from "@/lib/config";
import { IDA_CONFIG } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentChatId: string;
  locale: Locale;
  loading?: boolean;
  onSelect: (chatId: string) => void;
  onPin: (chatId: string, pinned: boolean) => void;
  onRename: (chatId: string, title: string) => void;
  onDelete: (chatId: string) => void;
  onClearAll: () => void;
  expanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
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
  loading = false,
  onSelect,
  onPin,
  onRename,
  onDelete,
  onClearAll,
  expanded = true,
  onExpand,
  onCollapse,
  className,
}: ChatSidebarProps) {
  const copy = COPY[locale];
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<ChatSession | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredSessions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sessions;
    return sessions.filter((session) =>
      session.title.toLowerCase().includes(query),
    );
  }, [sessions, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const deleteTarget = deleteTargetId
    ? sessions.find((session) => session.id === deleteTargetId)
    : null;

  if (loading) {
    return (
      <aside
        className={cn(
          "flex h-full flex-col bg-muted/20 transition-[width] duration-200 ease-in-out dark:bg-muted/10",
          expanded ? "w-[260px] overflow-hidden" : "w-14 overflow-x-visible overflow-y-hidden",
          className,
        )}
        aria-label={copy.sessionsLabel}
        aria-busy="true"
      >
        <SidebarSkeleton expanded={expanded} />
      </aside>
    );
  }

  return (
    <>
      <aside
        className={cn(
          "flex h-full flex-col bg-muted/20 transition-[width] duration-200 ease-in-out dark:bg-muted/10",
          expanded ? "w-[260px] overflow-hidden" : "w-14 overflow-x-visible overflow-y-hidden",
          className,
        )}
        aria-label={copy.sessionsLabel}
      >
        <div className="sticky top-0 z-10 shrink-0 border-b bg-muted/20 backdrop-blur-sm dark:bg-muted/10">
          <div
            className={cn(
              "flex items-center border-b border-border/50",
              expanded ? "gap-1 px-2 py-2.5" : "justify-center px-2 py-2.5",
            )}
          >
            <Link
              href="/chat"
              className={cn(
                "flex min-w-0 flex-1 items-center text-foreground transition-opacity hover:opacity-90",
                expanded ? "gap-2.5 px-1" : "justify-center",
              )}
              title={IDA_CONFIG.name}
              onClick={() => {
                if (!expanded) onExpand?.();
              }}
            >
              <IdaLogo size={expanded ? "sm" : "xs"} />
              {expanded && (
                <span className="truncate text-sm font-semibold tracking-tight">
                  {IDA_CONFIG.name}
                </span>
              )}
            </Link>
            {expanded && onCollapse ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="h-8 w-8 shrink-0 text-muted-foreground"
                onClick={onCollapse}
                aria-label={copy.collapseSidebar}
                title={copy.collapseSidebar}
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          <div className="border-b py-2">
            <SidebarNav
              locale={locale}
              expanded={expanded}
              onExpand={onExpand}
            />
          </div>

          {expanded ? (
            <div className="px-2 pt-3 pb-2">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={copy.searchSessions}
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>
          ) : (
            <div className="flex justify-center px-1.5 py-2">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="h-9 w-full"
                onClick={onExpand}
                aria-label={copy.searchSessions}
                title={copy.searchSessions}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <ScrollArea className="min-h-0 flex-1">
          {expanded ? (
            <div className="px-3 pt-1 pb-1.5">
              <h2 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                {copy.chatHistory}
              </h2>
            </div>
          ) : null}
          <div className={cn("space-y-0.5", expanded ? "px-2 pb-2" : "p-1.5")}>
            {sessions.length === 0 ? (
              expanded ? (
                <div className="flex flex-col items-center px-3 py-8 text-center">
                  <Inbox className="mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-xs font-medium">{copy.noSessions}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {copy.noSessionsHint}
                  </p>
                </div>
              ) : null
            ) : filteredSessions.length === 0 ? (
              expanded ? (
                <div className="px-2 py-6 text-center">
                  <p className="text-[11px] text-muted-foreground">
                    {copy.noSearchResults}
                  </p>
                </div>
              ) : null
            ) : (
              filteredSessions.map((session) => {
                const isActive = session.id === currentChatId;
                const isPinned = Boolean(session.pinned);
                const isMenuOpen = openMenuId === session.id;

                return (
                  <div
                    key={session.id}
                    className={cn(
                      "group/session relative",
                      expanded ? "" : "flex justify-center",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (!expanded) onExpand?.();
                        onSelect(session.id);
                      }}
                      title={session.title}
                      className={cn(
                        "flex w-full transition-colors",
                        expanded
                          ? "flex-col items-start gap-0.5 rounded-xl px-2.5 py-2 pr-8 text-left"
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
                        {isPinned ? (
                          <Pin className="h-3.5 w-3.5 shrink-0 text-primary" />
                        ) : (
                          <MessagesSquare className="h-4 w-4 shrink-0" />
                        )}
                        {expanded && (
                          <span className="truncate text-xs font-medium">
                            {session.title}
                          </span>
                        )}
                      </span>
                      {expanded && (
                        <span
                          className={cn(
                            "text-[10px] text-muted-foreground",
                            isPinned ? "pl-5" : "pl-5",
                          )}
                        >
                          {formatSessionTime(session.updatedAt, locale)}
                        </span>
                      )}
                    </button>

                    {expanded && (
                      <div className="absolute top-1.5 right-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className={cn(
                            "h-6 w-6 opacity-0 transition-opacity",
                            "group-hover/session:opacity-100",
                            isMenuOpen && "opacity-100",
                          )}
                          aria-label={copy.sessionMenu}
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenMenuId(isMenuOpen ? null : session.id);
                          }}
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>

                        {isMenuOpen && (
                          <div
                            ref={menuRef}
                            className="absolute top-7 right-0 z-20 min-w-[140px] rounded-lg border bg-popover p-1 shadow-lg"
                          >
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"
                              onClick={() => {
                                onPin(session.id, !isPinned);
                                setOpenMenuId(null);
                              }}
                            >
                              {isPinned ? (
                                <PinOff className="h-3.5 w-3.5" />
                              ) : (
                                <Pin className="h-3.5 w-3.5" />
                              )}
                              {isPinned ? copy.unpinSession : copy.pinSession}
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"
                              onClick={() => {
                                setRenameTarget(session);
                                setOpenMenuId(null);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              {copy.renameSession}
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                setDeleteTargetId(session.id);
                                setOpenMenuId(null);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {copy.deleteSession}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <SidebarSettings
          locale={locale}
          expanded={expanded}
          onExpand={onExpand}
          onClearAllChats={() => setClearAllOpen(true)}
        />
      </aside>

      <RenameDialog
        open={Boolean(renameTarget)}
        title={copy.renameSession}
        label={copy.renameLabel}
        initialValue={renameTarget?.title ?? ""}
        confirmLabel={copy.renameSave}
        cancelLabel={copy.handoffClose}
        onConfirm={(value) => {
          if (renameTarget) onRename(renameTarget.id, value);
          setRenameTarget(null);
        }}
        onCancel={() => setRenameTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={copy.deleteSession}
        description={copy.deleteConfirm}
        confirmLabel={copy.deleteSession}
        cancelLabel={copy.handoffClose}
        destructive
        onConfirm={() => {
          if (deleteTargetId) onDelete(deleteTargetId);
          setDeleteTargetId(null);
        }}
        onCancel={() => setDeleteTargetId(null)}
      />

      <ConfirmDialog
        open={clearAllOpen}
        title={copy.clearAllChats}
        description={copy.clearAllConfirm}
        confirmLabel={copy.clearAllChats}
        cancelLabel={copy.handoffClose}
        destructive
        onConfirm={() => {
          onClearAll();
          setClearAllOpen(false);
        }}
        onCancel={() => setClearAllOpen(false)}
      />
    </>
  );
}