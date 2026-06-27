"use client";

import { Menu, User } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { AgentSidebar } from "@/components/agent/agent-sidebar";
import { AgentWorkspace } from "@/components/agent/agent-workspace";
import { useChatContext } from "@/components/chat/chat-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AGENT_COPY } from "@/lib/agent/content";
import type {
  AgentApiDocumentPayload,
  AgentWorkflowRun,
  AgentWorkflowStep,
} from "@/lib/agent/types";
import { useAgentStore } from "@/lib/agent-store";
import { COPY } from "@/lib/i18n";
import { useSidebarExpanded } from "@/lib/sidebar-prefs";

async function callAgentApi(
  body: Record<string, unknown>,
): Promise<AgentWorkflowRun> {
  const response = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as {
    run?: AgentWorkflowRun;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "AgentFlow request failed.");
  }

  if (!data.run) {
    throw new Error("Invalid AgentFlow response.");
  }

  return data.run;
}

export function AgentRoom() {
  const { locale } = useChatContext();
  const copy = AGENT_COPY[locale];
  const chatCopy = COPY[locale];
  const { expanded: sidebarExpanded, toggle: toggleSidebar } =
    useSidebarExpanded();

  const {
    hydrated,
    runs,
    currentRun,
    upsertRun,
    selectRun,
    newRun,
    deleteRun,
    clearRuns,
  } = useAgentStore(locale);

  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [initialSelectDone, setInitialSelectDone] = useState(false);

  useEffect(() => {
    if (!hydrated || initialSelectDone) return;
    if (runs.length > 0 && !currentRun) {
      selectRun(runs[0].id);
    }
    setInitialSelectDone(true);
  }, [hydrated, initialSelectDone, runs, currentRun, selectRun]);

  const handleAnalyze = useCallback(
    async (instruction: string, documents: AgentApiDocumentPayload[]) => {
      setLoading(true);
      try {
        const run = await callAgentApi({
          action: "analyze",
          locale,
          instruction,
          documents,
          runId: currentRun?.id,
        });
        upsertRun(run);
        toast.success(copy.analyzeButton);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : copy.apiError,
        );
      } finally {
        setLoading(false);
      }
    },
    [locale, currentRun?.id, upsertRun, copy.analyzeButton, copy.apiError],
  );

  const handleApprove = useCallback(async () => {
    if (!currentRun) return;
    setLoading(true);
    try {
      const run = await callAgentApi({
        action: "approve",
        runId: currentRun.id,
        existingRun: currentRun,
      });
      upsertRun(run);
      toast.success(copy.templateUploadLabel);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : copy.apiError,
      );
    } finally {
      setLoading(false);
    }
  }, [currentRun, upsertRun, copy.apiError, copy.templateUploadLabel]);

  const handleUploadTemplates = useCallback(
    async (
      templates: Array<{
        fileName: string;
        fileType: "docx" | "pdf";
        base64: string;
        sizeBytes: number;
      }>,
    ) => {
      if (!currentRun) return;
      setLoading(true);
      try {
        const uploaded = await callAgentApi({
          action: "upload_templates",
          runId: currentRun.id,
          templates,
          existingRun: currentRun,
        });
        const run = await callAgentApi({
          action: "inject_templates",
          runId: uploaded.id,
          existingRun: uploaded,
        });
        upsertRun(run);
        toast.success(copy.injectTemplatesButton);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : copy.apiError,
        );
      } finally {
        setLoading(false);
      }
    },
    [currentRun, upsertRun, copy.apiError, copy.injectTemplatesButton],
  );

  const handleExecute = useCallback(async () => {
    if (!currentRun) return;
    setExecuting(true);
    try {
      const run = await callAgentApi({
        action: "execute",
        runId: currentRun.id,
        existingRun: currentRun,
      });
      upsertRun(run);
      toast.success(copy.workflowComplete);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : copy.apiError,
      );
    } finally {
      setExecuting(false);
    }
  }, [currentRun, upsertRun, copy.apiError, copy.workflowComplete]);

  const handleCancel = useCallback(async () => {
    if (!currentRun) {
      newRun();
      return;
    }
    setLoading(true);
    try {
      const run = await callAgentApi({
        action: "cancel",
        runId: currentRun.id,
        existingRun: currentRun,
      });
      upsertRun(run);
      newRun();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : copy.apiError,
      );
    } finally {
      setLoading(false);
    }
  }, [currentRun, newRun, upsertRun, copy.apiError]);

  const handleEditWorkflow = useCallback(
    async (steps: AgentWorkflowStep[]) => {
      if (!currentRun) return;
      setLoading(true);
      try {
        const run = await callAgentApi({
          action: "edit_workflow",
          runId: currentRun.id,
          steps,
          existingRun: currentRun,
        });
        upsertRun(run);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : copy.apiError,
        );
      } finally {
        setLoading(false);
      }
    },
    [currentRun, upsertRun, copy.apiError],
  );

  const sidebar = (
    <AgentSidebar
      locale={locale}
      runs={runs}
      currentRunId={currentRun?.id ?? null}
      expanded={sidebarExpanded}
      onToggleExpanded={toggleSidebar}
      onSelectRun={(runId) => {
        selectRun(runId);
        setMobileSidebarOpen(false);
      }}
      onNewRun={() => {
        newRun();
        setMobileSidebarOpen(false);
      }}
      onDeleteRun={deleteRun}
      onClearAll={clearRuns}
      className="h-full"
    />
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <div className="hidden h-full md:flex">{sidebar}</div>

      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>{copy.workflowHistory}</SheetTitle>
          </SheetHeader>
          {sidebar}
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center gap-2.5 border-b px-3 py-3 sm:gap-3 sm:px-5 md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={copy.openSessions}
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{copy.title}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {copy.subtitle}
            </p>
          </div>
          <Link
            href="/account"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={chatCopy.account}
          >
            <User className="h-4 w-4" />
          </Link>
        </header>

        <AgentWorkspace
          locale={locale}
          run={currentRun}
          loading={loading}
          executing={executing}
          onAnalyze={handleAnalyze}
          onApprove={handleApprove}
          onUploadTemplates={handleUploadTemplates}
          onExecute={handleExecute}
          onCancel={handleCancel}
          onEditWorkflow={handleEditWorkflow}
        />
      </div>
    </div>
  );
}