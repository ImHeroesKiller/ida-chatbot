import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import { loadAppConfig } from "@/lib/admin/config";
import { isModelConfigured } from "@/lib/admin/model-selection";
import { findModelDefinition } from "@/lib/admin/models";
import type { Locale } from "@/lib/config";
import { retrieveContext } from "@/lib/rag/retriever";

import type {
  AgentDocumentAnalysis,
  AgentUploadedDocument,
  AgentWorkflowProposal,
  AgentWorkflowStep,
} from "./types";

function createStepId(order: number): string {
  return `step-${order}`;
}

function buildMermaidDiagram(steps: AgentWorkflowStep[]): string {
  const lines = ["flowchart TD", "  start([Start])"];

  steps.forEach((step, index) => {
    const nodeId = `s${index + 1}`;
    const safeTitle = step.title.replace(/"/g, "'");
    lines.push(`  ${nodeId}["${safeTitle}"]`);

    if (index === 0) {
      lines.push(`  start --> ${nodeId}`);
    } else {
      lines.push(`  s${index} --> ${nodeId}`);
    }
  });

  const last = steps.length;
  lines.push(`  s${last} --> gate{Human Approval}`);
  lines.push("  gate -->|Approve| exec[Sandbox Execute]");
  lines.push("  gate -->|Edit| edit[Revise Workflow]");
  lines.push("  edit --> s1");
  lines.push("  exec --> done([Artifacts])");

  return lines.join("\n");
}

function buildMockProposal(options: {
  instruction: string;
  documents: AgentUploadedDocument[];
  analysis: AgentDocumentAnalysis;
}): AgentWorkflowProposal {
  const { instruction, documents, analysis } = options;
  const docNames = documents.map((doc) => doc.fileName).join(", ") || "—";

  const steps: AgentWorkflowStep[] = [
    {
      id: createStepId(1),
      order: 1,
      title: "Parse & Index Documents",
      description: `Ekstrak dan validasi ${documents.length} dokumen (${docNames}).`,
      agent: "ingest-agent",
      requiresApproval: false,
    },
    {
      id: createStepId(2),
      order: 2,
      title: "Context Enrichment (RAG)",
      description: analysis.ragContextUsed
        ? "Gabungkan konteks knowledge base perusahaan dengan instruksi pengguna."
        : "Gunakan instruksi dan ringkasan dokumen sebagai konteks utama.",
      agent: "rag-agent",
      requiresApproval: false,
    },
    {
      id: createStepId(3),
      order: 3,
      title: "Workflow Planning",
      description: `Rancang alur otomatis untuk: "${instruction.slice(0, 120)}${instruction.length > 120 ? "…" : ""}"`,
      agent: "planner-agent",
      requiresApproval: false,
    },
    {
      id: createStepId(4),
      order: 4,
      title: "Human Approval Gate",
      description:
        "Tinjau proposal workflow sebelum eksekusi di sandbox terisolasi.",
      agent: "approval-gate",
      requiresApproval: true,
    },
    {
      id: createStepId(5),
      order: 5,
      title: "Sandbox Execution",
      description:
        "Jalankan langkah-langkah yang disetujui di lingkungan terisolasi.",
      agent: "executor-agent",
      requiresApproval: true,
    },
    {
      id: createStepId(6),
      order: 6,
      title: "Artifact Generation",
      description: "Hasilkan dokumen/laporan output dan simpan sebagai artifact.",
      agent: "artifact-agent",
      requiresApproval: false,
    },
  ];

  return {
    title: "AgentFlow Workflow Proposal",
    summary: analysis.summary,
    steps,
    mermaidDiagram: buildMermaidDiagram(steps),
    placeholders: [
      {
        templateName: "workflow-output.md",
        placeholders: [
          {
            key: "{{instruction}}",
            value: instruction.slice(0, 200),
            source: "user instruction",
          },
          {
            key: "{{document_count}}",
            value: String(documents.length),
            source: "uploaded documents",
          },
          {
            key: "{{analysis_summary}}",
            value: analysis.summary.slice(0, 300),
            source: "document analysis",
          },
        ],
      },
    ],
    sandboxNote:
      "Eksekusi berjalan di sandbox terisolasi. Tidak ada akses langsung ke sistem produksi tanpa persetujuan eksplisit.",
  };
}

async function generateWithLlm(options: {
  instruction: string;
  documents: AgentUploadedDocument[];
  analysis: AgentDocumentAnalysis;
  ragContext: string;
  locale: Locale;
}): Promise<AgentWorkflowProposal | null> {
  const appConfig = await loadAppConfig();
  const modelSelection = appConfig.defaultModel;
  const modelDef = findModelDefinition(
    modelSelection.id,
    modelSelection.provider,
  );

  if (
    !modelDef ||
    modelSelection.provider !== "google" ||
    !isModelConfigured(modelSelection)
  ) {
    return null;
  }

  const model = new ChatGoogleGenerativeAI({
    model: modelSelection.id,
    temperature: 0.3,
    maxOutputTokens: 4096,
  });

  const docSummary = options.documents
    .map(
      (doc) =>
        `- ${doc.fileName} (${doc.fileType}): ${doc.extractedPreview.slice(0, 400)}`,
    )
    .join("\n");

  const systemPrompt = `You are AgentFlow AI, a workflow automation planner for IDA.
Return ONLY valid JSON matching this schema:
{
  "title": string,
  "summary": string,
  "steps": [{ "order": number, "title": string, "description": string, "agent": string, "requiresApproval": boolean }],
  "placeholders": [{ "templateName": string, "placeholders": [{ "key": string, "value": string, "source": string }] }]
}
Include 4-7 steps. Always include human approval before execution. Locale: ${options.locale}.`;

  const userPrompt = `Instruction: ${options.instruction}

Document analysis:
${options.analysis.summary}

Entities: ${options.analysis.keyEntities.join(", ")}

Documents:
${docSummary}

Company RAG context:
${options.ragContext || "No RAG context available."}`;

  try {
    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);

    const raw =
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as {
      title?: string;
      summary?: string;
      steps?: Array<{
        order: number;
        title: string;
        description: string;
        agent?: string;
        requiresApproval?: boolean;
      }>;
      placeholders?: AgentWorkflowProposal["placeholders"];
    };

    if (!parsed.steps?.length) return null;

    const steps: AgentWorkflowStep[] = parsed.steps.map((step, index) => ({
      id: createStepId(step.order ?? index + 1),
      order: step.order ?? index + 1,
      title: step.title,
      description: step.description,
      agent: step.agent,
      requiresApproval: Boolean(step.requiresApproval),
    }));

    return {
      title: parsed.title ?? "AgentFlow Workflow Proposal",
      summary: parsed.summary ?? options.analysis.summary,
      steps,
      mermaidDiagram: buildMermaidDiagram(steps),
      placeholders: parsed.placeholders ?? [],
      sandboxNote:
        "Eksekusi berjalan di sandbox terisolasi. Semua langkah kritis memerlukan persetujuan manusia.",
    };
  } catch (error) {
    console.error("[AgentFlow] LLM workflow generation failed", error);
    return null;
  }
}

export async function buildDocumentAnalysis(options: {
  instruction: string;
  documents: AgentUploadedDocument[];
  locale: Locale;
  ragEnabled: boolean;
}): Promise<AgentDocumentAnalysis> {
  const { instruction, documents, locale, ragEnabled } = options;

  let ragContextUsed = false;
  let ragSnippet: string | undefined;

  if (ragEnabled) {
    const retrieval = await retrieveContext({
      query: instruction,
      locale,
      enabled: true,
    });

    if (retrieval.usedRag && retrieval.context) {
      ragContextUsed = true;
      ragSnippet = retrieval.context.slice(0, 800);
    }
  }

  const entities = documents
    .flatMap((doc) => doc.fileName.replace(/\.[^.]+$/, "").split(/[-_\s]+/))
    .filter((part) => part.length > 2)
    .slice(0, 8);

  const validationIssues = documents.flatMap((doc) => doc.validationNotes);

  const summaryParts = [
    `Instruksi: ${instruction.slice(0, 200)}${instruction.length > 200 ? "…" : ""}`,
    `${documents.length} dokumen dianalisis.`,
    documents.length > 0
      ? `File: ${documents.map((d) => d.fileName).join(", ")}.`
      : "Tidak ada dokumen — workflow berbasis instruksi saja.",
    ragContextUsed
      ? "Konteks knowledge base perusahaan digabungkan via RAG."
      : "RAG tidak digunakan atau tidak ada konteks relevan.",
  ];

  return {
    summary: summaryParts.join(" "),
    keyEntities: entities.length > 0 ? entities : ["workflow", "automation"],
    validationIssues,
    ragContextUsed,
    ragSnippet,
  };
}

export async function generateWorkflowProposal(options: {
  instruction: string;
  documents: AgentUploadedDocument[];
  analysis: AgentDocumentAnalysis;
  locale: Locale;
  ragEnabled: boolean;
}): Promise<AgentWorkflowProposal> {
  let ragContext = options.analysis.ragSnippet ?? "";

  if (!ragContext && options.ragEnabled) {
    const retrieval = await retrieveContext({
      query: options.instruction,
      locale: options.locale,
      enabled: true,
    });
    ragContext = retrieval.context;
  }

  const llmProposal = await generateWithLlm({
    ...options,
    ragContext,
  });

  if (llmProposal) return llmProposal;

  return buildMockProposal(options);
}