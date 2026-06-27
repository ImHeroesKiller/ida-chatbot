import { randomUUID } from "crypto";

import { loadAppConfig } from "@/lib/admin/config";
import type { Locale } from "@/lib/config";

import {
  detectAgentFileType,
  extractAgentDocumentText,
  validateExtractedDocument,
} from "./extract-upload";
import {
  advanceGraphNode,
  applyGraphTransition,
} from "./graph";
import type {
  AgentApiRequest,
  AgentArtifact,
  AgentExecutionStep,
  AgentUploadedDocument,
  AgentWorkflowRun,
  AgentWorkflowStep,
} from "./types";
import {
  buildDocumentAnalysis,
  generateWorkflowProposal,
} from "./workflow-generator";

function createRunId(): string {
  return `agent-${Date.now()}-${randomUUID().slice(0, 8)}`;
}

function createDocumentId(): string {
  return `doc-${randomUUID().slice(0, 8)}`;
}

export async function extractDocumentsFromPayload(
  payloads: Array<{
    fileName: string;
    fileType: "pdf" | "docx" | "xlsx";
    base64: string;
    sizeBytes: number;
  }>,
  locale: Locale,
): Promise<AgentUploadedDocument[]> {
  const results: AgentUploadedDocument[] = [];

  for (const payload of payloads.slice(0, 10)) {
    const detected = detectAgentFileType(payload.fileName);
    const fileType = detected ?? payload.fileType;

    if (!fileType) continue;

    const buffer = Buffer.from(payload.base64, "base64");
    const { fullText, preview } = await extractAgentDocumentText({
      buffer,
      fileName: payload.fileName,
      fileType,
      locale,
    });

    const validation = validateExtractedDocument({
      fileName: payload.fileName,
      text: fullText,
    });

    results.push({
      id: createDocumentId(),
      fileName: payload.fileName,
      fileType,
      sizeBytes: payload.sizeBytes,
      extractedPreview: preview,
      validationStatus: validation.status,
      validationNotes: validation.notes,
    });
  }

  return results;
}

export async function runAnalyzeAction(options: {
  instruction: string;
  documents: AgentUploadedDocument[];
  locale: Locale;
  runId?: string;
  userId?: string;
}): Promise<AgentWorkflowRun> {
  const appConfig = await loadAppConfig();
  const now = Date.now();
  const runId = options.runId ?? createRunId();

  let run: AgentWorkflowRun = {
    id: runId,
    userId: options.userId,
    locale: options.locale,
    instruction: options.instruction.trim(),
    status: "analyzing",
    currentNode: "ingest",
    documents: options.documents,
    executionSteps: [],
    artifacts: [],
    createdAt: now,
    updatedAt: now,
  };

  run = applyGraphTransition(run, "analyze");

  const analysis = await buildDocumentAnalysis({
    instruction: run.instruction,
    documents: run.documents,
    locale: run.locale,
    ragEnabled: appConfig.features.rag,
  });

  run = { ...run, analysis };
  run = applyGraphTransition(run, "validate");
  run = applyGraphTransition(run, "propose");

  const proposal = await generateWorkflowProposal({
    instruction: run.instruction,
    documents: run.documents,
    analysis,
    locale: run.locale,
    ragEnabled: appConfig.features.rag,
  });

  run = {
    ...run,
    proposal,
    status: "awaiting_approval",
    currentNode: "approval_gate",
    updatedAt: Date.now(),
  };

  return run;
}

export function runApproveAction(run: AgentWorkflowRun): AgentWorkflowRun {
  if (run.status !== "awaiting_approval" && run.status !== "proposed") {
    throw new Error("Workflow is not awaiting approval.");
  }

  return {
    ...run,
    status: "approved",
    updatedAt: Date.now(),
  };
}

export function runEditWorkflowAction(
  run: AgentWorkflowRun,
  steps: AgentWorkflowStep[],
  mermaidDiagram?: string,
): AgentWorkflowRun {
  if (!run.proposal) {
    throw new Error("No workflow proposal to edit.");
  }

  return {
    ...run,
    proposal: {
      ...run.proposal,
      steps: steps.map((step, index) => ({
        ...step,
        order: index + 1,
        id: step.id || `step-${index + 1}`,
      })),
      mermaidDiagram: mermaidDiagram ?? run.proposal.mermaidDiagram,
    },
    status: "awaiting_approval",
    currentNode: "approval_gate",
    updatedAt: Date.now(),
  };
}

export function runCancelAction(run: AgentWorkflowRun): AgentWorkflowRun {
  return {
    ...run,
    status: "cancelled",
    updatedAt: Date.now(),
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runExecuteAction(
  run: AgentWorkflowRun,
): Promise<AgentWorkflowRun> {
  if (run.status !== "approved") {
    throw new Error("Workflow must be approved before execution.");
  }

  const steps = run.proposal?.steps ?? [];
  const executionSteps: AgentExecutionStep[] = steps.map((step) => ({
    stepId: step.id,
    title: step.title,
    status: "pending" as const,
  }));

  let current: AgentWorkflowRun = {
    ...run,
    status: "executing",
    currentNode: "execute",
    executionSteps,
    updatedAt: Date.now(),
  };

  for (let i = 0; i < executionSteps.length; i++) {
    const step = executionSteps[i];
    executionSteps[i] = {
      ...step,
      status: "running",
      startedAt: Date.now(),
    };
    current = {
      ...current,
      executionSteps: [...executionSteps],
      updatedAt: Date.now(),
    };

    await delay(400 + Math.random() * 300);

    executionSteps[i] = {
      ...executionSteps[i],
      status: "done",
      completedAt: Date.now(),
      output:
        step.title.includes("Approval") || step.title.includes("Human")
          ? "Skipped — approval already granted by user."
          : `Completed in sandbox: ${step.title}`,
    };
  }

  const artifacts: AgentArtifact[] = [
    {
      id: `artifact-${randomUUID().slice(0, 8)}`,
      name: "workflow-result.md",
      type: "document",
      summary: "Ringkasan hasil eksekusi workflow di sandbox terisolasi.",
      content: buildArtifactContent(current),
      createdAt: Date.now(),
    },
  ];

  const nextNode = advanceGraphNode("execute");
  return {
    ...current,
    executionSteps: [...executionSteps],
    artifacts,
    status: "completed",
    currentNode: nextNode ?? "artifact",
    updatedAt: Date.now(),
  };
}

function buildArtifactContent(run: AgentWorkflowRun): string {
  const lines = [
    `# AgentFlow Execution Result`,
    ``,
    `**Workflow:** ${run.proposal?.title ?? "Untitled"}`,
    `**Instruction:** ${run.instruction}`,
    ``,
    `## Summary`,
    run.proposal?.summary ?? run.analysis?.summary ?? "—",
    ``,
    `## Steps Executed`,
  ];

  for (const step of run.executionSteps) {
    lines.push(
      `- [${step.status}] ${step.title}${step.output ? ` — ${step.output}` : ""}`,
    );
  }

  lines.push(
    ``,
    `## Sandbox Notice`,
    run.proposal?.sandboxNote ??
      "Execution completed in isolated sandbox environment.",
    ``,
    `---`,
    `Generated by AgentFlow AI · ${new Date().toISOString()}`,
  );

  return lines.join("\n");
}

export async function handleAgentRequest(
  request: AgentApiRequest,
  existingRun?: AgentWorkflowRun,
  userId?: string,
): Promise<AgentWorkflowRun> {
  switch (request.action) {
    case "analyze": {
      const documents = await extractDocumentsFromPayload(
        request.documents,
        request.locale,
      );
      return runAnalyzeAction({
        instruction: request.instruction,
        documents,
        locale: request.locale,
        runId: request.runId,
        userId,
      });
    }
    case "approve": {
      if (!existingRun) throw new Error("Workflow run not found.");
      return runApproveAction(existingRun);
    }
    case "edit_workflow": {
      if (!existingRun) throw new Error("Workflow run not found.");
      return runEditWorkflowAction(
        existingRun,
        request.steps,
        request.mermaidDiagram,
      );
    }
    case "execute": {
      if (!existingRun) throw new Error("Workflow run not found.");
      return runExecuteAction(existingRun);
    }
    case "cancel": {
      if (!existingRun) throw new Error("Workflow run not found.");
      return runCancelAction(existingRun);
    }
    default:
      throw new Error("Unknown agent action.");
  }
}