import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import { loadAppConfig } from "@/lib/admin/config";
import { isModelConfigured } from "@/lib/admin/model-selection";
import { findModelDefinition } from "@/lib/admin/models";
import type { Locale } from "@/lib/config";
import { retrieveContext } from "@/lib/rag/retriever";

import { summarizeDocumentTypes } from "./document-validator";
import { AGENTFLOW_SPEC_MERMAID } from "./spec-diagram";
import type {
  AgentDocumentAnalysis,
  AgentUploadedDocument,
  AgentWorkflowBranch,
  AgentWorkflowProposal,
  AgentWorkflowStep,
} from "./types";

function createStepId(order: number): string {
  return `step-${order}`;
}

function buildSpecBranches(steps: AgentWorkflowStep[]): AgentWorkflowBranch[] {
  const docSteps = steps
    .filter((s) => s.toolCategory === "document")
    .map((s) => s.id);
  const browserSteps = steps
    .filter((s) => s.toolCategory === "playwright")
    .map((s) => s.id);

  return [
    {
      id: "branch-main",
      label: "Main sequential path",
      stepIds: steps.map((s) => s.id),
    },
    {
      id: "branch-doc",
      label: "Document processing branch",
      condition: "toolCategory === document",
      stepIds: docSteps.length > 0 ? docSteps : [steps[0]?.id].filter(Boolean),
    },
    {
      id: "branch-browser",
      label: "Playwright automation branch",
      condition: "requires web interaction",
      stepIds:
        browserSteps.length > 0
          ? browserSteps
          : [steps[steps.length - 1]?.id].filter(Boolean),
    },
  ];
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
      title: "LLM Semantic Analysis & Rule Validation",
      description:
        "Analisis semantik dokumen + validasi rule-based (mandatory fields, tipe dokumen).",
      agent: "analysis-agent",
      toolCategory: "document",
      branchType: "sequential",
      leadTimeType: "none",
      estimatedDurationMinutes: 2,
      requiresApproval: false,
    },
    {
      id: createStepId(2),
      order: 2,
      title: "Context Enrichment (RAG)",
      description: analysis.ragContextUsed
        ? "Gabungkan konteks knowledge base perusahaan."
        : "Gunakan instruksi dan ringkasan dokumen sebagai konteks.",
      agent: "rag-agent",
      toolCategory: "custom",
      branchType: "sequential",
      leadTimeType: "none",
      estimatedDurationMinutes: 1,
      requiresApproval: false,
    },
    {
      id: createStepId(3),
      order: 3,
      title: "Workflow Planning (LangGraph)",
      description: `Rancang alur untuk: "${instruction.slice(0, 100)}${instruction.length > 100 ? "…" : ""}"`,
      agent: "planner-agent",
      toolCategory: "custom",
      branchType: "conditional",
      leadTimeType: "none",
      estimatedDurationMinutes: 3,
      requiresApproval: false,
    },
    {
      id: createStepId(4),
      order: 4,
      title: "Human Approval Gate",
      description: "Tinjau proposal sebelum template upload dan eksekusi.",
      agent: "approval-gate",
      toolCategory: "custom",
      branchType: "conditional",
      leadTimeType: "none",
      estimatedDurationMinutes: 0,
      requiresApproval: true,
    },
    {
      id: createStepId(5),
      order: 5,
      title: "Template Upload & Placeholder Injection",
      description:
        "Upload template perusahaan (DOCX/PDF), injeksi {{placeholder}} dengan fidelity validation.",
      agent: "template-agent",
      toolCategory: "placeholder",
      branchType: "sequential",
      leadTimeType: "none",
      estimatedDurationMinutes: 5,
      requiresApproval: false,
    },
    {
      id: createStepId(6),
      order: 6,
      title: "Document Processing (python-docx, openpyxl, pypdf)",
      description: `Proses ${documents.length} dokumen (${docNames}) di sandbox E2B.`,
      agent: "document-agent",
      toolCategory: "document",
      branchType: "parallel",
      leadTimeType: "none",
      estimatedDurationMinutes: 8,
      requiresApproval: false,
    },
    {
      id: createStepId(7),
      order: 7,
      title: "Playwright Browser Automation",
      description:
        "Automasi browser pada aplikasi internal — auth, form submit, data extraction.",
      agent: "playwright-agent",
      toolCategory: "playwright",
      branchType: "parallel",
      leadTimeType: "polling",
      estimatedDurationMinutes: 10,
      requiresApproval: true,
    },
    {
      id: createStepId(8),
      order: 8,
      title: "Branched Execution + Lead Time",
      description:
        "Conditional routing, parallel branches, polling/webhook untuk lead time.",
      agent: "branch-agent",
      toolCategory: "custom",
      branchType: "conditional",
      leadTimeType: "webhook",
      estimatedDurationMinutes: 15,
      requiresApproval: false,
    },
    {
      id: createStepId(9),
      order: 9,
      title: "Generate Artifacts & Notify",
      description: "Hasilkan dokumen final, laporan, audit log, notifikasi chat.",
      agent: "artifact-agent",
      toolCategory: "document",
      branchType: "sequential",
      leadTimeType: "none",
      estimatedDurationMinutes: 3,
      requiresApproval: false,
    },
  ];

  const branches = buildSpecBranches(steps);
  const estimatedTotalMinutes = steps.reduce(
    (sum, s) => sum + (s.estimatedDurationMinutes ?? 0),
    0,
  );

  return {
    title: "AgentFlow Workflow Proposal",
    summary: analysis.summary,
    steps,
    branches,
    mermaidDiagram: AGENTFLOW_SPEC_MERMAID,
    placeholders: [
      {
        templateName: "company-template.docx",
        placeholders: [
          {
            key: "{{instruction}}",
            value: instruction.slice(0, 200),
            source: "user instruction",
            fidelityOk: true,
          },
          {
            key: "{{analysis_summary}}",
            value: analysis.summary.slice(0, 300),
            source: "document analysis",
            fidelityOk: true,
          },
          {
            key: "{{date}}",
            value: new Date().toISOString().slice(0, 10),
            source: "system",
            fidelityOk: true,
          },
        ],
      },
    ],
    estimatedTotalMinutes,
    sandboxProvider: "e2b",
    sandboxNote:
      "Eksekusi di E2B Firecracker microVM (prototype). Credentials via env vars only. Human approval gate wajib sebelum eksekusi sensitif.",
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

  const systemPrompt = `You are AgentFlow AI planner. Return ONLY valid JSON:
{
  "title": string,
  "summary": string,
  "steps": [{
    "order": number, "title": string, "description": string,
    "agent": string, "toolCategory": "document"|"playwright"|"placeholder"|"custom",
    "branchType": "sequential"|"parallel"|"conditional",
    "leadTimeType": "none"|"polling"|"webhook"|"recurring",
    "estimatedDurationMinutes": number, "requiresApproval": boolean
  }]
}
Include human approval, template injection, Playwright, and branching. Locale: ${options.locale}.`;

  const userPrompt = `Instruction: ${options.instruction}
Analysis: ${options.analysis.summary}
Document types: ${options.analysis.documentTypes.join(", ")}
RAG: ${options.ragContext || "none"}`;

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
        toolCategory?: AgentWorkflowStep["toolCategory"];
        branchType?: AgentWorkflowStep["branchType"];
        leadTimeType?: AgentWorkflowStep["leadTimeType"];
        estimatedDurationMinutes?: number;
        requiresApproval?: boolean;
      }>;
    };

    if (!parsed.steps?.length) return null;

    const steps: AgentWorkflowStep[] = parsed.steps.map((step, index) => ({
      id: createStepId(step.order ?? index + 1),
      order: step.order ?? index + 1,
      title: step.title,
      description: step.description,
      agent: step.agent,
      toolCategory: step.toolCategory ?? "custom",
      branchType: step.branchType ?? "sequential",
      leadTimeType: step.leadTimeType ?? "none",
      estimatedDurationMinutes: step.estimatedDurationMinutes ?? 5,
      requiresApproval: Boolean(step.requiresApproval),
    }));

    const estimatedTotalMinutes = steps.reduce(
      (sum, s) => sum + (s.estimatedDurationMinutes ?? 0),
      0,
    );

    return {
      title: parsed.title ?? "AgentFlow Workflow Proposal",
      summary: parsed.summary ?? options.analysis.summary,
      steps,
      branches: buildSpecBranches(steps),
      mermaidDiagram: AGENTFLOW_SPEC_MERMAID,
      placeholders: buildMockProposal(options).placeholders,
      estimatedTotalMinutes,
      sandboxProvider: "e2b",
      sandboxNote:
        "Eksekusi di E2B sandbox terisolasi. Semua langkah sensitif memerlukan persetujuan manusia.",
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

  const documentTypes = summarizeDocumentTypes(documents);
  const validationIssues = documents.flatMap((doc) => doc.validationNotes);

  const ruleBasedChecks = documents.flatMap((doc) => {
    const checks: string[] = [
      `${doc.fileName}: type=${doc.documentCategory}, status=${doc.validationStatus}`,
    ];
    if (doc.mandatoryFieldsMissing.length > 0) {
      checks.push(
        `${doc.fileName}: missing fields — ${doc.mandatoryFieldsMissing.join(", ")}`,
      );
    }
    return checks;
  });

  const summaryParts = [
    `Instruksi: ${instruction.slice(0, 200)}${instruction.length > 200 ? "…" : ""}`,
    `${documents.length} dokumen dianalisis dengan validasi rule-based + LLM.`,
    documentTypes.length > 0
      ? `Tipe dokumen: ${documentTypes.join(", ")}.`
      : "Tipe dokumen: general.",
    ragContextUsed
      ? "Konteks RAG perusahaan digabungkan."
      : "RAG tidak digunakan atau tidak ada konteks relevan.",
  ];

  return {
    summary: summaryParts.join(" "),
    keyEntities: entities.length > 0 ? entities : ["workflow", "automation"],
    documentTypes,
    validationIssues,
    ruleBasedChecks,
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

  const llmProposal = await generateWithLlm({ ...options, ragContext });
  if (llmProposal) return llmProposal;

  return buildMockProposal(options);
}