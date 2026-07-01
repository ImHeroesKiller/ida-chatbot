import type { Locale } from "@/lib/config";
import type { IdaMessage } from "@/lib/types";
import type {
  WorkflowDefinition,
  WorkflowWorkspace,
} from "@/lib/workflow";

/** Chat-driven workflow interaction phase. */
export type WorkflowChatPhase = "discovery" | "generate" | "edit";

export interface WorkflowChatContextSnapshot {
  id: string;
  name: string;
  description?: string;
  nodes: Array<{
    id: string;
    label: string;
    kind: string;
    description?: string;
    prompt?: string;
    action?: string;
    config?: Record<string, unknown>;
    position?: { x: number; y: number };
  }>;
  edges: Array<{ id: string; source: string; target: string }>;
}

export interface WorkflowChatContext {
  phase: WorkflowChatPhase;
  awaitingConfirmation: boolean;
  hasActiveWorkflow: boolean;
  activeWorkflow?: WorkflowChatContextSnapshot;
}

function readNodePrompt(node: WorkflowDefinition["nodes"][number]): string | undefined {
  const configPrompt =
    typeof node.data.config?.prompt === "string"
      ? node.data.config.prompt.trim()
      : "";
  if (configPrompt) return configPrompt;
  if (node.data.prompt?.trim()) return node.data.prompt.trim();
  if (node.data.description?.trim()) return node.data.description.trim();
  return undefined;
}

export function serializeWorkflowForChatContext(
  workflow: WorkflowDefinition,
): WorkflowChatContextSnapshot {
  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    nodes: workflow.nodes.map((node) => ({
      id: node.id,
      label: node.data.label,
      kind: node.data.kind,
      description: node.data.description,
      prompt: readNodePrompt(node),
      action:
        typeof node.data.config?.action === "string"
          ? node.data.config.action
          : undefined,
      config: node.data.config,
      position: node.position,
    })),
    edges: workflow.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    })),
  };
}

export function resolveWorkflowChatPhase(options: {
  workspace: WorkflowWorkspace;
  messages?: IdaMessage[];
}): WorkflowChatPhase {
  const { workspace } = options;
  const hasWorkflow = workspace.workflows.length > 0;

  if (hasWorkflow) {
    return "edit";
  }

  if (workspace.chatDiscoveryPending) {
    return "generate";
  }

  return "discovery";
}

export function buildWorkflowChatContext(options: {
  workspace: WorkflowWorkspace;
  activeWorkflow?: WorkflowDefinition | null;
  messages?: IdaMessage[];
}): WorkflowChatContext {
  const phase = resolveWorkflowChatPhase({
    workspace: options.workspace,
    messages: options.messages,
  });

  const activeWorkflow = options.activeWorkflow
    ? serializeWorkflowForChatContext(options.activeWorkflow)
    : undefined;

  return {
    phase,
    awaitingConfirmation: workspaceHasDiscoveryPending(options.workspace),
    hasActiveWorkflow: Boolean(activeWorkflow ?? options.workspace.workflows.length > 0),
    activeWorkflow,
  };
}

export function workspaceHasDiscoveryPending(
  workspace: WorkflowWorkspace,
): boolean {
  return workspace.chatDiscoveryPending === true;
}

export function formatWorkflowContextForPrompt(
  snapshot: WorkflowChatContextSnapshot,
): string {
  return JSON.stringify(snapshot, null, 2);
}

export function buildWorkflowPhaseInstructions(
  locale: Locale,
  context: WorkflowChatContext,
): string {
  if (context.phase === "discovery") {
    const instructions: Record<Locale, string> = {
      id: `## Mode Workflow — Fase Discovery (WAJIB)
Pengguna ingin membuat workflow baru. JANGAN keluarkan JSON atau penanda workflow pada respons ini.

Tugas kamu:
1. Analisis permintaan pengguna secara singkat (1 kalimat).
2. Ajukan 3–5 pertanyaan konfirmasi natural dalam bahasa yang sama dengan pengguna, mencakup:
   - **Trigger**: manual, terjadwal (harian/mingguan), delay, atau event (email/chat baru)?
   - **Aksi utama**: langkah apa saja? Perlu integrasi tool (worksheet, riset, web search, WhatsApp, dll.)?
   - **Kondisi**: ada cabang IF/ELSE atau gate approval manusia?
   - **Output**: hasil akhir yang diinginkan?
3. Akhiri dengan ajakan konfirmasi singkat ("Kalau sudah sesuai, balas ya/lanjut dan saya buatkan workflow-nya.").

Aturan:
- Gunakan bullet atau numbered list agar mudah dibaca.
- Maksimal 8–12 baris total.
- DILARANG menggunakan penanda <<<IDA_WORKFLOW_START>>> atau JSON workflow.`,
      en: `## Workflow Mode — Discovery Phase (MANDATORY)
The user wants a new workflow. Do NOT output workflow JSON or markers in this response.

Your tasks:
1. Briefly analyze the request (1 sentence).
2. Ask 3–5 natural confirmation questions covering:
   - **Trigger**: manual, scheduled (daily/weekly), delay, or event (new email/chat)?
   - **Main actions**: which steps? Any tool integrations (worksheet, research, web search, WhatsApp, etc.)?
   - **Conditions**: any IF/ELSE branches or human approval gates?
   - **Desired output**: what should the final result be?
3. End with a short call to confirm ("Reply yes/continue when ready and I'll build the workflow.").

Rules:
- Use bullets or a numbered list.
- Max 8–12 lines total.
- Do NOT use <<<IDA_WORKFLOW_START>>> markers or workflow JSON.`,
      zh: `## 工作流模式 — 发现阶段（必须）
用户想创建新工作流。本次回复不要输出工作流 JSON 或标记。

任务：
1. 简要分析用户需求（1 句）。
2. 提出 3–5 个自然确认问题，涵盖：
   - **触发器**：手动、定时（每天/每周）、延迟，还是事件（新邮件/聊天）？
   - **主要动作**：有哪些步骤？需要集成哪些工具（文档、研究、网页搜索、WhatsApp 等）？
   - **条件**：是否有 IF/ELSE 分支或人工审批节点？
   - **期望输出**：最终结果是什么？
3. 以简短确认邀请结尾（"确认后回复 好的/继续，我将生成工作流。"）。

规则：
- 使用列表，总共不超过 8–12 行。
- 禁止使用 <<<IDA_WORKFLOW_START>>> 标记或工作流 JSON。`,
    };
    return instructions[locale];
  }

  if (context.phase === "edit") {
    const workflowJson = context.activeWorkflow
      ? formatWorkflowContextForPrompt(context.activeWorkflow)
      : "{}";

    const instructions: Record<Locale, string> = {
      id: `## Mode Workflow — Edit via Chat
Pengguna mengedit workflow yang SUDAH ADA di canvas. Terapkan perubahan dari instruksi natural language.

Workflow aktif saat ini (JSON referensi — pertahankan id node yang tidak diubah):
${workflowJson}

Kemampuan edit yang harus kamu pahami:
- Tambah / hapus node (termasuk approval, condition, trigger, action, output)
- Ubah prompt node, tool/action pada node action, kondisi, output, trigger schedule
- Ganti struktur edges agar tetap valid
- Terapkan template jika diminta (ganti graph aktif dengan struktur template yang relevan)

Aturan sinkronisasi:
- Pertahankan "id" node yang sudah ada jika node masih relevan (cocokkan id atau label).
- Untuk node action, sertakan "action" dan "actionParams" bila memakai tool.
- Sertakan "prompt" pada node action/condition/output/approval.

Output:
- Tulis maksimal 2 kalimat konfirmasi singkat di luar penanda.
- Kemudian keluarkan SATU workflow JSON LENGKAP yang sudah diperbarui di antara penanda workflow.`,
      en: `## Workflow Mode — Edit via Chat
The user is editing an EXISTING canvas workflow via natural language.

Current active workflow (reference JSON — preserve unchanged node ids when possible):
${workflowJson}

Edits you must understand:
- Add / remove nodes (including approval, condition, trigger, action, output)
- Change node prompts, action tools (action + actionParams), conditions, outputs, trigger schedule
- Rewire edges to stay valid
- Apply a template when asked (replace active graph with the relevant template structure)

CRITICAL sync rules:
- Preserve existing node "id" values whenever the node still exists (match by id or label).
- For action nodes, include "action" (llm | web_search | research | worksheet_update | map_pin) and "actionParams" when tools are used.
- Include "prompt" on action/condition/output/approval nodes.

Output:
- Write at most 2 short confirmation sentences outside markers.
- Then emit ONE complete UPDATED workflow JSON between workflow markers.`,
      zh: `## 工作流模式 — 聊天编辑
用户通过自然语言编辑画布上已有的工作流。

当前活动工作流（参考 JSON — 尽量保留未修改节点的 id）：
${workflowJson}

需理解的编辑能力：
- 添加/删除节点（含审批、条件、触发器、动作、输出）
- 修改节点提示词、动作工具（action + actionParams）、条件、输出、触发器计划
- 调整连线保持有效
- 按用户要求应用模板（用相关模板结构替换当前图）

同步规则：
- 保留现有节点的 "id"（按 id 或标签匹配）。
- 动作节点需包含 "action" 和 "actionParams"。
- action/condition/output/approval 节点需包含 "prompt"。

输出：
- 标记外最多 2 句简短确认。
- 然后在工作流标记内输出一份完整的更新后 JSON。`,
    };
    return instructions[locale];
  }

  const instructions: Record<Locale, string> = {
    id: `## Mode Workflow — Generate (setelah konfirmasi)
Pengguna sudah mengonfirmasi kebutuhan workflow. Bangun workflow lengkap sekarang.

Ringkas keputusan dari percakapan discovery sebelumnya, lalu hasilkan JSON workflow valid.
Sertakan node trigger yang sesuai, action nodes dengan prompt jelas, condition/approval bila dibutuhkan, dan output node.`,
    en: `## Workflow Mode — Generate (post-confirmation)
The user confirmed requirements. Build the complete workflow now.

Summarize decisions from the prior discovery conversation, then output valid workflow JSON.
Include an appropriate trigger, clear action prompts, condition/approval nodes when needed, and an output node.`,
    zh: `## 工作流模式 — 生成（确认后）
用户已确认需求。现在构建完整工作流。

总结发现阶段的决定，然后输出有效的工作流 JSON。
包含合适的触发器、清晰的动作提示词、必要的条件/审批节点和输出节点。`,
  };

  return instructions[locale];
}