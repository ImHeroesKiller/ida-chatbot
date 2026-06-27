import type { Locale } from "@/lib/config";

export type AgentFileType = "pdf" | "docx" | "xlsx";

export type AgentDocumentCategory =
  | "financial_report"
  | "contract"
  | "spreadsheet_data"
  | "general_document"
  | "unknown";

export type AgentWorkflowStatus =
  | "draft"
  | "analyzing"
  | "proposed"
  | "awaiting_approval"
  | "awaiting_templates"
  | "injecting_placeholders"
  | "approved"
  | "executing"
  | "completed"
  | "cancelled"
  | "failed";

export type AgentGraphNodeId =
  | "user_input"
  | "llm_analysis"
  | "propose_workflow"
  | "user_approve"
  | "request_templates"
  | "upload_templates"
  | "validate_inject"
  | "sandbox_execute"
  | "doc_playwright"
  | "branch_leadtime"
  | "generate_artifacts"
  | "notify_audit"
  | "workflow_complete";

export type AgentToolCategory =
  | "document"
  | "playwright"
  | "placeholder"
  | "custom";

export type AgentBranchType = "sequential" | "parallel" | "conditional";

export type AgentLeadTimeType = "none" | "polling" | "webhook" | "recurring";

export interface AgentUploadedDocument {
  id: string;
  fileName: string;
  fileType: AgentFileType;
  sizeBytes: number;
  extractedPreview: string;
  documentCategory: AgentDocumentCategory;
  validationStatus: "valid" | "warning" | "invalid";
  validationNotes: string[];
  mandatoryFieldsFound: string[];
  mandatoryFieldsMissing: string[];
}

export interface AgentCompanyTemplate {
  id: string;
  fileName: string;
  fileType: "docx" | "pdf";
  sizeBytes: number;
  placeholdersDetected: string[];
  fidelityStatus: "valid" | "warning" | "invalid";
  fidelityNotes: string[];
}

export interface AgentDocumentAnalysis {
  summary: string;
  keyEntities: string[];
  documentTypes: AgentDocumentCategory[];
  validationIssues: string[];
  ruleBasedChecks: string[];
  ragContextUsed: boolean;
  ragSnippet?: string;
}

export interface AgentWorkflowBranch {
  id: string;
  label: string;
  condition?: string;
  stepIds: string[];
}

export interface AgentWorkflowStep {
  id: string;
  order: number;
  title: string;
  description: string;
  agent?: string;
  toolCategory: AgentToolCategory;
  branchType: AgentBranchType;
  leadTimeType: AgentLeadTimeType;
  estimatedDurationMinutes?: number;
  requiresApproval: boolean;
}

export interface AgentPlaceholderPreview {
  templateName: string;
  placeholders: Array<{
    key: string;
    value: string;
    source: string;
    fidelityOk: boolean;
  }>;
}

export interface AgentWorkflowProposal {
  title: string;
  summary: string;
  steps: AgentWorkflowStep[];
  branches: AgentWorkflowBranch[];
  mermaidDiagram: string;
  placeholders: AgentPlaceholderPreview[];
  estimatedTotalMinutes: number;
  sandboxProvider: "e2b" | "docker";
  sandboxNote: string;
}

export interface AgentSandboxSession {
  id: string;
  provider: "e2b";
  status: "created" | "running" | "terminated";
  cpuLimit: string;
  memoryLimit: string;
  networkPolicy: "restricted";
  createdAt: number;
}

export interface AgentExecutionStep {
  stepId: string;
  title: string;
  toolCategory?: AgentToolCategory;
  status: "pending" | "running" | "done" | "skipped" | "waiting" | "error";
  startedAt?: number;
  completedAt?: number;
  output?: string;
}

export interface AgentAuditLogEntry {
  id: string;
  correlationId: string;
  timestamp: number;
  node: AgentGraphNodeId;
  action: string;
  actor: "user" | "agent" | "system";
  details: Record<string, string | number | boolean>;
}

export interface AgentNotification {
  id: string;
  type: "workflow_complete" | "approval_required" | "template_required";
  message: string;
  createdAt: number;
  read: boolean;
}

export interface AgentArtifact {
  id: string;
  name: string;
  type: "document" | "report" | "data" | "audit";
  summary: string;
  content: string;
  createdAt: number;
}

export interface AgentWorkflowRun {
  id: string;
  correlationId: string;
  userId?: string;
  locale: Locale;
  instruction: string;
  status: AgentWorkflowStatus;
  currentNode: AgentGraphNodeId;
  documents: AgentUploadedDocument[];
  templates: AgentCompanyTemplate[];
  analysis?: AgentDocumentAnalysis;
  proposal?: AgentWorkflowProposal;
  sandboxSession?: AgentSandboxSession;
  executionSteps: AgentExecutionStep[];
  artifacts: AgentArtifact[];
  auditLogs: AgentAuditLogEntry[];
  notifications: AgentNotification[];
  createdAt: number;
  updatedAt: number;
}

export type AgentApiAction =
  | "analyze"
  | "approve"
  | "upload_templates"
  | "inject_templates"
  | "execute"
  | "cancel"
  | "edit_workflow";

export interface AgentApiDocumentPayload {
  fileName: string;
  fileType: AgentFileType;
  base64: string;
  sizeBytes: number;
}

export interface AgentApiTemplatePayload {
  fileName: string;
  fileType: "docx" | "pdf";
  base64: string;
  sizeBytes: number;
}

export interface AgentAnalyzeRequest {
  action: "analyze";
  locale: Locale;
  instruction: string;
  documents: AgentApiDocumentPayload[];
  runId?: string;
}

export interface AgentApproveRequest {
  action: "approve";
  runId: string;
}

export interface AgentUploadTemplatesRequest {
  action: "upload_templates";
  runId: string;
  templates: AgentApiTemplatePayload[];
}

export interface AgentInjectTemplatesRequest {
  action: "inject_templates";
  runId: string;
}

export interface AgentExecuteRequest {
  action: "execute";
  runId: string;
}

export interface AgentCancelRequest {
  action: "cancel";
  runId: string;
}

export interface AgentEditWorkflowRequest {
  action: "edit_workflow";
  runId: string;
  steps: AgentWorkflowStep[];
  mermaidDiagram?: string;
}

export type AgentApiRequest =
  | AgentAnalyzeRequest
  | AgentApproveRequest
  | AgentUploadTemplatesRequest
  | AgentInjectTemplatesRequest
  | AgentExecuteRequest
  | AgentCancelRequest
  | AgentEditWorkflowRequest;

export interface AgentApiResponse {
  run: AgentWorkflowRun;
  message?: string;
}