import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import { loadAppConfig } from "@/lib/admin/config";
import { getProviderApiKey } from "@/lib/admin/models";
import { resolveToolModel } from "@/lib/admin/tool-model";
import type { Locale } from "@/lib/config";
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
  /** Must match workflow.id — rejects cross-workflow execution attempts. */
  activeWorkflowId?: string;
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
  | { type: "done"; result: WorkflowExecutionResult }
  | { type: "error"; message: string; result?: WorkflowExecutionResult };

function sortNodesForExecution(workflow: WorkflowDefinition): WorkflowNode[] {
  const nodes = [...workflow.nodes];
  if (nodes.length === 0) return [];

  const incoming = new Map<string, number>();
  for (const node of nodes) {
    incoming.set(node.id, 0);
  }
  for (const edge of workflow.edges) {
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
  }

  const triggers = nodes.filter((node) => node.data.kind === "trigger");
  const queue = [
    ...(triggers.length > 0
      ? triggers
      : nodes.filter((node) => (incoming.get(node.id) ?? 0) === 0)),
  ];

  const visited = new Set<string>();
  const ordered: WorkflowNode[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);
    ordered.push(current);

    for (const edge of workflow.edges) {
      if (edge.source !== current.id) continue;
      const target = nodes.find((node) => node.id === edge.target);
      if (target && !visited.has(target.id)) {
        queue.push(target);
      }
    }
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      ordered.push(node);
    }
  }

  return ordered;
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
  if (entry.status !== "running") {
    for (let index = logs.length - 1; index >= 0; index -= 1) {
      const current = logs[index];
      if (current.nodeId === entry.nodeId && current.status === "running") {
        const next = [...logs];
        next[index] = entry;
        return next;
      }
    }
  }

  return [...logs, entry];
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

  const trimmed = text.trim();

  console.info("[workflow:execute] llm step output", {
    nodeId: options.node.id,
    label: options.node.data.label,
    kind: options.node.data.kind,
    outputPreview: trimmed.slice(0, 500),
    outputLength: trimmed.length,
  });

  return trimmed;
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

  if (node.data.kind === "condition" || action.id === "llm") {
    const output = await runLlmStep({
      locale,
      node,
      priorContext,
    });
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

/**
 * Execute a chat workflow sequentially, yielding per-node progress events.
 */
export async function* executeChatWorkflowStream(
  input: ExecuteChatWorkflowInput,
): AsyncGenerator<WorkflowExecuteProgressEvent> {
  const startedAt = Date.now();

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
    yield {
      type: "error",
      message: result.message ?? "execute_failed",
      result,
    };
    yield { type: "done", result };
    return;
  }

  const orderedNodes = sortNodesForExecution(input.workflow);

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
    yield { type: "done", result };
    return;
  }

  yield {
    type: "start",
    workflowId: input.workflow.id,
    startedAt,
    totalNodes: orderedNodes.length,
  };

  const logs: WorkflowExecutionLogEntry[] = [];
  let context = `Workflow: ${input.workflow.name}`;
  if (input.workflow.description) {
    context += `\nDescription: ${input.workflow.description}`;
  }

  try {
    for (const node of orderedNodes) {
      const stepStarted = Date.now();
      const logBase = {
        nodeId: node.id,
        label: node.data.label,
        kind: node.data.kind,
        startedAt: stepStarted,
      };

      if (node.data.kind === "trigger") {
        const output = `Triggered: ${node.data.label}`;
        context += `\n\n[${node.data.kind}] ${node.data.label}: ${output}`;
        const log: WorkflowExecutionLogEntry = {
          ...logBase,
          status: "completed",
          output,
          message: "Trigger acknowledged",
          completedAt: Date.now(),
        };
        const nextLogs = pushOrUpdateLog(logs, log);
        logs.splice(0, logs.length, ...nextLogs);
        yield { type: "progress", log, logs: [...logs] };
        continue;
      }

      const resolvedAction = resolveWorkflowNodeAction(node, context);
      const runningMessage =
        resolvedAction.id === "llm"
          ? "Running…"
          : `Running ${resolvedAction.id.replace(/_/g, " ")}…`;

      const runningLog: WorkflowExecutionLogEntry = {
        ...logBase,
        status: "running",
        actionId: resolvedAction.id,
        message: runningMessage,
      };
      let nextLogs = pushOrUpdateLog(logs, runningLog);
      logs.splice(0, logs.length, ...nextLogs);
      yield { type: "progress", log: runningLog, logs: [...logs] };

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
      nextLogs = pushOrUpdateLog(logs, completedLog);
      logs.splice(0, logs.length, ...nextLogs);
      yield { type: "progress", log: completedLog, logs: [...logs] };

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
        break;
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
    yield { type: "done", result };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Workflow execution failed.";

    const runningNode = [...logs].reverse().find((log) => log.status === "running");
    if (runningNode) {
      const failedLog: WorkflowExecutionLogEntry = {
        ...runningNode,
        status: "failed",
        message,
        completedAt: Date.now(),
      };
      const nextLogs = pushOrUpdateLog(logs, failedLog);
      logs.splice(0, logs.length, ...nextLogs);
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
    yield { type: "done", result };
  }
}

/**
 * Execute a chat workflow sequentially (LangGraph-inspired, no approval gates).
 * Each actionable node runs through the configured workflow/agent model.
 */
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