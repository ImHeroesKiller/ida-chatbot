import { randomUUID } from "crypto";

import { loadAppConfig } from "@/lib/admin/config";
import type { Locale } from "@/lib/config";

import { createCorrelationId, logNodeTransition } from "./audit-log";
import { persistRunState } from "./checkpointer";
import {
  detectAgentFileType,
  extractAgentDocumentText,
  validateExtractedDocument,
} from "./extract-upload";
import { applyGraphTransition } from "./graph";
import { syncOrchestratorNode } from "./langgraph-orchestrator";
import { executeInE2bSandbox, isE2bConfigured } from "./sandbox/e2b-executor";
import {
  buildPlaceholderInjectionPreview,
  processUploadedTemplate,
} from "./template-engine";
import type {
  AgentApiRequest,
  AgentArtifact,
  AgentNotification,
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

function createEmptyRun(options: {
  runId: string;
  locale: Locale;
  instruction: string;
  userId?: string;
}): AgentWorkflowRun {
  const now = Date.now();
  return {
    id: options.runId,
    correlationId: createCorrelationId(),
    userId: options.userId,
    locale: options.locale,
    instruction: options.instruction.trim(),
    status: "draft",
    currentNode: "user_input",
    documents: [],
    templates: [],
    executionSteps: [],
    artifacts: [],
    auditLogs: [],
    notifications: [],
    createdAt: now,
    updatedAt: now,
  };
}

async function transition(
  run: AgentWorkflowRun,
  node: AgentWorkflowRun["currentNode"],
  audit: {
    action: string;
    actor: "user" | "agent" | "system";
    details?: Record<string, string | number | boolean>;
  },
): Promise<AgentWorkflowRun> {
  let next = applyGraphTransition(run, node);
  next = {
    ...next,
    auditLogs: logNodeTransition({
      logs: next.auditLogs,
      correlationId: next.correlationId,
      node,
      action: audit.action,
      actor: audit.actor,
      details: audit.details,
    }),
  };
  next = await syncOrchestratorNode(next, node);
  await persistRunState(next);
  return next;
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
      fileType,
      text: fullText,
    });

    results.push({
      id: createDocumentId(),
      fileName: payload.fileName,
      fileType,
      sizeBytes: payload.sizeBytes,
      extractedPreview: preview,
      documentCategory: validation.category,
      validationStatus: validation.status,
      validationNotes: validation.notes,
      mandatoryFieldsFound: validation.mandatoryFieldsFound,
      mandatoryFieldsMissing: validation.mandatoryFieldsMissing,
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
  const runId = options.runId ?? createRunId();

  let run = createEmptyRun({
    runId,
    locale: options.locale,
    instruction: options.instruction,
    userId: options.userId,
  });
  run.documents = options.documents;

  run = await transition(run, "user_input", {
    action: "ingest_user_input",
    actor: "user",
    details: { documentCount: options.documents.length },
  });

  run = await transition(run, "llm_analysis", {
    action: "start_llm_analysis",
    actor: "agent",
  });

  const analysis = await buildDocumentAnalysis({
    instruction: run.instruction,
    documents: run.documents,
    locale: run.locale,
    ragEnabled: appConfig.features.rag,
  });

  run = { ...run, analysis };

  run = await transition(run, "propose_workflow", {
    action: "generate_workflow_proposal",
    actor: "agent",
    details: { ragUsed: analysis.ragContextUsed },
  });

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
    currentNode: "user_approve",
    updatedAt: Date.now(),
    notifications: [
      {
        id: `notif-${randomUUID().slice(0, 6)}`,
        type: "approval_required",
        message: "Workflow proposal ready — review and approve to continue.",
        createdAt: Date.now(),
        read: false,
      },
    ],
  };

  run = {
    ...run,
    auditLogs: logNodeTransition({
      logs: run.auditLogs,
      correlationId: run.correlationId,
      node: "user_approve",
      action: "awaiting_user_approval",
      actor: "system",
    }),
  };

  await persistRunState(run);
  return run;
}

export function runApproveAction(run: AgentWorkflowRun): AgentWorkflowRun {
  if (run.status !== "awaiting_approval" && run.status !== "proposed") {
    throw new Error("Workflow is not awaiting approval.");
  }

  let next: AgentWorkflowRun = {
    ...run,
    status: "awaiting_templates",
    currentNode: "request_templates",
    updatedAt: Date.now(),
    notifications: [
      ...run.notifications,
      {
        id: `notif-${randomUUID().slice(0, 6)}`,
        type: "template_required",
        message:
          "Upload company templates (DOCX/PDF) for placeholder injection.",
        createdAt: Date.now(),
        read: false,
      },
    ],
  };

  next = {
    ...next,
    auditLogs: logNodeTransition({
      logs: next.auditLogs,
      correlationId: next.correlationId,
      node: "request_templates",
      action: "workflow_approved_request_templates",
      actor: "user",
    }),
  };

  return next;
}

export function runUploadTemplatesAction(
  run: AgentWorkflowRun,
  templates: Array<{
    fileName: string;
    fileType: "docx" | "pdf";
    sizeBytes: number;
  }>,
): AgentWorkflowRun {
  if (run.status !== "awaiting_templates") {
    throw new Error("Workflow is not awaiting templates.");
  }

  const processed = templates.map(processUploadedTemplate);

  const next: AgentWorkflowRun = {
    ...run,
    templates: processed,
    currentNode: "upload_templates",
    updatedAt: Date.now(),
    auditLogs: logNodeTransition({
      logs: run.auditLogs,
      correlationId: run.correlationId,
      node: "upload_templates",
      action: "templates_uploaded",
      actor: "user",
      details: { templateCount: processed.length },
    }),
  };

  return next;
}

export function runInjectTemplatesAction(
  run: AgentWorkflowRun,
): AgentWorkflowRun {
  if (!run.templates.length) {
    throw new Error("Upload at least one company template.");
  }

  const placeholders = buildPlaceholderInjectionPreview(run, run.templates);

  const next: AgentWorkflowRun = {
    ...run,
    status: "approved",
    currentNode: "validate_inject",
    proposal: run.proposal
      ? { ...run.proposal, placeholders }
      : run.proposal,
    updatedAt: Date.now(),
    auditLogs: logNodeTransition({
      logs: run.auditLogs,
      correlationId: run.correlationId,
      node: "validate_inject",
      action: "placeholders_injected",
      actor: "agent",
      details: {
        placeholderCount: placeholders.reduce(
          (sum, t) => sum + t.placeholders.length,
          0,
        ),
      },
    }),
  };

  return next;
}

export function runEditWorkflowAction(
  run: AgentWorkflowRun,
  steps: Array<Partial<AgentWorkflowStep> & Pick<AgentWorkflowStep, "id" | "title" | "description" | "requiresApproval">>,
  mermaidDiagram?: string,
): AgentWorkflowRun {
  if (!run.proposal) throw new Error("No workflow proposal to edit.");

  return {
    ...run,
    proposal: {
      ...run.proposal,
      steps: steps.map((step, index) => ({
        toolCategory: step.toolCategory ?? "custom",
        branchType: step.branchType ?? "sequential",
        leadTimeType: step.leadTimeType ?? "none",
        estimatedDurationMinutes: step.estimatedDurationMinutes ?? 5,
        ...step,
        order: index + 1,
        id: step.id || `step-${index + 1}`,
      })),
      mermaidDiagram: mermaidDiagram ?? run.proposal.mermaidDiagram,
    },
    status: "awaiting_approval",
    currentNode: "user_approve",
    updatedAt: Date.now(),
  };
}

export function runCancelAction(run: AgentWorkflowRun): AgentWorkflowRun {
  return {
    ...run,
    status: "cancelled",
    updatedAt: Date.now(),
    auditLogs: logNodeTransition({
      logs: run.auditLogs,
      correlationId: run.correlationId,
      node: run.currentNode,
      action: "workflow_cancelled",
      actor: "user",
    }),
  };
}

export async function runExecuteAction(
  run: AgentWorkflowRun,
): Promise<AgentWorkflowRun> {
  if (run.status !== "approved") {
    throw new Error("Approve workflow and upload templates before execution.");
  }

  let current = await transition(run, "sandbox_execute", {
    action: "start_e2b_sandbox",
    actor: "system",
    details: { e2bConfigured: isE2bConfigured() },
  });

  const { executionSteps, sandboxSession } = await executeInE2bSandbox(current);

  current = {
    ...current,
    sandboxSession,
    executionSteps,
    status: "executing",
    currentNode: "doc_playwright",
    updatedAt: Date.now(),
  };

  current = await transition(current, "doc_playwright", {
    action: "document_and_playwright_tools",
    actor: "agent",
  });

  current = await transition(current, "branch_leadtime", {
    action: "branched_execution_leadtime",
    actor: "agent",
  });

  current = await transition(current, "generate_artifacts", {
    action: "generate_artifacts",
    actor: "agent",
  });

  const artifacts: AgentArtifact[] = [
    {
      id: `artifact-${randomUUID().slice(0, 8)}`,
      name: "workflow-result.md",
      type: "document",
      summary: "Dokumen hasil eksekusi sandbox sesuai template yang disetujui.",
      content: buildArtifactContent(current),
      createdAt: Date.now(),
    },
    {
      id: `artifact-${randomUUID().slice(0, 8)}`,
      name: "execution-audit.json",
      type: "audit",
      summary: "Structured audit log dengan correlation ID.",
      content: JSON.stringify(
        {
          correlationId: current.correlationId,
          sandboxId: sandboxSession.id,
          auditLogs: current.auditLogs,
          executionSteps: current.executionSteps,
        },
        null,
        2,
      ),
      createdAt: Date.now(),
    },
  ];

  const notification: AgentNotification = {
    id: `notif-${randomUUID().slice(0, 6)}`,
    type: "workflow_complete",
    message: "Workflow selesai — artifact dan audit log tersedia.",
    createdAt: Date.now(),
    read: false,
  };

  current = await transition(current, "notify_audit", {
    action: "notify_and_audit",
    actor: "system",
    details: { artifactCount: artifacts.length },
  });

  current = {
    ...current,
    artifacts,
    executionSteps,
    notifications: [...current.notifications, notification],
    status: "completed",
    currentNode: "workflow_complete",
    updatedAt: Date.now(),
  };

  await persistRunState(current);
  return current;
}

function buildArtifactContent(run: AgentWorkflowRun): string {
  const lines = [
    `# AgentFlow Execution Result`,
    ``,
    `**Correlation ID:** ${run.correlationId}`,
    `**Sandbox:** ${run.sandboxSession?.id ?? "e2b-prototype"} (${run.proposal?.sandboxProvider ?? "e2b"})`,
    `**Workflow:** ${run.proposal?.title ?? "Untitled"}`,
    ``,
    `## Summary`,
    run.proposal?.summary ?? run.analysis?.summary ?? "—",
    ``,
    `## Templates Processed`,
  ];

  for (const tpl of run.templates) {
    lines.push(
      `- ${tpl.fileName}: ${tpl.placeholdersDetected.join(", ")} [${tpl.fidelityStatus}]`,
    );
  }

  lines.push(``, `## Steps Executed`);
  for (const step of run.executionSteps) {
    lines.push(
      `- [${step.status}] ${step.title}${step.output ? ` — ${step.output}` : ""}`,
    );
  }

  lines.push(
    ``,
    `## Branches`,
    ...(run.proposal?.branches.map(
      (b) => `- ${b.label}: ${b.stepIds.length} steps`,
    ) ?? []),
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
    case "upload_templates": {
      if (!existingRun) throw new Error("Workflow run not found.");
      return runUploadTemplatesAction(existingRun, request.templates);
    }
    case "inject_templates": {
      if (!existingRun) throw new Error("Workflow run not found.");
      return runInjectTemplatesAction(existingRun);
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