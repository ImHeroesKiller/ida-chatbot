import { randomUUID } from "crypto";

import { loadAppConfig } from "@/lib/admin/config";

import { logNodeTransition } from "../observability/audit-log";
import {
  buildPlaceholderInjectionPreview,
  processUploadedTemplate,
} from "../templates/template-engine";
import type { AgentGraphState } from "./state";
import { applyGraphTransition } from "./graph";
import {
  buildDocumentAnalysis,
  generateWorkflowProposal,
} from "../workflow/proposal-generator";
import type { AgentWorkflowRun } from "../types";

function withAudit(
  run: AgentWorkflowRun,
  node: AgentWorkflowRun["currentNode"],
  action: string,
  actor: "user" | "agent" | "system",
  details?: Record<string, string | number | boolean>,
): AgentWorkflowRun {
  return {
    ...applyGraphTransition(run, node),
    auditLogs: logNodeTransition({
      logs: run.auditLogs,
      correlationId: run.correlationId,
      node,
      action,
      actor,
      details,
    }),
  };
}

export function nodeUserInput(state: AgentGraphState): Partial<AgentGraphState> {
  const run = withAudit(state.run, "user_input", "ingest_user_input", "user", {
    documentCount: state.run.documents.length,
  });
  return { run, interruptedAt: null };
}

export async function nodeLlmAnalysis(
  state: AgentGraphState,
): Promise<Partial<AgentGraphState>> {
  const appConfig = await loadAppConfig();
  let run = withAudit(state.run, "llm_analysis", "start_llm_analysis", "agent");

  const analysis = await buildDocumentAnalysis({
    instruction: run.instruction,
    documents: run.documents,
    locale: run.locale,
    ragEnabled: appConfig.features.rag,
  });

  run = { ...run, analysis };
  return { run };
}

export async function nodeProposeWorkflow(
  state: AgentGraphState,
): Promise<Partial<AgentGraphState>> {
  const appConfig = await loadAppConfig();
  if (!state.run.analysis) {
    return { error: "Analysis required before workflow proposal." };
  }

  let run = withAudit(
    state.run,
    "propose_workflow",
    "generate_workflow_proposal",
    "agent",
    { ragUsed: state.run.analysis.ragContextUsed },
  );

  const proposal = await generateWorkflowProposal({
    instruction: run.instruction,
    documents: run.documents,
    analysis: state.run.analysis,
    locale: run.locale,
    ragEnabled: appConfig.features.rag,
  });

  run = {
    ...applyGraphTransition(run, "user_approve"),
    proposal,
    notifications: [
      ...run.notifications,
      {
        id: `notif-${randomUUID().slice(0, 6)}`,
        type: "approval_required",
        message: "Workflow proposal ready — review and approve to continue.",
        createdAt: Date.now(),
        read: false,
      },
    ],
  };

  return { run };
}

export function nodeRequestTemplates(
  state: AgentGraphState,
): Partial<AgentGraphState> {
  const run = withAudit(
    state.run,
    "request_templates",
    "workflow_approved_request_templates",
    "user",
  );

  return {
    run: {
      ...run,
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
    },
  };
}

export function nodeUploadTemplates(
  state: AgentGraphState,
): Partial<AgentGraphState> {
  const run = withAudit(
    state.run,
    "upload_templates",
    "templates_uploaded",
    "user",
    { templateCount: state.run.templates.length },
  );
  return { run };
}

export function nodeValidateInject(
  state: AgentGraphState,
): Partial<AgentGraphState> {
  if (!state.run.templates.length) {
    return { error: "Upload at least one company template." };
  }

  const placeholders = buildPlaceholderInjectionPreview(
    state.run,
    state.run.templates,
  );

  const withPlaceholders = {
    ...state.run,
    proposal: state.run.proposal
      ? { ...state.run.proposal, placeholders }
      : state.run.proposal,
  };

  const run = {
    ...withAudit(
      withPlaceholders,
      "validate_inject",
      "placeholders_injected",
      "agent",
      {
        placeholderCount: placeholders.reduce(
          (sum, t) => sum + t.placeholders.length,
          0,
        ),
      },
    ),
    ...applyGraphTransition(withPlaceholders, "execution_approve"),
  };

  return { run };
}

export function attachTemplatesToRun(
  run: AgentWorkflowRun,
  templates: Array<{
    fileName: string;
    fileType: "docx" | "pdf";
    sizeBytes: number;
  }>,
): AgentWorkflowRun {
  return {
    ...run,
    templates: templates.map(processUploadedTemplate),
    updatedAt: Date.now(),
  };
}