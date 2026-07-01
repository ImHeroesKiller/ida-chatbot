import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import { loadAppConfig } from "@/lib/admin/config";
import { getProviderApiKey } from "@/lib/admin/models";
import { resolveToolModel } from "@/lib/admin/tool-model";
import type { Locale } from "@/lib/config";
import {
  executeServerWorkflowAction,
  workflowActionRequiresClientDispatch,
  type ResolvedWorkflowNodeAction,
} from "@/lib/workflow-actions";
import type { WorkflowNode } from "@/lib/workflow";

import type { MultiAgentActivity, MultiAgentId } from "./types";
import type { MultiAgentGraphState } from "./state";

function createActivityId(): string {
  return `ma-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function appendAgentActivity(
  state: MultiAgentGraphState,
  partial: Omit<MultiAgentActivity, "id" | "nodeId" | "nodeLabel" | "startedAt"> &
    Partial<Pick<MultiAgentActivity, "startedAt">>,
): MultiAgentActivity[] {
  const activity: MultiAgentActivity = {
    id: createActivityId(),
    nodeId: state.node.id,
    nodeLabel: state.node.data.label,
    startedAt: partial.startedAt ?? Date.now(),
    agentId: partial.agentId,
    status: partial.status,
    message: partial.message,
    output: partial.output,
    completedAt: partial.completedAt,
  };
  return [activity];
}

async function invokeAgentLlm(options: {
  locale: Locale;
  agentId: MultiAgentId;
  systemInstruction: string;
  userPrompt: string;
}): Promise<string> {
  const appConfig = await loadAppConfig();
  const selected = resolveToolModel(appConfig, "workflow", "agent");
  const apiKey = getProviderApiKey(selected.provider);

  if (!apiKey || selected.provider !== "google") {
    throw new Error("Multi-agent workflow model is not configured.");
  }

  const model = new ChatGoogleGenerativeAI({
    apiKey,
    model: selected.id,
    temperature: 0.35,
  });

  const languageRule =
    options.locale === "id"
      ? "Jawab dalam Bahasa Indonesia."
      : options.locale === "zh"
        ? "请用中文回答。"
        : "Reply in English.";

  const response = await model.invoke([
    new SystemMessage(
      `You are IDA multi-agent "${options.agentId}".
${languageRule}
${options.systemInstruction}`,
    ),
    new HumanMessage(options.userPrompt),
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

async function runResearcherAgent(
  state: MultiAgentGraphState,
): Promise<Partial<MultiAgentGraphState>> {
  const running = appendAgentActivity(state, {
    agentId: "researcher",
    status: "running",
    message:
      state.action.id === "research"
        ? "Running multi-query research…"
        : "Searching the web…",
  });

  try {
    let output = "";
    let message = "Research completed";
    let dispatch: Record<string, string> | undefined;
    let success = true;

    if (state.action.id === "llm") {
      output = await invokeAgentLlm({
        locale: state.locale,
        agentId: "researcher",
        systemInstruction:
          "Gather and synthesize relevant facts from the workflow context. Be concise and cite key points.",
        userPrompt: `Workflow context:\n${state.workflowContext}\n\nTask: ${state.prompt}`,
      });
    } else {
      const toolResult = await executeServerWorkflowAction(state.action, {
        locale: state.locale,
        workflowContext: state.workflowContext,
      });
      output = toolResult.output || toolResult.message;
      message = toolResult.message;
      dispatch = toolResult.dispatch;
      success = toolResult.success;
      if (!success) {
        throw new Error(message);
      }
    }

    const completed = appendAgentActivity(
      { ...state, activities: [...state.activities, ...running] },
      {
        agentId: "researcher",
        status: "completed",
        message,
        output: output.slice(0, 600),
        completedAt: Date.now(),
      },
    );

    return {
      activities: [...running, ...completed],
      stepComplete: true,
      result: {
        success: true,
        output,
        message,
        dispatch,
        activities: [...state.activities, ...running, ...completed],
        assignedAgent: "researcher",
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Researcher agent failed.";
    const failed = appendAgentActivity(
      { ...state, activities: [...state.activities, ...running] },
      {
        agentId: "researcher",
        status: "failed",
        message,
        completedAt: Date.now(),
      },
    );
    return {
      activities: [...running, ...failed],
      stepComplete: true,
      error: message,
      result: {
        success: false,
        output: "",
        message,
        activities: [...state.activities, ...running, ...failed],
        assignedAgent: "researcher",
      },
    };
  }
}

async function runAnalystAgent(
  state: MultiAgentGraphState,
): Promise<Partial<MultiAgentGraphState>> {
  const running = appendAgentActivity(state, {
    agentId: "analyst",
    status: "running",
    message:
      state.node.data.kind === "condition"
        ? "Evaluating condition…"
        : "Analyzing workflow step…",
  });

  try {
    const kindHint =
      state.node.data.kind === "condition"
        ? "Start with YES or NO on the first line, then a short rationale."
        : "Return concise actionable analysis.";

    const output = await invokeAgentLlm({
      locale: state.locale,
      agentId: "analyst",
      systemInstruction: `Analyze the workflow step. ${kindHint}`,
      userPrompt: `Workflow context:\n${state.workflowContext}\n\nNode: ${state.node.data.label}\nPrompt: ${state.prompt}`,
    });

    const completed = appendAgentActivity(
      { ...state, activities: [...state.activities, ...running] },
      {
        agentId: "analyst",
        status: "completed",
        message: "Analysis completed",
        output: output.slice(0, 600),
        completedAt: Date.now(),
      },
    );

    return {
      activities: [...running, ...completed],
      stepComplete: true,
      result: {
        success: true,
        output,
        message: "Analysis completed",
        activities: [...state.activities, ...running, ...completed],
        assignedAgent: "analyst",
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Analyst agent failed.";
    const failed = appendAgentActivity(
      { ...state, activities: [...state.activities, ...running] },
      {
        agentId: "analyst",
        status: "failed",
        message,
        completedAt: Date.now(),
      },
    );
    return {
      activities: [...running, ...failed],
      stepComplete: true,
      error: message,
      result: {
        success: false,
        output: "",
        message,
        activities: [...state.activities, ...running, ...failed],
        assignedAgent: "analyst",
      },
    };
  }
}

async function runExecutorAgent(
  state: MultiAgentGraphState,
): Promise<Partial<MultiAgentGraphState>> {
  const running = appendAgentActivity(state, {
    agentId: "executor",
    status: "running",
    message: `Executing ${state.action.id.replace(/_/g, " ")}…`,
  });

  try {
    let output = "";
    let message = "Execution completed";
    let dispatch: Record<string, string> | undefined;
    let success = true;

    if (workflowActionRequiresClientDispatch(state.action)) {
      output = state.prompt;
      message = `Prepared client dispatch for ${state.action.id}.`;
      dispatch =
        state.action.id === "worksheet_update"
          ? {
              title: state.action.params.title ?? state.node.data.label,
              content: state.action.params.content ?? state.workflowContext,
            }
          : {
              query: state.action.params.query ?? state.prompt,
              label: state.action.params.label ?? state.node.data.label,
            };
    } else if (state.action.runtime === "server") {
      const toolResult = await executeServerWorkflowAction(state.action, {
        locale: state.locale,
        workflowContext: state.workflowContext,
      });
      output = toolResult.output || toolResult.message;
      message = toolResult.message;
      dispatch = toolResult.dispatch;
      success = toolResult.success;
      if (!success) throw new Error(message);
    } else {
      output = await invokeAgentLlm({
        locale: state.locale,
        agentId: "executor",
        systemInstruction: "Execute the automation step and return concise output.",
        userPrompt: `Workflow context:\n${state.workflowContext}\n\nTask: ${state.prompt}`,
      });
    }

    const completed = appendAgentActivity(
      { ...state, activities: [...state.activities, ...running] },
      {
        agentId: "executor",
        status: "completed",
        message,
        output: output.slice(0, 600),
        completedAt: Date.now(),
      },
    );

    return {
      activities: [...running, ...completed],
      stepComplete: true,
      result: {
        success: true,
        output,
        message,
        dispatch,
        activities: [...state.activities, ...running, ...completed],
        assignedAgent: "executor",
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Executor agent failed.";
    const failed = appendAgentActivity(
      { ...state, activities: [...state.activities, ...running] },
      {
        agentId: "executor",
        status: "failed",
        message,
        completedAt: Date.now(),
      },
    );
    return {
      activities: [...running, ...failed],
      stepComplete: true,
      error: message,
      result: {
        success: false,
        output: "",
        message,
        activities: [...state.activities, ...running, ...failed],
        assignedAgent: "executor",
      },
    };
  }
}

async function runApproverAgent(
  state: MultiAgentGraphState,
): Promise<Partial<MultiAgentGraphState>> {
  const running = appendAgentActivity(state, {
    agentId: "approver",
    status: "running",
    message: "Preparing approval summary…",
  });

  try {
    const output = await invokeAgentLlm({
      locale: state.locale,
      agentId: "approver",
      systemInstruction:
        "Summarize what requires human approval. Be concise and actionable.",
      userPrompt: `Workflow context:\n${state.workflowContext}\n\nApproval gate: ${state.node.data.label}\nPrompt: ${state.prompt}`,
    });

    const completed = appendAgentActivity(
      { ...state, activities: [...state.activities, ...running] },
      {
        agentId: "approver",
        status: "completed",
        message: "Awaiting human approval",
        output: output.slice(0, 600),
        completedAt: Date.now(),
      },
    );

    return {
      activities: [...running, ...completed],
      stepComplete: true,
      result: {
        success: true,
        output,
        message: "Awaiting human approval",
        activities: [...state.activities, ...running, ...completed],
        assignedAgent: "approver",
        awaitingApproval: true,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Approver agent failed.";
    const failed = appendAgentActivity(
      { ...state, activities: [...state.activities, ...running] },
      {
        agentId: "approver",
        status: "failed",
        message,
        completedAt: Date.now(),
      },
    );
    return {
      activities: [...running, ...failed],
      stepComplete: true,
      error: message,
      result: {
        success: false,
        output: "",
        message,
        activities: [...state.activities, ...running, ...failed],
        assignedAgent: "approver",
      },
    };
  }
}

async function runDocumenterAgent(
  state: MultiAgentGraphState,
): Promise<Partial<MultiAgentGraphState>> {
  const running = appendAgentActivity(state, {
    agentId: "documenter",
    status: "running",
    message: "Drafting final output…",
  });

  try {
    const output = await invokeAgentLlm({
      locale: state.locale,
      agentId: "documenter",
      systemInstruction:
        "Produce the final workflow output artifact. Use clear structure.",
      userPrompt: `Workflow context:\n${state.workflowContext}\n\nOutput node: ${state.node.data.label}\nPrompt: ${state.prompt}`,
    });

    const completed = appendAgentActivity(
      { ...state, activities: [...state.activities, ...running] },
      {
        agentId: "documenter",
        status: "completed",
        message: "Document drafted",
        output: output.slice(0, 600),
        completedAt: Date.now(),
      },
    );

    return {
      activities: [...running, ...completed],
      stepComplete: true,
      result: {
        success: true,
        output,
        message: "Document drafted",
        activities: [...state.activities, ...running, ...completed],
        assignedAgent: "documenter",
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Documenter agent failed.";
    const failed = appendAgentActivity(
      { ...state, activities: [...state.activities, ...running] },
      {
        agentId: "documenter",
        status: "failed",
        message,
        completedAt: Date.now(),
      },
    );
    return {
      activities: [...running, ...failed],
      stepComplete: true,
      error: message,
      result: {
        success: false,
        output: "",
        message,
        activities: [...state.activities, ...running, ...failed],
        assignedAgent: "documenter",
      },
    };
  }
}

export const MULTI_AGENT_NODE_RUNNERS: Record<
  Exclude<MultiAgentId, "supervisor">,
  (state: MultiAgentGraphState) => Promise<Partial<MultiAgentGraphState>>
> = {
  researcher: runResearcherAgent,
  analyst: runAnalystAgent,
  executor: runExecutorAgent,
  approver: runApproverAgent,
  documenter: runDocumenterAgent,
};

export function buildAgentNode(
  agentId: Exclude<MultiAgentId, "supervisor">,
) {
  return (state: MultiAgentGraphState) => MULTI_AGENT_NODE_RUNNERS[agentId](state);
}