import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import { loadAppConfig } from "@/lib/admin/config";
import { getProviderApiKey } from "@/lib/admin/models";
import { resolveToolModel } from "@/lib/admin/tool-model";
import type { Locale } from "@/lib/config";
import {
  applyResumeActionToCheckpoint,
  buildOrderedNodeIds,
  checkpointToExecutionResult,
  getNodeMaxRetries,
  suggestWorkflowErrorRecovery,
  type WorkflowExecutionCheckpoint,
  type WorkflowResumeAction,
} from "@/lib/workflow-execution-state";
import {
  formatScheduleLabel,
  getServerDelayMs,
  parseTriggerSchedule,
} from "@/lib/workflow-scheduler";
import {
  executeServerWorkflowAction,
  resolveWorkflowNodeAction,
  workflowActionRequiresClientDispatch,
  type ResolvedWorkflowNodeAction,
} from "@/lib/workflow-actions";
import type {
  WorkflowDefinition,
  WorkflowExecutionLogEntry,
  WorkflowExecutionResult,
  WorkflowNode,
  WorkflowNodeKind,
} from "@/lib/workflow";

export interface ExecuteChatWorkflowInput {
  workflow: WorkflowDefinition;
  locale: Locale;
  sessionId?: string;
  activeWorkflowId?: string;
  /** Resume from a persisted checkpoint (approval / recovery). */
  checkpoint?: WorkflowExecutionCheckpoint;
  resumeAction?: WorkflowResumeAction;
  resumeNote?: string;
}

export type WorkflowExecuteProgressEvent =
  | {
      type: "start";
      workflowId: string;
      startedAt: number;
      totalNodes: number;
    }
  | {
      type: "progress";
      log: WorkflowExecutionLogEntry;
      logs: WorkflowExecutionLogEntry[];
    }
  | {
      type: "tool_action";
      nodeId: string;
      action: ResolvedWorkflowNodeAction;
      dispatch?: Record<string, string>;
      output: string;
      message: string;
      logs: WorkflowExecutionLogEntry[];
    }
  | {
      type: "approval_required";
      checkpoint: WorkflowExecutionCheckpoint;
      logs: WorkflowExecutionLogEntry[];
    }
  | {
      type: "recovery_required";
      checkpoint: WorkflowExecutionCheckpoint;
      logs: WorkflowExecutionLogEntry[];
    }
  | {
      type: "scheduled";
      nextRunAt: number;
      label: string;
      logs: WorkflowExecutionLogEntry[];
    }
  | { type: "done"; result: WorkflowExecutionResult; checkpoint?: WorkflowExecutionCheckpoint | null }
  | { type: "error"; message: string; result?: WorkflowExecutionResult };

function sortNodesForExecution(workflow: WorkflowDefinition): WorkflowNode[] {
  const ids = buildOrderedNodeIds(workflow);
  return ids
    .map((id) => workflow.nodes.find((node) => node.id === id))
    .filter((node): node is WorkflowNode => Boolean(node));
}

function getNodePrompt(node: WorkflowNode): string {
  const configPrompt =
    typeof node.data.config?.prompt === "string"
      ? node.data.config.prompt.trim()
      : "";
  if (configPrompt) return configPrompt;
  if (node.data.description?.trim()) return node.data.description.trim();
  return node.data.label;
}

function pushOrUpdateLog(
  logs: WorkflowExecutionLogEntry[],
  entry: WorkflowExecutionLogEntry,
): WorkflowExecutionLogEntry[] {
  if (entry.status !== "running" && entry.status !== "awaiting_approval") {
    for (let index = logs.length - 1; index >= 0; index -= 1) {
      const current = logs[index];
      if (
        current.nodeId === entry.nodeId &&
        (current.status === "running" || current.status === "awaiting_approval")
      ) {
        const next = [...logs];
        next[index] = entry;
        return next;
      }
    }
  }

  return [...logs, entry];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runLlmStep(options: {
  locale: Locale;
  node: WorkflowNode;
  priorContext: string;
}): Promise<string> {
  const appConfig = await loadAppConfig();
  const selected = resolveToolModel(appConfig, "workflow", "agent");
  const apiKey = getProviderApiKey(selected.provider);

  if (!apiKey || selected.provider !== "google") {
    throw new Error("Workflow execution model is not configured.");
  }

  const model = new ChatGoogleGenerativeAI({
    apiKey,
    model: selected.id,
    temperature: 0.4,
  });

  const languageRule =
    options.locale === "id"
      ? "Jawab dalam Bahasa Indonesia."
      : options.locale === "zh"
        ? "请用中文回答。"
        : "Reply in English.";

  const kindInstruction: Record<WorkflowNodeKind, string> = {
    trigger: "Summarize the trigger context and what should happen next.",
    action: "Execute the automation step and return concise actionable output.",
    condition:
      "Evaluate the condition. Start your response with YES or NO on the first line, then a short rationale.",
    output: "Produce the final output artifact for this workflow step.",
    approval:
      "Summarize what requires human approval. Be concise and actionable.",
  };

  const response = await model.invoke([
    new SystemMessage(
      `You are IDA Workflow Executor — a LangGraph-style step runner.
${languageRule}
Node kind: ${options.node.data.kind}
Instruction: ${kindInstruction[options.node.data.kind]}`,
    ),
    new HumanMessage(
      `Workflow context so far:
${options.priorContext || "(empty)"}

Current node: ${options.node.data.label}
Node prompt: ${getNodePrompt(options.node)}

Return only the step result.`,
    ),
  ]);

  const text =
    typeof response.content === "string"
      ? response.content
      : Array.isArray(response.content)
        ? response.content
            .map((part) =>
              typeof part === "string"
                ? part
                : "text" in part
                  ? String(part.text)
                  : "",
            )
            .join("")
        : "";

  return text.trim();
}

async function executeWorkflowNodeStep(options: {
  locale: Locale;
  node: WorkflowNode;
  priorContext: string;
}): Promise<{
  output: string;
  message: string;
  action: ResolvedWorkflowNodeAction;
  dispatch?: Record<string, string>;
  success: boolean;
}> {
  const { node, priorContext, locale } = options;
  const action = resolveWorkflowNodeAction(node, priorContext);

  if (
    node.data.kind === "condition" ||
    node.data.kind === "approval" ||
    action.id === "llm"
  ) {
    const output = await runLlmStep({ locale, node, priorContext });
    return {
      output,
      message: "Step completed",
      action,
      success: true,
    };
  }

  const toolResult = await executeServerWorkflowAction(action, {
    locale,
    workflowContext: priorContext,
  });

  return {
    output: toolResult.output || toolResult.message,
    message: toolResult.message,
    action,
    dispatch: toolResult.dispatch,
    success: toolResult.success,
  };
}

function buildCheckpoint(options: {
  workflow: WorkflowDefinition;
  locale: Locale;
  startedAt: number;
  context: string;
  logs: WorkflowExecutionLogEntry[];
  nextNodeIndex: number;
  orderedNodeIds: string[];
  node: WorkflowNode;
  pauseReason: WorkflowExecutionCheckpoint["pauseReason"];
  errorMessage?: string;
  errorSuggestion?: string;
  retryCount?: number;
  maxRetries?: number;
  scheduledRunAt?: number;
}): WorkflowExecutionCheckpoint {
  return {
    workflowId: options.workflow.id,
    locale: options.locale,
    startedAt: options.startedAt,
    context: options.context,
    logs: [...options.logs],
    nextNodeIndex: options.nextNodeIndex,
    orderedNodeIds: options.orderedNodeIds,
    pauseReason: options.pauseReason,
    pendingNodeId: options.node.id,
    pendingNodeLabel: options.node.data.label,
    pendingNodeKind: options.node.data.kind,
    errorMessage: options.errorMessage,
    errorSuggestion: options.errorSuggestion,
    retryCount: options.retryCount,
    maxRetries: options.maxRetries,
    approvalPrompt: getNodePrompt(options.node),
    scheduledRunAt: options.scheduledRunAt,
  };
}

/**
 * Execute a chat workflow sequentially, yielding per-node progress events.
 * Supports approval gates, error recovery checkpoints, and resume.
 */
export async function* executeChatWorkflowStream(
  input: ExecuteChatWorkflowInput,
): AsyncGenerator<WorkflowExecuteProgressEvent> {
  const startedAt = input.checkpoint?.startedAt ?? Date.now();

  if (
    input.activeWorkflowId &&
    input.activeWorkflowId !== input.workflow.id
  ) {
    const result: WorkflowExecutionResult = {
      workflowId: input.workflow.id,
      status: "failed",
      startedAt,
      completedAt: Date.now(),
      message: "Only the active workflow can be executed.",
      logs: [],
      error: "execute_failed",
    };
    yield { type: "error", message: result.message ?? "execute_failed", result };
    yield { type: "done", result, checkpoint: null };
    return;
  }

  const orderedNodes = sortNodesForExecution(input.workflow);
  const orderedNodeIds = orderedNodes.map((node) => node.id);

  if (orderedNodes.length === 0) {
    const result: WorkflowExecutionResult = {
      workflowId: input.workflow.id,
      status: "failed",
      startedAt,
      completedAt: Date.now(),
      message: "Workflow has no nodes to execute.",
      logs: [],
      error: "empty_workflow",
    };
    yield { type: "error", message: result.message ?? "empty_workflow", result };
    yield { type: "done", result, checkpoint: null };
    return;
  }

  let logs: WorkflowExecutionLogEntry[] = input.checkpoint?.logs
    ? [...input.checkpoint.logs]
    : [];
  let context =
    input.checkpoint?.context ??
    `Workflow: ${input.workflow.name}${input.workflow.description ? `\nDescription: ${input.workflow.description}` : ""}`;
  let nextIndex = input.checkpoint?.nextNodeIndex ?? 0;

  if (input.checkpoint && input.resumeAction) {
    if (input.resumeAction === "reject") {
      const rejected = applyResumeActionToCheckpoint(
        input.checkpoint,
        "reject",
        input.resumeNote,
      );
      logs = rejected.logs;
      const result = checkpointToExecutionResult(
        rejected,
        "failed",
        input.resumeNote?.trim() || "Workflow rejected at approval gate.",
      );
      yield { type: "done", result, checkpoint: null };
      return;
    }

    const resumed = applyResumeActionToCheckpoint(
      input.checkpoint,
      input.resumeAction,
      input.resumeNote,
    );
    logs = resumed.logs;
    context = resumed.context;
    nextIndex = resumed.nextNodeIndex;
  }

  yield {
    type: "start",
    workflowId: input.workflow.id,
    startedAt,
    totalNodes: orderedNodes.length,
  };

  try {
    for (let index = nextIndex; index < orderedNodes.length; index += 1) {
      const node = orderedNodes[index]!;
      const stepStarted = Date.now();
      const logBase = {
        nodeId: node.id,
        label: node.data.label,
        kind: node.data.kind,
        startedAt: stepStarted,
      };

      if (node.data.kind === "trigger") {
        const schedule = parseTriggerSchedule(node);
        const delayMs = getServerDelayMs(schedule);

        if (schedule.type !== "immediate" && delayMs > 0) {
          const waitingLog: WorkflowExecutionLogEntry = {
            ...logBase,
            status: "running",
            message: `Scheduled: ${formatScheduleLabel(schedule, input.locale)}`,
          };
          logs = pushOrUpdateLog(logs, waitingLog);
          yield { type: "progress", log: waitingLog, logs: [...logs] };
          await delay(delayMs);
        } else if (schedule.type === "daily" || schedule.type === "weekly") {
          const label = formatScheduleLabel(schedule, input.locale);
          const scheduledLog: WorkflowExecutionLogEntry = {
            ...logBase,
            status: "completed",
            output: `Schedule registered: ${label}`,
            message: label,
            completedAt: Date.now(),
          };
          logs = pushOrUpdateLog(logs, scheduledLog);
          yield {
            type: "scheduled",
            nextRunAt: Date.now(),
            label,
            logs: [...logs],
          };
          context += `\n\n[trigger] ${node.data.label}: ${label}`;
          yield { type: "progress", log: scheduledLog, logs: [...logs] };
          continue;
        }

        const output = `Triggered: ${node.data.label}`;
        context += `\n\n[trigger] ${node.data.label}: ${output}`;
        const log: WorkflowExecutionLogEntry = {
          ...logBase,
          status: "completed",
          output,
          message: "Trigger acknowledged",
          completedAt: Date.now(),
        };
        logs = pushOrUpdateLog(logs, log);
        yield { type: "progress", log, logs: [...logs] };
        continue;
      }

      if (node.data.kind === "approval") {
        const approvalLog: WorkflowExecutionLogEntry = {
          ...logBase,
          status: "awaiting_approval",
          message: "Waiting for human approval",
          output: getNodePrompt(node),
        };
        logs = pushOrUpdateLog(logs, approvalLog);
        yield { type: "progress", log: approvalLog, logs: [...logs] };

        const checkpoint = buildCheckpoint({
          workflow: input.workflow,
          locale: input.locale,
          startedAt,
          context,
          logs,
          nextNodeIndex: index,
          orderedNodeIds,
          node,
          pauseReason: "approval",
        });

        yield { type: "approval_required", checkpoint, logs: [...logs] };
        const result = checkpointToExecutionResult(
          checkpoint,
          "awaiting_approval",
          `Approval required at "${node.data.label}".`,
        );
        yield { type: "done", result, checkpoint };
        return;
      }

      const maxRetries = getNodeMaxRetries(node);
      let retryCount = 0;
      let stepSucceeded = false;
      let lastError = "Step failed.";

      while (!stepSucceeded && retryCount <= maxRetries) {
        const resolvedAction = resolveWorkflowNodeAction(node, context);
        const runningMessage =
          retryCount > 0
            ? `Retry ${retryCount}/${maxRetries}…`
            : resolvedAction.id === "llm"
              ? "Running…"
              : `Running ${resolvedAction.id.replace(/_/g, " ")}…`;

        const runningLog: WorkflowExecutionLogEntry = {
          ...logBase,
          status: "running",
          actionId: resolvedAction.id,
          message: runningMessage,
        };
        logs = pushOrUpdateLog(logs, runningLog);
        yield { type: "progress", log: runningLog, logs: [...logs] };

        try {
          const stepResult = await executeWorkflowNodeStep({
            locale: input.locale,
            node,
            priorContext: context,
          });

          if (!stepResult.success) {
            throw new Error(stepResult.message);
          }

          const output = stepResult.output;
          context += `\n\n[${node.data.kind}] ${node.data.label}: ${output}`;

          if (workflowActionRequiresClientDispatch(stepResult.action)) {
            yield {
              type: "tool_action",
              nodeId: node.id,
              action: stepResult.action,
              dispatch: stepResult.dispatch,
              output,
              message: stepResult.message,
              logs: [...logs],
            };
          }

          const completedLog: WorkflowExecutionLogEntry = {
            ...logBase,
            status: "completed",
            actionId: stepResult.action.id,
            output,
            message: stepResult.message,
            completedAt: Date.now(),
          };
          logs = pushOrUpdateLog(logs, completedLog);
          yield { type: "progress", log: completedLog, logs: [...logs] };
          stepSucceeded = true;

          if (
            node.data.kind === "condition" &&
            output.toUpperCase().startsWith("NO")
          ) {
            const skippedLog: WorkflowExecutionLogEntry = {
              nodeId: node.id,
              label: node.data.label,
              kind: node.data.kind,
              status: "skipped",
              message: "Condition evaluated to NO — downstream branches skipped",
              startedAt: Date.now(),
              completedAt: Date.now(),
            };
            logs.push(skippedLog);
            yield { type: "progress", log: skippedLog, logs: [...logs] };
            const result: WorkflowExecutionResult = {
              workflowId: input.workflow.id,
              status: "completed",
              startedAt,
              completedAt: Date.now(),
              message: `Workflow "${input.workflow.name}" stopped at condition NO.`,
              logs: [...logs],
              output: context,
            };
            yield { type: "done", result, checkpoint: null };
            return;
          }
        } catch (error) {
          lastError =
            error instanceof Error ? error.message : "Workflow step failed.";
          retryCount += 1;

          if (retryCount <= maxRetries) {
            const retryLog: WorkflowExecutionLogEntry = {
              ...logBase,
              status: "running",
              message: `Retrying (${retryCount}/${maxRetries})…`,
            };
            logs = pushOrUpdateLog(logs, retryLog);
            yield { type: "progress", log: retryLog, logs: [...logs] };
            continue;
          }

          const failedLog: WorkflowExecutionLogEntry = {
            ...logBase,
            status: "failed",
            message: lastError,
            completedAt: Date.now(),
          };
          logs = pushOrUpdateLog(logs, failedLog);
          yield { type: "progress", log: failedLog, logs: [...logs] };

          const suggestion = suggestWorkflowErrorRecovery({
            node,
            errorMessage: lastError,
            locale: input.locale,
          });

          const checkpoint = buildCheckpoint({
            workflow: input.workflow,
            locale: input.locale,
            startedAt,
            context,
            logs,
            nextNodeIndex: index,
            orderedNodeIds,
            node,
            pauseReason: "recovery",
            errorMessage: lastError,
            errorSuggestion: suggestion,
            retryCount: maxRetries,
            maxRetries,
          });

          yield { type: "recovery_required", checkpoint, logs: [...logs] };
          const result = checkpointToExecutionResult(
            checkpoint,
            "paused",
            lastError,
          );
          result.error = "execute_failed";
          yield { type: "done", result, checkpoint };
          return;
        }
      }
    }

    const result: WorkflowExecutionResult = {
      workflowId: input.workflow.id,
      status: "completed",
      startedAt,
      completedAt: Date.now(),
      message: `Workflow "${input.workflow.name}" completed successfully.`,
      logs: [...logs],
      output: context,
    };
    yield { type: "done", result, checkpoint: null };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Workflow execution failed.";

    const runningNode = [...logs]
      .reverse()
      .find((log) => log.status === "running" || log.status === "awaiting_approval");
    if (runningNode) {
      const failedLog: WorkflowExecutionLogEntry = {
        ...runningNode,
        status: "failed",
        message,
        completedAt: Date.now(),
      };
      logs = pushOrUpdateLog(logs, failedLog);
      yield { type: "progress", log: failedLog, logs: [...logs] };
    }

    const result: WorkflowExecutionResult = {
      workflowId: input.workflow.id,
      status: "failed",
      startedAt,
      completedAt: Date.now(),
      message,
      logs: [...logs],
      error: "execute_failed",
    };
    yield { type: "error", message, result };
    yield { type: "done", result, checkpoint: null };
  }
}

export async function executeChatWorkflow(
  input: ExecuteChatWorkflowInput,
): Promise<WorkflowExecutionResult> {
  let result: WorkflowExecutionResult | null = null;

  for await (const event of executeChatWorkflowStream(input)) {
    if (event.type === "done") {
      result = event.result;
    } else if (event.type === "error" && event.result) {
      result = event.result;
    }
  }

  if (!result) {
    return {
      workflowId: input.workflow.id,
      status: "failed",
      startedAt: Date.now(),
      completedAt: Date.now(),
      message: "Workflow execution returned no result.",
      logs: [],
      error: "execute_failed",
    };
  }

  return result;
}