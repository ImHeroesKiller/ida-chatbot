import { IDA_CONFIG } from "@/lib/config";
import { executeResearch } from "@/lib/tools/research";
import { executeWebSearch } from "@/lib/tools/web-search";
import type { Locale } from "@/lib/config";
import type { ResearchDepth } from "@/lib/research-types";
import type { WorkflowNode } from "@/lib/workflow";
import { cleanWorksheetWorkflowOutput } from "@/lib/worksheet-workflow-output";
import { getWorkflowNodePrompt } from "@/lib/workflow";

/** IDA tool actions a workflow node can invoke (stored in `node.data.config`). */
export type WorkflowNodeActionId =
  | "llm"
  | "web_search"
  | "research"
  | "worksheet_update"
  | "map_pin";

export type WorkflowNodeActionRuntime = "llm" | "server" | "client";

export interface WorkflowNodeActionDefinition {
  id: WorkflowNodeActionId;
  label: string;
  description: string;
  runtime: WorkflowNodeActionRuntime;
  /** Config keys shown in the properties sidebar. */
  paramFields: Array<{
    key: string;
    label: string;
    placeholder?: string;
    multiline?: boolean;
  }>;
}

export interface ResolvedWorkflowNodeAction {
  id: WorkflowNodeActionId;
  runtime: WorkflowNodeActionRuntime;
  params: Record<string, string>;
}

export interface WorkflowServerActionResult {
  success: boolean;
  output: string;
  message: string;
  /** Extra fields for client coordinator dispatch (map coords, worksheet body). */
  dispatch?: Record<string, string>;
}

export const WORKFLOW_NODE_ACTIONS: WorkflowNodeActionDefinition[] = [
  {
    id: "llm",
    label: "LLM step",
    description: "Run the configured prompt through the workflow model.",
    runtime: "llm",
    paramFields: [],
  },
  {
    id: "web_search",
    label: "Web search",
    description: "Search the web and feed snippets into the workflow context.",
    runtime: "server",
    paramFields: [
      {
        key: "query",
        label: "Search query",
        placeholder: "e.g. latest BPJS rules 2026",
      },
    ],
  },
  {
    id: "research",
    label: "Research",
    description: "Run multi-query research and summarize findings.",
    runtime: "server",
    paramFields: [
      {
        key: "topic",
        label: "Research topic",
        placeholder: "Topic to investigate",
      },
      {
        key: "depth",
        label: "Depth (quick | standard | deep)",
        placeholder: "standard",
      },
    ],
  },
  {
    id: "worksheet_update",
    label: "Worksheet update",
    description: "Create or update a worksheet document in the chat.",
    runtime: "client",
    paramFields: [
      {
        key: "title",
        label: "Document title",
        placeholder: "Workflow output",
      },
      {
        key: "content",
        label: "Content (supports {{context}})",
        placeholder: "{{context}}",
        multiline: true,
      },
    ],
  },
  {
    id: "map_pin",
    label: "Map pin",
    description: "Geocode a place and drop a pin on the map panel.",
    runtime: "server",
    paramFields: [
      {
        key: "query",
        label: "Location query",
        placeholder: "e.g. Monas Jakarta",
      },
      {
        key: "label",
        label: "Marker label",
        placeholder: "Optional label",
      },
    ],
  },
];

const ACTION_BY_ID = Object.fromEntries(
  WORKFLOW_NODE_ACTIONS.map((action) => [action.id, action]),
) as Record<WorkflowNodeActionId, WorkflowNodeActionDefinition>;

export function getWorkflowNodeActionDefinition(
  actionId: WorkflowNodeActionId | string | undefined,
): WorkflowNodeActionDefinition {
  if (actionId && actionId in ACTION_BY_ID) {
    return ACTION_BY_ID[actionId as WorkflowNodeActionId];
  }
  return ACTION_BY_ID.llm;
}

const WORKFLOW_ACTION_ALIASES: Record<string, WorkflowNodeActionId> = {
  websearch: "web_search",
  "web search": "web_search",
  web_search: "web_search",
  worksheet: "worksheet_update",
  "worksheet update": "worksheet_update",
  worksheet_update: "worksheet_update",
  mappin: "map_pin",
  "map pin": "map_pin",
  map_pin: "map_pin",
  research: "research",
  llm: "llm",
};

/** Resolve a tool/action string from chat edits, aliases, or config fields. */
export function resolveWorkflowActionId(raw: unknown): WorkflowNodeActionId | null {
  if (typeof raw !== "string" || !raw.trim()) return null;

  const trimmed = raw.trim().toLowerCase();
  const underscored = trimmed.replace(/[\s-]+/g, "_");

  if (underscored in ACTION_BY_ID) {
    return underscored as WorkflowNodeActionId;
  }
  if (trimmed in WORKFLOW_ACTION_ALIASES) {
    return WORKFLOW_ACTION_ALIASES[trimmed];
  }
  if (underscored in WORKFLOW_ACTION_ALIASES) {
    return WORKFLOW_ACTION_ALIASES[underscored];
  }

  return null;
}

export function readNodeConfigActionId(
  config: Record<string, unknown> | undefined,
): WorkflowNodeActionId | null {
  if (!config) return null;
  return (
    resolveWorkflowActionId(config.action) ??
    resolveWorkflowActionId(config.tool)
  );
}

export function parseWorkflowNodeActionId(
  raw: unknown,
): WorkflowNodeActionId {
  return resolveWorkflowActionId(raw) ?? "llm";
}

export function readWorkflowNodeActionParams(
  node: WorkflowNode,
): Record<string, string> {
  const config = node.data.config;
  if (!config || typeof config !== "object") return {};

  const raw = config.actionParams;
  if (!raw || typeof raw !== "object") return {};

  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") {
      params[key] = value;
    }
  }
  return params;
}

/** Substitute `{{context}}`, `{{prompt}}`, and `{{label}}` in action param templates. */
export function resolveWorkflowActionTemplates(
  template: string,
  context: {
    workflowContext: string;
    prompt: string;
    label: string;
  },
): string {
  return template
    .replace(/\{\{context\}\}/gi, context.workflowContext)
    .replace(/\{\{prompt\}\}/gi, context.prompt)
    .replace(/\{\{label\}\}/gi, context.label)
    .trim();
}

export function resolveWorkflowNodeAction(
  node: WorkflowNode,
  workflowContext: string,
): ResolvedWorkflowNodeAction {
  const config = node.data.config;
  const actionId =
    readNodeConfigActionId(
      config && typeof config === "object"
        ? (config as Record<string, unknown>)
        : undefined,
    ) ?? "llm";
  const definition = getWorkflowNodeActionDefinition(actionId);
  const rawParams = readWorkflowNodeActionParams(node);
  const prompt = getWorkflowNodePrompt(node);

  const params: Record<string, string> = {};
  for (const field of definition.paramFields) {
    const resolved = resolveWorkflowActionTemplates(
      rawParams[field.key] ?? "",
      {
        workflowContext,
        prompt,
        label: node.data.label,
      },
    );
    if (resolved) {
      params[field.key] = resolved;
    }
  }

  if (actionId === "web_search" && !params.query) {
    params.query = prompt;
  }
  if (actionId === "research" && !params.topic) {
    params.topic = prompt;
  }
  if (actionId === "map_pin" && !params.query) {
    params.query = prompt;
  }
  if (actionId === "research" && !params.depth) {
    params.depth = "standard";
  }
  if (actionId === "worksheet_update" && !params.content) {
    params.content = workflowContext;
  }
  if (actionId === "worksheet_update" && !params.title) {
    params.title = node.data.label;
  }

  return {
    id: actionId,
    runtime: definition.runtime,
    params,
  };
}

export function isClientWorkflowAction(
  action: ResolvedWorkflowNodeAction,
): boolean {
  return action.runtime === "client" && action.id !== "llm";
}

export function isServerWorkflowAction(
  action: ResolvedWorkflowNodeAction,
): boolean {
  return action.runtime === "server";
}

interface NominatimSearchItem {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
}

export async function geocodeWorkflowLocation(
  query: string,
): Promise<{ lat: number; lng: number; label: string } | null> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", trimmed.slice(0, 200));
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "0");

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": `${IDA_CONFIG.name}-Chatbot/1.0 (workflow-map-pin)`,
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as NominatimSearchItem[];
    const item = data[0];
    if (!item) return null;

    const lat = Number.parseFloat(item.lat);
    const lng = Number.parseFloat(item.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return {
      lat,
      lng,
      label: item.display_name,
    };
  } catch {
    return null;
  }
}

export function workflowActionRequiresClientDispatch(
  action: ResolvedWorkflowNodeAction,
): boolean {
  return action.id === "worksheet_update" || action.id === "map_pin";
}

export async function executeServerWorkflowAction(
  action: ResolvedWorkflowNodeAction,
  options: { locale: Locale; workflowContext: string },
): Promise<WorkflowServerActionResult> {
  switch (action.id) {
    case "web_search": {
      const query = action.params.query?.trim();
      if (!query) {
        return {
          success: false,
          output: "",
          message: "Web search query is empty.",
        };
      }

      const result = await executeWebSearch({ query });
      return {
        success: result.success,
        output: result.formattedForLlm,
        message: result.success
          ? `Web search completed (${result.sources.length} sources).`
          : result.error ?? "Web search returned no results.",
      };
    }

    case "research": {
      const topic = action.params.topic?.trim();
      if (!topic) {
        return {
          success: false,
          output: "",
          message: "Research topic is empty.",
        };
      }

      const depth = (action.params.depth?.trim() || "standard") as ResearchDepth;
      const safeDepth: ResearchDepth =
        depth === "quick" || depth === "deep" ? depth : "standard";

      const result = await executeResearch({
        topic,
        depth: safeDepth,
      });

      return {
        success: result.success,
        output: result.formattedForLlm,
        message: result.success
          ? `Research completed (${result.sources.length} sources).`
          : result.error ?? "Research returned no results.",
      };
    }

    case "map_pin": {
      const query = action.params.query?.trim();
      if (!query) {
        return {
          success: false,
          output: "",
          message: "Map pin location query is empty.",
        };
      }

      const location = await geocodeWorkflowLocation(query);
      if (!location) {
        return {
          success: false,
          output: "",
          message: `Could not geocode "${query}".`,
        };
      }

      const label = action.params.label?.trim() || location.label;
      return {
        success: true,
        output: `${label} — ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`,
        message: `Geocoded map pin: ${label}.`,
        dispatch: {
          query: query,
          label,
          lat: String(location.lat),
          lng: String(location.lng),
        },
      };
    }

    case "worksheet_update": {
      const title = action.params.title?.trim() || "Workflow output";
      const rawContent =
        action.params.content?.trim() ||
        options.workflowContext.trim() ||
        "Workflow step produced no worksheet content.";
      const content = cleanWorksheetWorkflowOutput(rawContent, {
        workflowContext: options.workflowContext,
        title,
      });

      return {
        success: true,
        output: content.slice(0, 4000),
        message: `Worksheet content prepared: "${title}".`,
        dispatch: {
          title,
          content: content || rawContent,
        },
      };
    }

    default:
      return {
        success: false,
        output: "",
        message: `Action "${action.id}" is not executable on the server.`,
      };
  }
}