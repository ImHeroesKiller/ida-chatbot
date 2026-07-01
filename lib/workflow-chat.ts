import type { Locale } from "@/lib/config";
import type {
  WorkflowDefinition,
  WorkflowEdge,
  WorkflowErrorCode,
  WorkflowNode,
  WorkflowNodeKind,
} from "@/lib/workflow";

export const WORKFLOW_START_MARKER = "<<<IDA_WORKFLOW>>>";
export const WORKFLOW_END_MARKER = "<<<END_IDA_WORKFLOW>>>";

export interface WorkflowStreamPayload {
  name: string;
  description?: string;
  nodes: Array<{
    id: string;
    label: string;
    kind: WorkflowNodeKind;
    description?: string;
    prompt?: string;
    position?: { x: number; y: number };
  }>;
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

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripCodeFences(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1]?.trim() ?? trimmed;
}

function repairJsonPayload(raw: string): string {
  return raw.replace(/,\s*([}\]])/g, "$1");
}

function tryParseWorkflowJson(raw: string): unknown | null {
  const candidates = [raw, repairJsonPayload(raw)];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // try next candidate
    }
  }

  return null;
}

function extractWorkflowJsonCandidates(fullText: string): string[] {
  const candidates: string[] = [];
  const markerPattern = new RegExp(
    `${escapeRegExp(WORKFLOW_START_MARKER)}([\\s\\S]*?)${escapeRegExp(WORKFLOW_END_MARKER)}`,
    "gi",
  );

  for (const match of fullText.matchAll(markerPattern)) {
    const payload = stripCodeFences(match[1] ?? "");
    if (payload) candidates.push(payload);
  }

  const codeFencePattern = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
  for (const match of fullText.matchAll(codeFencePattern)) {
    const payload = match[1]?.trim();
    if (payload?.includes('"nodes"')) {
      candidates.push(payload);
    }
  }

  const objectPattern = /\{[\s\S]*?"nodes"\s*:\s*\[[\s\S]*?\][\s\S]*?\}/g;
  for (const match of fullText.matchAll(objectPattern)) {
    candidates.push(match[0]?.trim() ?? "");
  }

  return candidates.filter(Boolean);
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
    end: "output",
    result: "output",
  };

  return aliases[normalized] ?? "action";
}

function normalizeStreamPayload(
  raw: unknown,
): WorkflowStreamPayload | null {
  if (!raw || typeof raw !== "object") return null;

  const data = raw as Partial<WorkflowStreamPayload> & { title?: string };
  const name =
    (typeof data.name === "string" ? data.name.trim() : "") ||
    (typeof data.title === "string" ? data.title.trim() : "");

  const nodes = Array.isArray(data.nodes)
    ? data.nodes
        .map((node, index) => {
          if (!node || typeof node !== "object") return null;
          const entry = node as WorkflowStreamPayload["nodes"][number];
          const label =
            typeof entry.label === "string" && entry.label.trim()
              ? entry.label.trim()
              : `Step ${index + 1}`;
          const kind = resolveNodeKind(
            entry.kind ?? (entry as { type?: string }).type,
          );

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
            prompt:
              typeof entry.prompt === "string"
                ? entry.prompt.trim() || undefined
                : undefined,
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
        .filter((node): node is NonNullable<typeof node> => node !== null)
    : [];

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
          const entry = edge as WorkflowStreamPayload["edges"][number];
          const source = resolveEdgeEndpoint(entry.source);
          const target = resolveEdgeEndpoint(entry.target);
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

export function workflowPayloadToDefinition(
  payload: WorkflowStreamPayload,
): Omit<WorkflowDefinition, "createdAt" | "updatedAt" | "id"> {
  const nodes: WorkflowNode[] = payload.nodes.map((node) => ({
    id: node.id,
    type: "workflow",
    position: node.position ?? { x: 0, y: 0 },
    data: {
      label: node.label,
      kind: node.kind,
      description: node.description,
      config: node.prompt ? { prompt: node.prompt } : undefined,
    },
  }));

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

function buildWorkflowChatMessage(
  fullText: string,
  locale: Locale,
  matchedSegment?: string,
): string {
  let chatMessage = fullText.trim();

  if (matchedSegment) {
    chatMessage = fullText.replace(matchedSegment, "").trim();
  } else {
    chatMessage = fullText
      .replace(
        new RegExp(
          `${escapeRegExp(WORKFLOW_START_MARKER)}[\\s\\S]*?${escapeRegExp(WORKFLOW_END_MARKER)}`,
          "gi",
        ),
        "",
      )
      .replace(/```(?:json)?\s*[\s\S]*?\s*```/gi, "")
      .trim();
  }

  return (
    chatMessage.slice(0, 600) ||
    WORKFLOW_CHAT_FALLBACK[locale]
  );
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
): WorkflowParseResult {
  const candidates = extractWorkflowJsonCandidates(fullText);

  for (const rawPayload of candidates) {
    const parsed = tryParseWorkflowJson(stripCodeFences(rawPayload));
    const payload = normalizeStreamPayload(parsed);
    if (payload) {
      const markerSegment = fullText.includes(WORKFLOW_START_MARKER)
        ? fullText.match(
            new RegExp(
              `${escapeRegExp(WORKFLOW_START_MARKER)}[\\s\\S]*?${escapeRegExp(WORKFLOW_END_MARKER)}`,
              "i",
            ),
          )?.[0]
        : rawPayload;

      return {
        chatMessage: buildWorkflowChatMessage(
          fullText,
          locale,
          markerSegment,
        ),
        workflow: payload,
      };
    }
  }

  return {
    chatMessage: fullText.trim() || WORKFLOW_PARSE_ERROR_CHAT[locale],
    workflow: null,
    error: fullText.trim() ? "parse_failed" : "empty_workflow",
  };
}

export function buildWorkflowPromptSection(locale: Locale): string {
  const instructions: Record<Locale, string> = {
    id: `## Mode Workflow (Otomatisasi Visual)
Pengguna sedang membuat workflow otomatisasi melalui panel **Workflow**.

Aturan respons WAJIB:
1. **Bagian chat (pendek):** 1–3 kalimat yang mengonfirmasi workflow dibuat dan mengarahkan ke panel Workflow. Jangan salin JSON di chat.
2. **Bagian Workflow:** Tulis definisi workflow sebagai JSON di antara penanda berikut:

${WORKFLOW_START_MARKER}
{
  "name": "Judul Workflow",
  "description": "Ringkasan singkat",
  "nodes": [
    {
      "id": "node-1",
      "label": "Trigger",
      "kind": "trigger",
      "description": "Kapan workflow dimulai",
      "prompt": "Instruksi LLM opsional",
      "position": { "x": 120, "y": 80 }
    }
  ],
  "edges": [
    { "id": "edge-1", "source": "node-1", "target": "node-2" }
  ]
}
${WORKFLOW_END_MARKER}

Panduan workflow:
- \`kind\` harus salah satu: trigger, action, condition, output
- Buat minimal 2–6 node yang logis (trigger → action/condition → output)
- Hubungkan node dengan \`edges\` (source → target)
- Untuk node action/output, isi \`prompt\` dengan instruksi LLM yang jelas
- Contoh use case: follow-up pinjaman, onboarding nasabah, reminder dokumen`,
    en: `## Workflow Mode (Visual Automation)
The user is building an automation workflow via the **Workflow** panel.

Required response format:
1. **Chat section (short):** 1–3 sentences confirming the workflow is ready and pointing to the Workflow panel. Do not paste JSON in chat.
2. **Workflow section:** Write the workflow definition as JSON between these markers:

${WORKFLOW_START_MARKER}
{
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
    }
  ],
  "edges": [
    { "id": "edge-1", "source": "node-1", "target": "node-2" }
  ]
}
${WORKFLOW_END_MARKER}

Workflow guidelines:
- \`kind\` must be one of: trigger, action, condition, output
- Create 2–6 logical nodes (trigger → action/condition → output)
- Connect nodes with \`edges\` (source → target)
- For action/output nodes, fill \`prompt\` with a clear LLM instruction`,
    zh: `## 工作流模式（可视化自动化）
用户正在通过 **Workflow** 面板构建自动化工作流。

必须的回复格式：
1. **聊天部分（简短）：** 1–3 句话确认工作流已生成，并引导用户查看 Workflow 面板。不要在聊天中粘贴 JSON。
2. **工作流部分：** 在以下标记之间写入 JSON 工作流定义：

${WORKFLOW_START_MARKER}
{ "name": "工作流标题", "description": "简短摘要", "nodes": [...], "edges": [...] }
${WORKFLOW_END_MARKER}

指南：
- \`kind\` 必须是：trigger、action、condition、output 之一
- 创建 2–6 个逻辑节点并用 edges 连接
- action/output 节点应包含清晰的 \`prompt\``,
  };

  return instructions[locale];
}