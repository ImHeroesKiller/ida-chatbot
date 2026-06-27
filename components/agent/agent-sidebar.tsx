"use client";

import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Inbox,
  Plus,
  Trash2,
  Workflow,
} from "lucide-react";

import { IdaLogo } from "@/components/brand/ida-logo";
import { SidebarNav } from "@/components/chat/sidebar-nav";
import { SidebarSettings } from "@/components/chat/sidebar-settings";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AGENT_COPY } from "@/lib/agent/content";
import type { AgentWorkflowRun, AgentWorkflowStatus } from "@/lib/agent/types";
import { IDA_CONFIG } from "@/lib/config";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface AgentSidebarProps {
  locale: Locale;
  runs: AgentWorkflowRun[];
  currentRunId: string | null;
  expanded?: boolean;
  onToggleExpanded?: () => void;
  onSelectRun: (runId: string) => void;
  onNewRun: () => void;
  onDeleteRun: (runId: string) => void;
  onClearAll: () => void;
  className?: string;
}

function statusLabel(
  status: AgentWorkflowStatus,
  locale: Locale,
): string {
  const copy = AGENT_COPY[locale];
  const map: Record<AgentWorkflowStatus, string> = {
    draft: copy.statusDraft,
    analyzing: copy.statusAnalyzing,
    proposed: copy.statusProposed,
    awaiting_approval: copy.statusAwaiting,
    approved: copy.statusApproved,
    executing: copy.statusExecuting,
    completed: copy.statusCompleted,
    cancelled: copy.statusCancelled,
    failed: copy.statusCancelled,
  };
  return map[status] ?? status;
}

function formatTime(timestamp: number, locale: Locale): string {
  const localeTag =
    locale === "zh" ? "zh-CN" : locale === "en" ? "en-US" : "id-ID";
  return new Intl.DateTimeFormat(localeTag, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function AgentSidebar({
  locale,
  runs,
  currentRunId,
  expanded = true,
  onToggleExpanded,
  onSelectRun,
  onNewRun,
  onDeleteRun,
  onClearAll,
  className,
}: AgentSidebarProps) {
  const copy = AGENT_COPY[locale];
  const chatCopy = COPY[locale];

  return (
    <aside
      className={cn(
        "flex h-full flex-col overflow-hidden bg-muted/20 transition-[width] duration-200 ease-in-out dark:bg-muted/10",
        expanded ? "w-[260px]" : "w-14",
        className,
      )}
      aria-label={copy.workflowHistory}
    >
      <div className="sticky top-0 z-10 shrink-0 border-b bg-muted/20 backdrop-blur-sm dark:bg-muted/10">
        <div
          className={cn(
            "flex items-center border-b border-border/50",
            expanded ? "gap-2.5 px-3 py-2.5" : "justify-center px-2 py-2.5",
          )}
        >
          <Link
            href="/agent"
            className={cn(
              "flex min-w-0 items-center text-foreground transition-opacity hover:opacity-90",
              expanded ? "gap-2.5" : "justify-center",
            )}
            title={IDA_CONFIG.name}
          >
            <IdaLogo size={expanded ? "sm" : "xs"} />
            {expanded && (
              <span className="truncate text-sm font-semibold tracking-tight">
                {IDA_CONFIG.name}
              </span>
            )}
          </Link>
        </div>

        <div className="border-b py-2">
          <SidebarNav locale={locale} expanded={expanded} />
        </div>

        <div className="p-2 pb-3">
          <Button
            type="button"
            size="sm"
            className={cn(
              "h-9 text-xs",
              expanded
                ? "w-full justify-start gap-2"
                : "w-full justify-center px-0",
            )}
            onClick={onNewRun}
            title={copy.newWorkflow}
          >
            <Plus className="h-4 w-4 shrink-0" />
            {expanded && <span>{copy.newWorkflow}</span>}
          </Button>
        </div>

        {expanded && (
          <>
            <div className="mx-3 border-t" role="separator" />
            <p className="px-3 pt-3 pb-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
              {copy.workflowHistory}
            </p>
          </>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className={cn("space-y-0.5", expanded ? "p-2" : "p-1.5")}>
          {runs.length === 0 ? (
            expanded ? (
              <div className="flex flex-col items-center px-3 py-8 text-center">
                <Inbox className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-xs font-medium">{copy.noWorkflows}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {copy.noWorkflowsHint}
                </p>
              </div>
            ) : null
          ) : (
            runs.map((run) => {
              const isActive = run.id === currentRunId;
              const title =
                run.proposal?.title ??
                run.instruction.slice(0, 40) +
                  (run.instruction.length > 40 ? "…" : "");

              return (
                <div
                  key={run.id}
                  className={cn(
                    "group/run relative",
                    expanded ? "" : "flex justify-center",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectRun(run.id)}
                    title={title}
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
                      <Workflow className="h-4 w-4 shrink-0" />
                      {expanded && (
                        <span className="truncate text-xs font-medium">
                          {title}
                        </span>
                      )}
                    </span>
                    {expanded && (
                      <span className="pl-5 text-[10px] text-muted-foreground">
                        {statusLabel(run.status, locale)} ·{" "}
                        {formatTime(run.updatedAt, locale)}
                      </span>
                    )}
                  </button>

                  {expanded && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute top-1.5 right-1 h-6 w-6 opacity-0 transition-opacity group-hover/run:opacity-100"
                      aria-label={chatCopy.deleteSession}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteRun(run.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
        onClearAllChats={onClearAll}
      />

      {onToggleExpanded && (
        <div className="shrink-0 border-t p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 text-xs text-muted-foreground",
              expanded
                ? "w-full justify-start gap-2"
                : "w-full justify-center px-0",
            )}
            onClick={onToggleExpanded}
            aria-label={
              expanded ? chatCopy.collapseSidebar : chatCopy.expandSidebar
            }
          >
            {expanded ? (
              <>
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span>{chatCopy.collapseSidebar}</span>
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