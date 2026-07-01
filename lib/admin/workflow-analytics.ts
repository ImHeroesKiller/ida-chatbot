import { getMultiAgentLabel, type MultiAgentId } from "@/lib/agent/multi-agent";
import type {
  WorkflowAnalytics,
  WorkflowAnalyticsDailyPoint,
  WorkflowAgentPerformanceStat,
  WorkflowExecutionLogSummary,
  WorkflowPerWorkflowStat,
} from "@/lib/admin/types";
import { loadAppConfig } from "@/lib/admin/config";
import { logRequest } from "@/lib/admin/request-logs";
import { resolveToolModel } from "@/lib/admin/tool-model";
import type { Locale } from "@/lib/config";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import {
  getActiveWorkflow,
  normalizeWorkflowWorkspace,
  type WorkflowExecutionLogEntry,
  type WorkflowExecutionResult,
  type WorkflowWorkspace,
} from "@/lib/workflow";

const ANALYTICS_LOCALE: Locale = "en";

interface ChatSessionWorkflowRow {
  user_id: string | null;
  session_id: string;
  chat_id: string;
  workflow: unknown;
  updated_at: string;
}

interface WorkflowRequestLogRow {
  status: string;
  created_at: string;
  route: string;
}

function daysAgoIso(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
}

function formatDayLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function buildEmptyDailyPoints(): WorkflowAnalyticsDailyPoint[] {
  const days: WorkflowAnalyticsDailyPoint[] = [];
  const now = new Date();

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    date.setUTCDate(date.getUTCDate() - offset);
    const iso = date.toISOString().slice(0, 10);
    days.push({
      date: iso,
      label: formatDayLabel(iso),
      executions: 0,
      completed: 0,
      failed: 0,
    });
  }

  return days;
}

function parseWorkflowWorkspace(raw: unknown): WorkflowWorkspace | null {
  if (!raw || typeof raw !== "object") return null;
  try {
    return normalizeWorkflowWorkspace(raw as WorkflowWorkspace);
  } catch {
    return null;
  }
}

function executionDurationMs(result: WorkflowExecutionResult): number | null {
  if (!result.completedAt || !result.startedAt) return null;
  const delta = result.completedAt - result.startedAt;
  return delta > 0 ? delta : null;
}

function isSuccessStatus(status: WorkflowExecutionResult["status"]): boolean {
  return status === "completed";
}

function isFailedStatus(status: WorkflowExecutionResult["status"]): boolean {
  return status === "failed";
}

function collectAgentIds(logs: WorkflowExecutionLogEntry[] | undefined): string[] {
  if (!logs?.length) return [];
  const ids = new Set<string>();
  for (const log of logs) {
    if (log.agentId) ids.add(log.agentId);
  }
  return [...ids];
}

function emptyAnalytics(): WorkflowAnalytics {
  return {
    overview: {
      totalWorkflows: 0,
      totalExecutions: 0,
      successRate: 0,
      avgExecutionTimeMs: 0,
      activeUsers: 0,
      activeUsersWeek: 0,
      workflowEnabledSessions: 0,
    },
    perWorkflow: [],
    agentPerformance: [],
    executionLogs: [],
    dailyExecutions: buildEmptyDailyPoints(),
    workflowRequestLogs: {
      total: 0,
      success: 0,
      errors: 0,
      last7Days: 0,
    },
    generatedAt: new Date().toISOString(),
  };
}

export async function getWorkflowAnalytics(): Promise<WorkflowAnalytics> {
  const empty = emptyAnalytics();
  if (!isSupabaseConfigured()) return empty;

  try {
    const supabase = getSupabaseAdmin();
    const since30 = daysAgoIso(30);
    const since7 = daysAgoIso(7);
    const todayIso = new Date().toISOString().slice(0, 10);
    const weekStartMs = Date.parse(since7);

    const [sessionsResult, requestLogsResult] = await Promise.all([
      supabase
        .from("ida_chat_sessions")
        .select("user_id, session_id, chat_id, workflow, updated_at")
        .not("workflow", "is", null)
        .gte("updated_at", since30)
        .order("updated_at", { ascending: false })
        .limit(1500),
      supabase
        .from("ida_request_logs")
        .select("status, created_at, route")
        .or("route.eq.workflow/execute,route.eq.workflow/resume,route.eq.workflow")
        .gte("created_at", since30),
    ]);

    const sessions = (sessionsResult.data ?? []) as ChatSessionWorkflowRow[];
    const requestLogs = (requestLogsResult.data ?? []) as WorkflowRequestLogRow[];

    const dailyPoints = buildEmptyDailyPoints();
    const dailyIndex = new Map(
      dailyPoints.map((day, index) => [day.date, index]),
    );

    const workflowStats = new Map<
      string,
      {
        definitionCount: number;
        executionCount: number;
        successCount: number;
        failedCount: number;
        durations: number[];
        lastExecutedAt: string | null;
      }
    >();

    const agentStats = new Map<
      string,
      { invocations: number; completed: number; failed: number }
    >();

    const executionSummaries: WorkflowExecutionLogSummary[] = [];

    let totalWorkflowDefinitions = 0;
    let totalExecutions = 0;
    let successExecutions = 0;
    let failedExecutions = 0;
    const durations: number[] = [];
    const activeUsersToday = new Set<string>();
    const activeUsersWeek = new Set<string>();
    let workflowEnabledSessions = 0;

    for (const session of sessions) {
      const workspace = parseWorkflowWorkspace(session.workflow);
      if (!workspace || workspace.workflows.length === 0) continue;

      workflowEnabledSessions += 1;
      totalWorkflowDefinitions += workspace.workflows.length;

      const sessionUpdatedMs = Date.parse(session.updated_at);
      if (session.user_id) {
        if (sessionUpdatedMs >= Date.parse(`${todayIso}T00:00:00Z`)) {
          activeUsersToday.add(session.user_id);
        }
        if (sessionUpdatedMs >= weekStartMs) {
          activeUsersWeek.add(session.user_id);
        }
      }

      for (const workflow of workspace.workflows) {
        const key = workflow.name.trim() || "Untitled Workflow";
        const entry = workflowStats.get(key) ?? {
          definitionCount: 0,
          executionCount: 0,
          successCount: 0,
          failedCount: 0,
          durations: [],
          lastExecutedAt: null,
        };
        entry.definitionCount += 1;
        workflowStats.set(key, entry);
      }

      const lastExecution = workspace.lastExecution;
      if (!lastExecution?.startedAt) continue;

      const active = getActiveWorkflow(workspace);
      const workflowName =
        active?.name ??
        workspace.workflows.find((wf) => wf.id === lastExecution.workflowId)
          ?.name ??
        "Untitled Workflow";

      const wfKey = workflowName.trim() || "Untitled Workflow";
      const wfEntry = workflowStats.get(wfKey) ?? {
        definitionCount: 0,
        executionCount: 0,
        successCount: 0,
        failedCount: 0,
        durations: [],
        lastExecutedAt: null,
      };

      totalExecutions += 1;
      wfEntry.executionCount += 1;

      const startedIso = new Date(lastExecution.startedAt).toISOString();
      if (!wfEntry.lastExecutedAt || startedIso > wfEntry.lastExecutedAt) {
        wfEntry.lastExecutedAt = startedIso;
      }

      const duration = executionDurationMs(lastExecution);
      if (duration) {
        durations.push(duration);
        wfEntry.durations.push(duration);
      }

      if (isSuccessStatus(lastExecution.status)) {
        successExecutions += 1;
        wfEntry.successCount += 1;
      } else if (isFailedStatus(lastExecution.status)) {
        failedExecutions += 1;
        wfEntry.failedCount += 1;
      }

      const execDate = new Date(lastExecution.startedAt).toISOString().slice(0, 10);
      const dayIndex = dailyIndex.get(execDate);
      if (dayIndex !== undefined) {
        const day = dailyPoints[dayIndex]!;
        day.executions += 1;
        if (isSuccessStatus(lastExecution.status)) day.completed += 1;
        if (isFailedStatus(lastExecution.status)) day.failed += 1;
      }

      for (const log of lastExecution.logs ?? []) {
        if (!log.agentId) continue;
        const agentEntry = agentStats.get(log.agentId) ?? {
          invocations: 0,
          completed: 0,
          failed: 0,
        };
        agentEntry.invocations += 1;
        if (log.status === "completed") agentEntry.completed += 1;
        if (log.status === "failed") agentEntry.failed += 1;
        agentStats.set(log.agentId, agentEntry);
      }

      workflowStats.set(wfKey, wfEntry);

      executionSummaries.push({
        id: `${session.session_id}:${lastExecution.workflowId}:${lastExecution.startedAt}`,
        sessionId: session.session_id,
        userId: session.user_id,
        workflowName,
        status: lastExecution.status,
        startedAt: startedIso,
        durationMs: duration,
        nodeCount: lastExecution.logs?.length ?? 0,
        agentIds: collectAgentIds(lastExecution.logs),
        message: lastExecution.message ?? null,
      });
    }

    const perWorkflow: WorkflowPerWorkflowStat[] = [...workflowStats.entries()]
      .map(([workflowName, stats]) => ({
        workflowName,
        definitionCount: stats.definitionCount,
        executionCount: stats.executionCount,
        successCount: stats.successCount,
        failedCount: stats.failedCount,
        avgDurationMs:
          stats.durations.length > 0
            ? Math.round(
                stats.durations.reduce((sum, value) => sum + value, 0) /
                  stats.durations.length,
              )
            : 0,
        lastExecutedAt: stats.lastExecutedAt,
      }))
      .sort((left, right) => right.executionCount - left.executionCount);

    const agentPerformance: WorkflowAgentPerformanceStat[] = [...agentStats.entries()]
      .map(([agentId, stats]) => {
        const label = getMultiAgentLabel(agentId as MultiAgentId, ANALYTICS_LOCALE);
        const denom = stats.completed + stats.failed;
        return {
          agentId,
          label,
          invocations: stats.invocations,
          completed: stats.completed,
          failed: stats.failed,
          successRate: denom > 0 ? stats.completed / denom : 1,
        };
      })
      .sort((left, right) => right.invocations - left.invocations);

    const resolvedExecutions = successExecutions + failedExecutions;
    const successRate =
      resolvedExecutions > 0 ? successExecutions / resolvedExecutions : 0;
    const avgExecutionTimeMs =
      durations.length > 0
        ? Math.round(
            durations.reduce((sum, value) => sum + value, 0) / durations.length,
          )
        : 0;

    let workflowRequestTotal = 0;
    let workflowRequestSuccess = 0;
    let workflowRequestErrors = 0;
    let workflowRequestLast7 = 0;
    const since7Ms = Date.parse(since7);

    for (const row of requestLogs) {
      workflowRequestTotal += 1;
      if (row.status === "success") workflowRequestSuccess += 1;
      else workflowRequestErrors += 1;
      if (Date.parse(row.created_at) >= since7Ms) {
        workflowRequestLast7 += 1;
      }
    }

    executionSummaries.sort((left, right) =>
      right.startedAt.localeCompare(left.startedAt),
    );

    return {
      overview: {
        totalWorkflows: totalWorkflowDefinitions,
        totalExecutions,
        successRate,
        avgExecutionTimeMs,
        activeUsers: activeUsersToday.size,
        activeUsersWeek: activeUsersWeek.size,
        workflowEnabledSessions,
      },
      perWorkflow,
      agentPerformance,
      executionLogs: executionSummaries.slice(0, 25),
      dailyExecutions: dailyPoints,
      workflowRequestLogs: {
        total: workflowRequestTotal,
        success: workflowRequestSuccess,
        errors: workflowRequestErrors,
        last7Days: workflowRequestLast7,
      },
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[IDA workflow-analytics]", error);
    return empty;
  }
}

/** Record a workflow execute/resume request for admin analytics. */
export async function logWorkflowExecutionRequest(options: {
  route: "workflow/execute" | "workflow/resume";
  sessionId?: string;
  status: "success" | "error";
  errorMessage?: string | null;
  durationMs?: number;
}): Promise<void> {
  try {
    const appConfig = await loadAppConfig();
    const selected = resolveToolModel(appConfig, "workflow", "agent");
    await logRequest({
      sessionId: options.sessionId ?? null,
      model: selected.id,
      provider: selected.provider,
      route: options.route,
      status: options.status,
      errorMessage: options.errorMessage ?? null,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: Math.max(Math.round((options.durationMs ?? 0) / 10), 0),
      },
    });
  } catch (error) {
    console.error("[IDA workflow-analytics log]", error);
  }
}