import { recordWorkflowAudit } from "@/lib/workflow-security";
import type { WorkflowDefinition } from "@/lib/workflow";
import { executeChatWorkflowStream } from "@/lib/workflow-executor";

import { formatScheduleLabel } from "./schedule";
import {
  advanceWorkflowScheduleAfterRun,
  listDueWorkflowSchedules,
  recordWorkflowTriggerEvent,
} from "./store";
import type { WorkflowScheduleRecord } from "./types";

export interface WorkflowSchedulerTickResult {
  processed: number;
  dispatched: number;
  failed: number;
  skipped: number;
  details: Array<{
    scheduleId: string;
    workflowId: string;
    status: "dispatched" | "failed" | "skipped";
    message?: string;
  }>;
}

function readWorkflowSnapshot(
  record: WorkflowScheduleRecord,
): WorkflowDefinition | null {
  const snapshot = record.workflowSnapshot;
  if (!snapshot || typeof snapshot !== "object") return null;

  const workflow = snapshot as Partial<WorkflowDefinition>;
  if (
    typeof workflow.id !== "string" ||
    !Array.isArray(workflow.nodes) ||
    !Array.isArray(workflow.edges)
  ) {
    return null;
  }

  return workflow as WorkflowDefinition;
}

async function dispatchScheduledWorkflow(
  record: WorkflowScheduleRecord,
): Promise<{ ok: boolean; message?: string }> {
  const workflow = readWorkflowSnapshot(record);
  if (!workflow) {
    return { ok: false, message: "Missing workflow snapshot." };
  }

  try {
    for await (const event of executeChatWorkflowStream({
      workflow,
      locale: "en",
      sessionId: record.sessionId ?? undefined,
      actorUserId: record.userId,
    })) {
      if (event.type === "error") {
        return { ok: false, message: event.message };
      }
    }

    await recordWorkflowAudit({
      workflowId: record.workflowId,
      workflowName: record.workflowName,
      userId: record.userId,
      sessionId: record.sessionId,
      action: "workflow.trigger_fired",
      actorType: "system",
      details: {
        scheduleId: record.id,
        scheduleType: record.scheduleType,
        label: formatScheduleLabel(record.scheduleConfig, "en"),
        source: "cron_tick",
      },
    });

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Dispatch failed.",
    };
  }
}

export async function runWorkflowSchedulerTick(): Promise<WorkflowSchedulerTickResult> {
  const due = await listDueWorkflowSchedules(25);
  const result: WorkflowSchedulerTickResult = {
    processed: due.length,
    dispatched: 0,
    failed: 0,
    skipped: 0,
    details: [],
  };

  for (const record of due) {
    if (!record.enabled) {
      result.skipped += 1;
      result.details.push({
        scheduleId: record.id,
        workflowId: record.workflowId,
        status: "skipped",
        message: "Schedule disabled.",
      });
      continue;
    }

    const dispatch = await dispatchScheduledWorkflow(record);
    const eventStatus = dispatch.ok ? "dispatched" : "failed";

    await recordWorkflowTriggerEvent({
      scheduleId: record.id,
      workflowId: record.workflowId,
      eventType: "cron_tick",
      status: eventStatus,
      payload: {
        scheduleType: record.scheduleType,
        message: dispatch.message,
      },
    });

    if (dispatch.ok) {
      result.dispatched += 1;
      await advanceWorkflowScheduleAfterRun(record);
      result.details.push({
        scheduleId: record.id,
        workflowId: record.workflowId,
        status: "dispatched",
      });
    } else {
      result.failed += 1;
      result.details.push({
        scheduleId: record.id,
        workflowId: record.workflowId,
        status: "failed",
        message: dispatch.message,
      });
    }
  }

  return result;
}