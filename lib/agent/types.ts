import type { Locale } from "@/lib/config";

export type AgentFileType = "pdf" | "docx" | "xlsx";

export type AgentWorkflowStatus =
  | "draft"
  | "analyzing"
  | "proposed"
  | "awaiting_approval"
  | "approved"
  | "executing"
  | "completed"
  | "cancelled"
  | "failed";

export type AgentGraphNodeId =
  | "ingest"
  | "analyze"
  | "validate"
  | "propose"
  | "approval_gate"
  | "execute"
  | "artifact";

export interface AgentUploadedDocument {
  id: string;
  fileName: string;
  fileType: AgentFileType;
  sizeBytes: number;
  extractedPreview: string;
  validationStatus: "valid" | "warning" | "invalid";
  validationNotes: string[];
}

export interface AgentDocumentAnalysis {
  summary: string;
  keyEntities: string[];
  validationIssues: string[];
  ragContextUsed: boolean;
  ragSnippet?: string;
}

export interface AgentWorkflowStep {
  id: string;
  order: number;
  title: string;
  description: string;
  agent?: string;
  requiresApproval: boolean;
}

export interface AgentPlaceholderPreview {
  templateName: string;
  placeholders: Array<{ key: string; value: string; source: string }>;
}

export interface AgentWorkflowProposal {
  title: string;
  summary: string;
  steps: AgentWorkflowStep[];
  mermaidDiagram: string;
  placeholders: AgentPlaceholderPreview[];
  sandboxNote: string;
}

export interface AgentExecutionStep {
  stepId: string;
  title: string;
  status: "pending" | "running" | "done" | "skipped" | "error";
  startedAt?: number;
  completedAt?: number;
  output?: string;
}

export interface AgentArtifact {
  id: string;
  name: string;
  type: "document" | "report" | "data";
  summary: string;
  content: string;
  createdAt: number;
}

export interface AgentWorkflowRun {
  id: string;
  userId?: string;
  locale: Locale;
  instruction: string;
  status: AgentWorkflowStatus;
  currentNode: AgentGraphNodeId;
  documents: AgentUploadedDocument[];
  analysis?: AgentDocumentAnalysis;
  proposal?: AgentWorkflowProposal;
  executionSteps: AgentExecutionStep[];
  artifacts: AgentArtifact[];
  createdAt: number;
  updatedAt: number;
}

export type AgentApiAction =
  | "analyze"
  | "approve"
  | "execute"
  | "cancel"
  | "edit_workflow";

export interface AgentApiDocumentPayload {
  fileName: string;
  fileType: AgentFileType;
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
  | AgentExecuteRequest
  | AgentCancelRequest
  | AgentEditWorkflowRequest;

export interface AgentApiResponse {
  run: AgentWorkflowRun;
  message?: string;
}