"use client";

import Link from "next/link";
import {
  History,
  MessageSquarePlus,
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

import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from "@/lib/client/debounce";

import { IdaLogo } from "@/components/brand/ida-logo";
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
  onNewChat: () => void;
  expanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
  className?: string;
}

function SidebarSeparator({ className }: { className?: string }) {
  return <div className={cn("mx-2 h-px bg-border/40", className)} />;
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
  onNewChat,
  expanded = true,
  onExpand,
  onCollapse,
  className,
}: ChatSidebarProps) {
  const copy = COPY[locale];
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<ChatSession | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredSessions = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase();
    if (!query) return sessions;
    return sessions.filter((session) =>
      session.title.toLowerCase().includes(query),
    );
  }, [sessions, debouncedSearchQuery]);

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
          "flex h-full flex-col transition-[width] duration-300 ease-out border-r border-border/30 lg:ida-glass-subtle",
          expanded ? "w-[280px] overflow-hidden" : "w-16 overflow-x-visible overflow-y-hidden",
          className,
        )}
        aria-label={copy.sessionsLabel}
        aria-busy="true"
      >
        <SidebarSkeleton expanded={expanded} />
      </aside>
    );
  }

  const sessionList = (
    <>
      {sessions.length === 0 ? (
        <div className="flex flex-col items-center px-4 py-10 text-center">
          <Inbox className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm font-semibold text-foreground/60">{copy.noSessions}</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="px-2 py-8 text-center">
          <p className="text-sm text-muted-foreground/60">
            {copy.noSearchResults}
          </p>
        </div>
      ) : (
        filteredSessions.map((session) => {
          const isActive = session.id === currentChatId;
          const isPinned = Boolean(session.pinned);
          const isMenuOpen = openMenuId === session.id;

          return (
            <div key={session.id} className="group/session relative mb-1 px-2">
              <button
                type="button"
                onClick={() => onSelect(session.id)}
                title={session.title}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "cursor-pointer",
                  "flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-all duration-300",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-semibold ring-1 ring-primary/20"
                    : "text-foreground/70 hover:bg-accent/60 hover:text-foreground hover:shadow-sm font-medium",
                )}
              >
                {isPinned && (
                  <Pin className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-primary-foreground" : "text-primary")} />
                )}
                <span className="truncate text-[15px] flex-1">
                  {session.title}
                </span>
              </button>

              <div className="absolute top-1/2 -translate-y-1/2 right-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className={cn(
                    "h-7 w-7 rounded-full transition-all duration-200",
                    isActive ? "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground" : "opacity-0 group-hover/session:opacity-100 text-muted-foreground hover:bg-muted",
                    isMenuOpen && "opacity-100",
                  )}
                  aria-label={copy.sessionMenu}
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenMenuId(isMenuOpen ? null : session.id);
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>

                {isMenuOpen && (
                  <div
                    ref={menuRef}
                    className="absolute top-8 right-0 z-20 min-w-[160px] rounded-xl border bg-popover p-1.5 shadow-2xl ring-1 ring-foreground/5"
                  >
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors hover:bg-muted active:bg-muted/80"
                      onClick={() => {
                        onPin(session.id, !isPinned);
                        setOpenMenuId(null);
                      }}
                    >
                      {isPinned ? (
                        <PinOff className="h-4 w-4" />
                      ) : (
                        <Pin className="h-4 w-4" />
                      )}
                      {isPinned ? copy.unpinSession : copy.pinSession}
                    </button>
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors hover:bg-muted active:bg-muted/80"
                      onClick={() => {
                        setRenameTarget(session);
                        setOpenMenuId(null);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      {copy.renameSession}
                    </button>
                    <div className="my-1 h-px bg-border/40" />
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-bold text-destructive transition-colors hover:bg-destructive/10 active:bg-destructive/15"
                      onClick={() => {
                        setDeleteTargetId(session.id);
                        setOpenMenuId(null);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      {copy.deleteSession}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </>
  );

  return (
    <>
      <aside
        className={cn(
          "flex h-full flex-col border-r border-border/40 bg-muted/30 transition-[width] duration-300 ease-in-out lg:ida-glass-subtle",
          expanded ? "w-[280px] overflow-hidden" : "w-16 overflow-x-visible overflow-y-hidden",
          className,
        )}
        aria-label={copy.sessionsLabel}
      >
        <div className="shrink-0 px-4 pt-5 pb-4">
          {expanded ? (
            <div className="flex items-center gap-3">
              <Link
                href="/chat"
                className="flex min-w-0 flex-1 items-center gap-3 text-foreground transition-all hover:opacity-80 active:scale-95"
                title={IDA_CONFIG.name}
              >
                <IdaLogo size="sm" className="scale-110" />
                <span className="truncate text-lg font-extrabold tracking-tight">
                  {IDA_CONFIG.name}
                </span>
              </Link>
              {onCollapse ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:bg-muted"
                  onClick={onCollapse}
                  aria-label={copy.collapseSidebar}
                  title={copy.collapseSidebar}
                >
                  <PanelLeftClose className="h-5 w-5" />
                </Button>
              ) : null}
            </div>
          ) : (
            <Link
              href="/chat"
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-foreground transition-all hover:bg-muted active:scale-90 shadow-sm"
              title={IDA_CONFIG.name}
              aria-label={IDA_CONFIG.name}
            >
              <IdaLogo size="sm" />
            </Link>
          )}
        </div>

        <div className={cn("shrink-0 py-3", expanded ? "px-4" : "px-2")}>
          {expanded ? (
            <Button
              type="button"
              variant="default"
              size="lg"
              className="h-12 w-full justify-center gap-3 rounded-2xl text-base font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
              onClick={onNewChat}
            >
              <MessageSquarePlus className="h-5 w-5" />
              {copy.newChat}
            </Button>
          ) : (
            <Button
              type="button"
              variant="default"
              size="icon"
              className="mx-auto flex h-12 w-12 rounded-xl shadow-md active:scale-90 transition-all"
              onClick={onNewChat}
              aria-label={copy.newChat}
              title={copy.newChat}
            >
              <MessageSquarePlus className="h-6 w-6" />
            </Button>
          )}
        </div>

        <SidebarSeparator className="my-2" />

        {expanded ? (
          <>
            <div className="shrink-0 px-4 pb-3">
              <div className="relative group">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={copy.searchSessions}
                  className="h-10 pl-10 rounded-xl bg-muted/40 border-border/30 focus:bg-background transition-all text-sm"
                />
              </div>
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className="pb-4">{sessionList}</div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-start px-2 pt-4 gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground active:scale-90 transition-all"
              onClick={onExpand}
              aria-label={copy.openChatHistory}
              title={copy.openChatHistory}
            >
              <History className="h-6 w-6" />
            </Button>
          </div>
        )}

        <div className="mt-auto border-t border-border/40 bg-muted/10 p-3">
          <SidebarSettings
            locale={locale}
            expanded={expanded}
            onClearAllChats={() => setClearAllOpen(true)}
          />
        </div>
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
