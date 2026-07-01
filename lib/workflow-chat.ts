import type { Locale } from "@/lib/config";
import {
  buildWorkflowPhaseInstructions,
  type WorkflowChatContext,
  type WorkflowChatPhase,
} from "@/lib/workflow-chat-context";
import { resolveWorkflowActionId } from "@/lib/workflow-actions";
import type {
  WorkflowDefinition,
  WorkflowEdge,
  WorkflowErrorCode,
  WorkflowNode,
  WorkflowNodeKind,
} from "@/lib/workflow";

export type {
  WorkflowChatContext,
  WorkflowChatPhase,
  WorkflowChatContextSnapshot,
} from "@/lib/workflow-chat-context";
export {
  buildWorkflowChatContext,
  resolveWorkflowChatPhase,
  serializeWorkflowForChatContext,
} from "@/lib/workflow-chat-context";

/** Primary markers — LLM must use these exactly. */
export const WORKFLOW_START_MARKER = "<<<IDA_WORKFLOW_START>>>";
export const WORKFLOW_END_MARKER = "<<<IDA_WORKFLOW_END>>>";

/** Legacy markers kept for backward-compatible parsing. */
export const WORKFLOW_LEGACY_START_MARKER = "<<<IDA_WORKFLOW>>>";
export const WORKFLOW_LEGACY_END_MARKER = "<<<END_IDA_WORKFLOW>>>";

const WORKFLOW_MARKER_PAIRS: Array<{ start: string; end: string }> = [
  { start: WORKFLOW_START_MARKER, end: WORKFLOW_END_MARKER },
  { start: WORKFLOW_LEGACY_START_MARKER, end: WORKFLOW_LEGACY_END_MARKER },
];

export const WORKFLOW_JSON_SCHEMA_EXAMPLE = `{
  "name": "Workflow Title",
  "description": "Short summary",
  "nodes": [
    {
      "id": "node-1",
      "label": "Trigger",
      "kind": "trigger",
      "description": "When the workflow starts",
      "prompt": "Optional LLM instruction",
      "position": { "x": 120, "y": 80 }
    },
    {
      "id": "node-2",
      "label": "Action Step",
      "kind": "action",
      "description": "What this step does",
      "prompt": "Clear LLM instruction for this step",
      "action": "web_search",
      "actionParams": { "query": "latest regulations 2026" },
      "position": { "x": 168, "y": 152 }
    }
  ],
  "edges": [
    { "id": "edge-1", "source": "node-1", "target": "node-2" }
  ]
}`;

export interface WorkflowStreamNodePayload {
  id: string;
  label: string;
  kind: WorkflowNodeKind;
  description?: string;
  prompt?: string;
  action?: string;
  actionParams?: Record<string, string>;
  config?: Record<string, unknown>;
  position?: { x: number; y: number };
}

export interface WorkflowStreamPayload {
  name: string;
  description?: string;
  nodes: WorkflowStreamNodePayload[];
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
}

export interface WorkflowParseResult {
  chatMessage: string;
  workflow: WorkflowStreamPayload | null;
  error?: WorkflowErrorCode;
}

export interface WorkflowParseDebugInfo {
  candidateCount: number;
  markerHits: number;
  usedMarker?: string;
  preview: string;
  /** Inner payload from the last matched marker block. */
  markerPayload?: string | null;
  /** Best-effort JSON string the parser attempted first. */
  extractedJson?: string | null;
  /** Top candidate snippets (truncated) for UI debugging. */
  candidatePreviews: string[];
}

const WORKFLOW_CHAT_FALLBACK: Record<Locale, string> = {
  id: "Workflow sudah dibuat. Lihat dan edit di panel Workflow di sebelah kanan.",
  en: "Your workflow is ready. View and edit it in the Workflow panel on the right.",
  zh: "工作流已生成。请在右侧 Workflow 面板查看和编辑。",
};

const WORKFLOW_PARSE_ERROR_CHAT: Record<Locale, string> = {
  id: "Workflow tidak dapat diproses. Coba kirim ulang permintaan atau perjelas langkah otomatisasi yang diinginkan.",
  en: "The workflow could not be processed. Try sending your request again or clarify the automation steps you need.",
  zh: "无法处理工作流。请重新发送请求或说明您需要的自动化步骤。",
};

const WORKFLOW_DEBUG_PREVIEW_LIMIT = 2400;

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripCodeFences(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json|workflow)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1]?.trim() ?? trimmed;
}

function stripToJsonStart(raw: string): string {
  const trimmed = raw.trim();
  const jsonStart = trimmed.search(/[{\[]/);
  if (jsonStart > 0) {
    return trimmed.slice(jsonStart);
  }
  return trimmed;
}

function sliceToOutermostJsonObject(raw: string): string {
  const trimmed = stripToJsonStart(raw);
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

function repairJsonPayload(raw: string): string {
  let repaired = stripToJsonStart(stripCodeFences(raw));

  repaired = repaired.replace(/^\uFEFF/, "");
  repaired = repaired.replace(/[\u201C\u201D]/g, '"');
  repaired = repaired.replace(/[\u2018\u2019]/g, "'");
  repaired = repaired.replace(/\/\*[\s\S]*?\*\//g, "");
  repaired = repaired.replace(/\/\/.*$/gm, "");
  repaired = repaired.replace(/\b(undefined|NaN|Infinity)\b/g, "null");

  for (let pass = 0; pass < 3; pass += 1) {
    repaired = repaired.replace(/,\s*([}\]])/g, "$1");
  }

  repaired = repaired.replace(
    /([{,]\s*)([A-Za-z_][\w-]*)(\s*:)/g,
    '$1"$2"$3',
  );
  repaired = repaired.replace(
    /:\s*([A-Za-z_][\w-]*)(\s*[,}\]])/g,
    (_match, value: string, suffix: string) => {
      const literals = new Set(["true", "false", "null"]);
      if (literals.has(value)) {
        return `: ${value}${suffix}`;
      }
      return `: "${value}"${suffix}`;
    },
  );
  repaired = repaired.replace(/'/g, '"');

  return sliceToOutermostJsonObject(repaired);
}

function extractBalancedJsonObjects(
  text: string,
  options?: { requireWorkflowKeys?: boolean },
): string[] {
  const results: string[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (depth === 0) start = index;
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        const candidate = text.slice(start, index + 1);
        const hasWorkflowKeys = /"(nodes|steps)"\s*:/i.test(candidate);
        if (!options?.requireWorkflowKeys || hasWorkflowKeys) {
          results.push(candidate);
        }
        start = -1;
      }
    }
  }

  return results;
}

function findLargestJsonCandidate(text: string): string | null {
  const workflowObjects = extractBalancedJsonObjects(text, {
    requireWorkflowKeys: true,
  });
  const allObjects = extractBalancedJsonObjects(text);
  const pool = workflowObjects.length > 0 ? workflowObjects : allObjects;

  return (
    [...pool].sort((left, right) => right.length - left.length)[0] ?? null
  );
}

function extractLastMarkerBlock(
  fullText: string,
  start: string,
  end: string,
): { inner: string; segment: string } | null {
  const startIndex = fullText.lastIndexOf(start);
  if (startIndex === -1) return null;

  const contentStart = startIndex + start.length;
  const endIndex = fullText.indexOf(end, contentStart);
  if (endIndex === -1) return null;

  const inner = fullText.slice(contentStart, endIndex).trim();
  const segment = fullText.slice(startIndex, endIndex + end.length);

  return { inner, segment };
}

function extractAllMarkerBlocks(
  fullText: string,
): Array<{ inner: string; segment: string; marker: string }> {
  const blocks: Array<{ inner: string; segment: string; marker: string }> = [];

  for (const { start, end } of WORKFLOW_MARKER_PAIRS) {
    const lastBlock = extractLastMarkerBlock(fullText, start, end);
    if (lastBlock) {
      blocks.push({ ...lastBlock, marker: start });
    }

    const markerPattern = new RegExp(
      `${escapeRegExp(start)}([\\s\\S]*?)${escapeRegExp(end)}`,
      "gi",
    );

    for (const match of fullText.matchAll(markerPattern)) {
      const inner = (match[1] ?? "").trim();
      const segment = match[0] ?? "";
      if (!inner || !segment) continue;
      blocks.push({ inner, segment, marker: start });
    }
  }

  const seen = new Set<string>();
  return blocks.filter((block) => {
    if (seen.has(block.segment)) return false;
    seen.add(block.segment);
    return true;
  });
}

function tryParseWorkflowJson(raw: string): unknown | null {
  const stripped = stripCodeFences(raw);
  const candidates = [
    stripped,
    stripToJsonStart(stripped),
    sliceToOutermostJsonObject(stripped),
    repairJsonPayload(stripped),
    repairJsonPayload(sliceToOutermostJsonObject(stripped)),
  ];

  const uniqueCandidates = [...new Set(candidates.filter(Boolean))];

  for (const candidate of uniqueCandidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // try next candidate
    }
  }

  return null;
}

function unwrapWorkflowRoot(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;

  const data = raw as Record<string, unknown>;
  const nested = data.workflow;
  if (nested && typeof nested === "object") {
    return nested;
  }

  return raw;
}

function extractWorkflowJsonCandidates(fullText: string): string[] {
  const seen = new Set<string>();
  const candidates: string[] = [];

  const pushCandidate = (value: string, priority = false) => {
    const trimmed = stripToJsonStart(stripCodeFences(value)).trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    if (priority) {
      candidates.unshift(trimmed);
      return;
    }
    candidates.push(trimmed);
  };

  const markerBlocks = extractAllMarkerBlocks(fullText);
  const lastPrimaryBlock = extractLastMarkerBlock(
    fullText,
    WORKFLOW_START_MARKER,
    WORKFLOW_END_MARKER,
  );
  const lastLegacyBlock = extractLastMarkerBlock(
    fullText,
    WORKFLOW_LEGACY_START_MARKER,
    WORKFLOW_LEGACY_END_MARKER,
  );

  if (lastPrimaryBlock?.inner) {
    pushCandidate(lastPrimaryBlock.inner, true);
  }
  if (lastLegacyBlock?.inner) {
    pushCandidate(lastLegacyBlock.inner, true);
  }

  for (const block of markerBlocks) {
    pushCandidate(block.inner, block.marker === WORKFLOW_START_MARKER);
  }

  const codeFencePattern = /```(?:json|workflow)?\s*([\s\S]*?)\s*```/gi;
  for (const match of fullText.matchAll(codeFencePattern)) {
    const payload = match[1]?.trim() ?? "";
    if (/"(nodes|steps)"\s*:/i.test(payload)) {
      pushCandidate(payload);
    }
  }

  const largest = findLargestJsonCandidate(fullText);
  if (largest) {
    pushCandidate(largest, true);
  }

  const balancedObjects = extractBalancedJsonObjects(fullText, {
    requireWorkflowKeys: true,
  });
  for (const object of [...balancedObjects].sort(
    (left, right) => right.length - left.length,
  )) {
    pushCandidate(object);
  }

  const objectPattern =
    /\{[\s\S]*?"(?:nodes|steps)"\s*:\s*\[[\s\S]*?\][\s\S]*?\}/gi;
  for (const match of fullText.matchAll(objectPattern)) {
    pushCandidate(match[0]?.trim() ?? "");
  }

  const allObjects = extractBalancedJsonObjects(fullText);
  for (const object of [...allObjects].sort(
    (left, right) => right.length - left.length,
  )) {
    pushCandidate(object);
  }

  return candidates;
}

function inferEdgesFromNodes(
  nodes: WorkflowStreamPayload["nodes"],
): WorkflowStreamPayload["edges"] {
  if (nodes.length < 2) return [];

  return nodes.slice(0, -1).map((node, index) => ({
    id: `edge-${index}-${node.id}-${nodes[index + 1]!.id}`,
    source: node.id,
    target: nodes[index + 1]!.id,
  }));
}

function resolveNodeKind(value: unknown): WorkflowNodeKind {
  const normalized =
    typeof value === "string" ? value.trim().toLowerCase() : "";
  const aliases: Record<string, WorkflowNodeKind> = {
    trigger: "trigger",
    start: "trigger",
    action: "action",
    task: "action",
    condition: "condition",
    decision: "condition",
    branch: "condition",
    output: "output",
    approval: "approval",
    approve: "approval",
    gate: "approval",
    end: "output",
    result: "output",
  };

  return aliases[normalized] ?? "action";
}

function readStreamNodeConfig(
  entry: Record<string, unknown>,
  prompt?: string,
  action?: string,
  actionParams?: Record<string, string>,
): Record<string, unknown> | undefined {
  const config: Record<string, unknown> = {};

  if (entry.config && typeof entry.config === "object") {
    Object.assign(config, entry.config as Record<string, unknown>);
  }

  const resolvedPrompt =
    prompt ||
    (typeof entry.prompt === "string" ? entry.prompt.trim() : "") ||
    (typeof entry.instruction === "string" ? entry.instruction.trim() : "") ||
    (typeof config.prompt === "string" ? config.prompt.trim() : "");
  if (resolvedPrompt) config.prompt = resolvedPrompt;

  const resolvedAction =
    action ||
    (typeof entry.action === "string" ? entry.action.trim() : "") ||
    (typeof entry.tool === "string" ? entry.tool.trim() : "") ||
    (typeof config.action === "string" ? config.action.trim() : "") ||
    (typeof config.tool === "string" ? config.tool.trim() : "");
  if (resolvedAction) {
    const actionId = resolveWorkflowActionId(resolvedAction);
    if (actionId) {
      config.action = actionId;
      config.tool = actionId;
    }
  }

  const rawParams =
    actionParams ||
    (entry.actionParams && typeof entry.actionParams === "object"
      ? (entry.actionParams as Record<string, string>)
      : undefined) ||
    (config.actionParams && typeof config.actionParams === "object"
      ? (config.actionParams as Record<string, string>)
      : undefined);

  if (rawParams && Object.keys(rawParams).length > 0) {
    config.actionParams = rawParams;
  }

  if (entry.schedule && typeof entry.schedule === "object") {
    config.schedule = entry.schedule;
  }

  if (typeof entry.maxRetries === "number") {
    config.maxRetries = entry.maxRetries;
  }

  return Object.keys(config).length > 0 ? config : undefined;
}

function resolveNodeLabel(
  entry: Record<string, unknown>,
  index: number,
): string {
  for (const key of ["label", "name", "title", "text"]) {
    const value = entry[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return `Step ${index + 1}`;
}

function normalizeNodeEntries(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];

  const data = raw as Record<string, unknown>;
  if (Array.isArray(data.nodes)) return data.nodes;
  if (Array.isArray(data.steps)) return data.steps;

  return [];
}

function normalizeStreamPayload(
  raw: unknown,
): WorkflowStreamPayload | null {
  const unwrapped = unwrapWorkflowRoot(raw);
  if (!unwrapped || typeof unwrapped !== "object") return null;

  const data = unwrapped as Partial<WorkflowStreamPayload> & {
    title?: string;
    steps?: unknown[];
  };

  const name =
    (typeof data.name === "string" ? data.name.trim() : "") ||
    (typeof data.title === "string" ? data.title.trim() : "");

  const nodeEntries = normalizeNodeEntries(data);
  const nodes = nodeEntries
    .map((node, index) => {
      if (!node || typeof node !== "object") return null;
      const entry = node as Record<string, unknown> & {
        kind?: string;
        type?: string;
        position?: { x?: number; y?: number };
      };

      const label = resolveNodeLabel(entry, index);
      const kind = resolveNodeKind(entry.kind ?? entry.type);

      const prompt =
        typeof entry.prompt === "string"
          ? entry.prompt.trim() || undefined
          : typeof entry.instruction === "string"
            ? entry.instruction.trim() || undefined
            : undefined;

      const action =
        typeof entry.action === "string" ? entry.action.trim() : undefined;

      const actionParams: Record<string, string> | undefined =
        entry.actionParams && typeof entry.actionParams === "object"
          ? Object.fromEntries(
              Object.entries(entry.actionParams as Record<string, unknown>).filter(
                (entry): entry is [string, string] =>
                  typeof entry[1] === "string",
              ),
            )
          : undefined;

      const config = readStreamNodeConfig(entry, prompt, action, actionParams);

      return {
        id:
          typeof entry.id === "string" && entry.id.trim()
            ? entry.id.trim()
            : createId("wf-node"),
        label,
        kind,
        description:
          typeof entry.description === "string"
            ? entry.description.trim() || undefined
            : undefined,
        prompt,
        action: typeof config?.action === "string" ? config.action : action,
        actionParams:
          config?.actionParams && typeof config.actionParams === "object"
            ? (config.actionParams as Record<string, string>)
            : actionParams,
        config,
        position:
          entry.position &&
          typeof entry.position.x === "number" &&
          typeof entry.position.y === "number"
            ? { x: entry.position.x, y: entry.position.y }
            : {
                x: 120 + index * 48,
                y: 80 + index * 72,
              },
      };
    })
    .filter((node): node is NonNullable<typeof node> => node !== null);

  if (nodes.length === 0) return null;

  const resolvedName = name || "Generated Workflow";
  const nodeIds = new Set(nodes.map((node) => node.id));
  const nodeIdList = nodes.map((node) => node.id);

  const resolveEdgeEndpoint = (value: unknown): string | null => {
    if (typeof value !== "string" || !value.trim()) return null;
    const trimmed = value.trim();
    if (nodeIds.has(trimmed)) return trimmed;

    const indexMatch = trimmed.match(/(\d+)/);
    if (indexMatch) {
      const index = Number.parseInt(indexMatch[1]!, 10) - 1;
      if (index >= 0 && index < nodeIdList.length) {
        return nodeIdList[index] ?? null;
      }
    }

    return null;
  };

  let edges = Array.isArray(data.edges)
    ? data.edges
        .map((edge, index) => {
          if (!edge || typeof edge !== "object") return null;
          const entry = edge as WorkflowStreamPayload["edges"][number] & {
            from?: string;
            to?: string;
          };
          const source = resolveEdgeEndpoint(entry.source ?? entry.from);
          const target = resolveEdgeEndpoint(entry.target ?? entry.to);
          if (!source || !target || source === target) {
            return null;
          }

          return {
            id:
              typeof entry.id === "string" && entry.id.trim()
                ? entry.id.trim()
                : `edge-${index}-${source}-${target}`,
            source,
            target,
          };
        })
        .filter((edge): edge is NonNullable<typeof edge> => edge !== null)
    : [];

  if (edges.length === 0) {
    edges = inferEdgesFromNodes(nodes);
  }

  return {
    name: resolvedName,
    description:
      typeof data.description === "string"
        ? data.description.trim() || undefined
        : undefined,
    nodes,
    edges,
  };
}

function readStreamNodeActionField(
  node: WorkflowStreamNodePayload,
  config: Record<string, unknown>,
): string | undefined {
  return (
    node.action?.trim() ||
    (typeof config.action === "string" ? config.action.trim() : undefined) ||
    (typeof config.tool === "string" ? config.tool.trim() : undefined)
  );
}

export function workflowPayloadToDefinition(
  payload: WorkflowStreamPayload,
): Omit<WorkflowDefinition, "createdAt" | "updatedAt" | "id"> {
  const nodes: WorkflowNode[] = payload.nodes.map((node) => {
    const config: Record<string, unknown> = { ...(node.config ?? {}) };

    if (node.prompt) config.prompt = node.prompt;

    const rawAction = readStreamNodeActionField(node, config);
    if (rawAction) {
      const actionId = resolveWorkflowActionId(rawAction);
      if (actionId) {
        config.action = actionId;
        config.tool = actionId;
      }
    }

    if (node.actionParams && Object.keys(node.actionParams).length > 0) {
      const existingParams =
        config.actionParams &&
        typeof config.actionParams === "object" &&
        !Array.isArray(config.actionParams)
          ? (config.actionParams as Record<string, string>)
          : {};
      config.actionParams = { ...existingParams, ...node.actionParams };
    }

    const resolvedConfig =
      Object.keys(config).length > 0 ? config : undefined;

    return {
      id: node.id,
      type: "workflow",
      position: node.position ?? { x: 0, y: 0 },
      data: {
        label: node.label,
        kind: node.kind,
        description: node.description,
        prompt: node.prompt,
        config: resolvedConfig,
      },
    };
  });

  const edges: WorkflowEdge[] = payload.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
  }));

  return {
    name: payload.name,
    description: payload.description,
    nodes,
    edges,
  };
}

function stripAllWorkflowSegments(fullText: string): string {
  let chatMessage = fullText.trim();

  for (const { start, end } of WORKFLOW_MARKER_PAIRS) {
    chatMessage = chatMessage
      .replace(
        new RegExp(
          `${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`,
          "gi",
        ),
        "",
      )
      .trim();
  }

  return chatMessage.replace(/```(?:json|workflow)?\s*[\s\S]*?\s*```/gi, "").trim();
}

function buildWorkflowChatMessage(
  fullText: string,
  locale: Locale,
  matchedSegment?: string,
): string {
  const chatMessage = matchedSegment
    ? fullText.replace(matchedSegment, "").trim()
    : stripAllWorkflowSegments(fullText);

  return chatMessage.slice(0, 600) || WORKFLOW_CHAT_FALLBACK[locale];
}

function countMarkerHits(fullText: string): number {
  let hits = 0;

  for (const { start, end } of WORKFLOW_MARKER_PAIRS) {
    const pattern = new RegExp(
      `${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`,
      "gi",
    );
    hits += [...fullText.matchAll(pattern)].length;
  }

  return hits;
}

function findLastMarkerSegment(fullText: string): string | null {
  const primary = extractLastMarkerBlock(
    fullText,
    WORKFLOW_START_MARKER,
    WORKFLOW_END_MARKER,
  );
  if (primary?.segment) return primary.segment;

  const legacy = extractLastMarkerBlock(
    fullText,
    WORKFLOW_LEGACY_START_MARKER,
    WORKFLOW_LEGACY_END_MARKER,
  );
  return legacy?.segment ?? null;
}

function truncateDebugText(value: string, limit = 1200): string {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}\n… [truncated ${value.length - limit} chars]`;
}

export function buildWorkflowParseDebugInfo(
  fullText: string,
): WorkflowParseDebugInfo {
  const candidates = extractWorkflowJsonCandidates(fullText);
  const lastPrimary = extractLastMarkerBlock(
    fullText,
    WORKFLOW_START_MARKER,
    WORKFLOW_END_MARKER,
  );
  const lastLegacy = extractLastMarkerBlock(
    fullText,
    WORKFLOW_LEGACY_START_MARKER,
    WORKFLOW_LEGACY_END_MARKER,
  );
  const markerPayload =
    lastPrimary?.inner ?? lastLegacy?.inner ?? null;

  return {
    candidateCount: candidates.length,
    markerHits: countMarkerHits(fullText),
    usedMarker: lastPrimary
      ? WORKFLOW_START_MARKER
      : lastLegacy
        ? WORKFLOW_LEGACY_START_MARKER
        : undefined,
    preview: truncateDebugText(fullText, WORKFLOW_DEBUG_PREVIEW_LIMIT),
    markerPayload: markerPayload
      ? truncateDebugText(markerPayload, WORKFLOW_DEBUG_PREVIEW_LIMIT)
      : null,
    extractedJson: candidates[0]
      ? truncateDebugText(candidates[0], WORKFLOW_DEBUG_PREVIEW_LIMIT)
      : null,
    candidatePreviews: candidates
      .slice(0, 4)
      .map((candidate) => truncateDebugText(candidate, 800)),
  };
}

/** Inspect a raw LLM response for workflow debug UI. */
export function inspectWorkflowResponse(
  fullText: string,
): WorkflowParseDebugInfo {
  return buildWorkflowParseDebugInfo(fullText);
}

export function logWorkflowParseAttempt(
  scope: "chat" | "client",
  fullText: string,
  result: WorkflowParseResult,
): void {
  const debug = buildWorkflowParseDebugInfo(fullText);

  if (result.workflow) {
    console.info(`[workflow:${scope}] parse ok`, {
      name: result.workflow.name,
      nodeCount: result.workflow.nodes.length,
      edgeCount: result.workflow.edges.length,
      markerHits: debug.markerHits,
      candidateCount: debug.candidateCount,
    });
    return;
  }

  console.warn(`[workflow:${scope}] parse failed`, {
    error: result.error,
    textLength: fullText.length,
    markerHits: debug.markerHits,
    candidateCount: debug.candidateCount,
    usedMarker: debug.usedMarker,
    markerPayloadPreview: debug.markerPayload,
    extractedJsonPreview: debug.extractedJson,
    preview: debug.preview,
  });
}

export function getWorkflowStreamErrorMessage(
  code: WorkflowErrorCode,
  locale: Locale,
): string {
  const messages: Record<WorkflowErrorCode, Record<Locale, string>> = {
    parse_failed: {
      id: "Workflow tidak dapat diproses dari respons chat. Coba impor manual atau kirim ulang permintaan.",
      en: "The workflow could not be parsed from the chat response. Try manual import or resend your request.",
      zh: "无法从聊天响应解析工作流。请尝试手动导入或重新发送请求。",
    },
    empty_workflow: {
      id: "Workflow kosong atau tidak memiliki node. Perjelas langkah otomatisasi yang diinginkan.",
      en: "The workflow is empty or has no nodes. Clarify the automation steps you need.",
      zh: "工作流为空或没有节点。请说明您需要的自动化步骤。",
    },
    execute_failed: {
      id: "Eksekusi workflow gagal.",
      en: "Workflow execution failed.",
      zh: "工作流执行失败。",
    },
  };

  return messages[code][locale];
}

export function parseWorkflowFromResponse(
  fullText: string,
  locale: Locale,
  options?: {
    logScope?: "chat" | "client";
    phase?: WorkflowChatPhase;
  },
): WorkflowParseResult {
  const candidates = extractWorkflowJsonCandidates(fullText);

  for (const rawPayload of candidates) {
    const parsed = tryParseWorkflowJson(rawPayload);
    const payload = normalizeStreamPayload(parsed);
    if (payload) {
      const markerSegment = findLastMarkerSegment(fullText) ?? rawPayload;

      const result: WorkflowParseResult = {
        chatMessage: buildWorkflowChatMessage(fullText, locale, markerSegment),
        workflow: payload,
      };

      if (options?.logScope) {
        logWorkflowParseAttempt(options.logScope, fullText, result);
      }

      return result;
    }
  }

  const isDiscoveryOnly = options?.phase === "discovery";

  const result: WorkflowParseResult = {
    chatMessage: fullText.trim() || (isDiscoveryOnly ? fullText.trim() : WORKFLOW_PARSE_ERROR_CHAT[locale]),
    workflow: null,
    ...(isDiscoveryOnly
      ? {}
      : { error: fullText.trim() ? "parse_failed" : "empty_workflow" }),
  };

  if (options?.logScope && !isDiscoveryOnly) {
    logWorkflowParseAttempt(options.logScope, fullText, result);
  }

  return result;
}

function buildStrictWorkflowRules(locale: Locale): string {
  const rules: Record<Locale, string> = {
    id: `ATURAN KETAT (WAJIB — tidak boleh dilanggar):
1. Di luar penanda workflow, tulis MAKSIMAL 2 kalimat konfirmasi singkat. Jangan ada JSON, bullet, atau penjelasan panjang di luar penanda.
2. JSON workflow HARUS berada TEPAT di antara:
   ${WORKFLOW_START_MARKER}
   ...JSON...
   ${WORKFLOW_END_MARKER}
3. Jangan gunakan penanda lama (${WORKFLOW_LEGACY_START_MARKER} / ${WORKFLOW_LEGACY_END_MARKER}).
4. Di dalam penanda: HANYA satu objek JSON valid. Tanpa markdown, tanpa komentar, tanpa trailing comma.
5. Gunakan field persis: "name" (bukan title), "description", "nodes", "edges".
6. Setiap node WAJIB punya: "id", "label", "kind", "position" — dan "prompt" untuk action/condition/output.
7. "kind" HARUS salah satu: trigger | action | condition | approval | output (boleh pakai "type" dengan nilai sama, tapi "kind" lebih disukai).
8. Minimal 2 node, maksimal 8 node. "edges" harus menghubungkan source → target dengan id node yang valid.`,
    en: `STRICT RULES (MANDATORY — do not violate):
1. Outside workflow markers, write AT MOST 2 short confirmation sentences. No JSON, bullets, or long explanations outside markers.
2. Workflow JSON MUST appear EXACTLY between:
   ${WORKFLOW_START_MARKER}
   ...JSON...
   ${WORKFLOW_END_MARKER}
3. Do NOT use legacy markers (${WORKFLOW_LEGACY_START_MARKER} / ${WORKFLOW_LEGACY_END_MARKER}).
4. Inside markers: ONLY one valid JSON object. No markdown, comments, or trailing commas.
5. Use exact fields: "name" (not title), "description", "nodes", "edges".
6. Every node MUST include: "id", "label", "kind", "position" — plus "prompt" for action/condition/output nodes.
7. "kind" MUST be one of: trigger | action | condition | approval | output ("type" is tolerated but "kind" is preferred).
8. Minimum 2 nodes, maximum 8 nodes. "edges" must connect valid node ids source → target.`,
    zh: `严格规则（必须遵守）：
1. 标记之外最多写 2 句简短确认。标记外不得出现 JSON、列表或长解释。
2. 工作流 JSON 必须严格位于：
   ${WORKFLOW_START_MARKER}
   ...JSON...
   ${WORKFLOW_END_MARKER}
3. 不要使用旧标记（${WORKFLOW_LEGACY_START_MARKER} / ${WORKFLOW_LEGACY_END_MARKER}）。
4. 标记内只能是单个合法 JSON 对象。不要 markdown、注释或尾随逗号。
5. 字段必须为："name"（不要用 title）、"description"、"nodes"、"edges"。
6. 每个节点必须包含："id"、"label"、"kind"、"position"；action/condition/output 节点需要 "prompt"。
7. "kind" 只能是：trigger | action | condition | approval | output。
8. 至少 2 个节点，最多 8 个。edges 必须用有效节点 id 连接 source → target。`,
  };

  return rules[locale];
}

export function buildWorkflowPromptSection(
  locale: Locale,
  context?: WorkflowChatContext | null,
): string {
  const phase = context?.phase ?? "discovery";
  const phaseInstructions = buildWorkflowPhaseInstructions(
    locale,
    context ?? {
      phase,
      awaitingConfirmation: false,
      hasActiveWorkflow: false,
    },
  );

  if (phase === "discovery") {
    return phaseInstructions;
  }

  const outputRules =
    phase === "edit"
      ? buildStrictWorkflowRules(locale)
      : `${buildStrictWorkflowRules(locale)}

Saat generate pertama kali, pastikan trigger + minimal satu action + output node ada.`;

  const schemaBlock = `${WORKFLOW_START_MARKER}
${WORKFLOW_JSON_SCHEMA_EXAMPLE}
${WORKFLOW_END_MARKER}`;

  const examples: Record<Locale, string> = {
    id: `Contoh respons (${phase === "edit" ? "edit" : "generate"}):
Perubahan workflow sudah diterapkan. Cek canvas di panel Workflow.

${schemaBlock}`,
    en: `Example response (${phase === "edit" ? "edit" : "generate"}):
Workflow changes applied. Review the canvas in the Workflow panel.

${schemaBlock}`,
    zh: `回复示例（${phase === "edit" ? "编辑" : "生成"}）：
工作流已更新。请在 Workflow 面板查看画布。

${schemaBlock}`,
  };

  return `${phaseInstructions}

${outputRules}

Skema JSON:
${schemaBlock}

${examples[locale]}`;
}

export function parseWorkflowChatContextInput(
  raw: unknown,
): WorkflowChatContext | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<WorkflowChatContext>;
  const phase = data.phase;
  if (phase !== "discovery" && phase !== "generate" && phase !== "edit") {
    return null;
  }
  return {
    phase,
    awaitingConfirmation: data.awaitingConfirmation === true,
    hasActiveWorkflow: data.hasActiveWorkflow === true,
    activeWorkflow:
      data.activeWorkflow && typeof data.activeWorkflow === "object"
        ? (data.activeWorkflow as WorkflowChatContext["activeWorkflow"])
        : undefined,
  };
}