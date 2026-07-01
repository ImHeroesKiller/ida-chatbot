import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import { loadAppConfig } from "@/lib/admin/config";
import { getProviderApiKey } from "@/lib/admin/models";
import { resolveToolModel } from "@/lib/admin/tool-model";
import type { Locale } from "@/lib/config";
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
}

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

  return text.trim();
}

/**
 * Execute a chat workflow sequentially (LangGraph-inspired, no approval gates).
 * Each actionable node runs through the configured workflow/agent model.
 */
export async function executeChatWorkflow(
  input: ExecuteChatWorkflowInput,
): Promise<WorkflowExecutionResult> {
  const startedAt = Date.now();
  const orderedNodes = sortNodesForExecution(input.workflow);

  if (orderedNodes.length === 0) {
    return {
      workflowId: input.workflow.id,
      status: "failed",
      startedAt,
      completedAt: Date.now(),
      message: "Workflow has no nodes to execute.",
      logs: [],
      error: "empty_workflow",
    };
  }

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
        logs.push({
          ...logBase,
          status: "completed",
          output,
          message: "Trigger acknowledged",
          completedAt: Date.now(),
        });
        continue;
      }

      logs.push({ ...logBase, status: "running" });

      const output = await runLlmStep({
        locale: input.locale,
        node,
        priorContext: context,
      });

      context += `\n\n[${node.data.kind}] ${node.data.label}: ${output}`;

      logs.push({
        ...logBase,
        status: "completed",
        output,
        message: "Step completed",
        completedAt: Date.now(),
      });

      if (
        node.data.kind === "condition" &&
        output.toUpperCase().startsWith("NO")
      ) {
        logs.push({
          nodeId: node.id,
          label: node.data.label,
          kind: node.data.kind,
          status: "skipped",
          message: "Condition evaluated to NO — downstream branches skipped",
          startedAt: Date.now(),
          completedAt: Date.now(),
        });
        break;
      }
    }

    const completedAt = Date.now();
    return {
      workflowId: input.workflow.id,
      status: "completed",
      startedAt,
      completedAt,
      message: `Workflow "${input.workflow.name}" completed successfully.`,
      logs,
      output: context,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Workflow execution failed.";

    return {
      workflowId: input.workflow.id,
      status: "failed",
      startedAt,
      completedAt: Date.now(),
      message,
      logs,
      error: "execute_failed",
    };
  }
}