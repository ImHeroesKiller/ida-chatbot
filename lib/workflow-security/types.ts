/** Workflow visibility scope (Phase 3.3). */
export type WorkflowVisibility = "private" | "shared" | "company";

/** Per-user role on a workflow. */
export type WorkflowPermissionRole = "owner" | "editor" | "viewer";

export type WorkflowApprovalHierarchyRole =
  | "owner"
  | "editor"
  | "viewer"
  | "manager"
  | "director"
  | "admin";

export interface WorkflowPermissionGrant {
  userId: string;
  role: WorkflowPermissionRole;
  grantedAt?: number;
}

export interface WorkflowApprovalLevel {
  level: number;
  label: string;
  requiredRole?: WorkflowApprovalHierarchyRole;
}

export interface WorkflowSecuritySettings {
  visibility: WorkflowVisibility;
  ownerId: string;
  permissions: WorkflowPermissionGrant[];
  /** Multi-level approval chain applied to approval nodes. */
  approvalHierarchy?: WorkflowApprovalLevel[];
}

export interface WorkflowApprovalRecord {
  level: number;
  action: "approve" | "reject";
  actorId?: string;
  note?: string;
  at: number;
}

export interface WorkflowApprovalState {
  nodeId: string;
  totalLevels: number;
  currentLevel: number;
  completedLevels: number[];
  history: WorkflowApprovalRecord[];
}

export type WorkflowAuditAction =
  | "workflow.created"
  | "workflow.updated"
  | "workflow.deleted"
  | "workflow.executed"
  | "workflow.execution_completed"
  | "workflow.execution_failed"
  | "workflow.approval_requested"
  | "workflow.approval_granted"
  | "workflow.approval_rejected"
  | "workflow.approval_escalated"
  | "workflow.security_updated"
  | "workflow.permission_granted";

export type WorkflowAuditActorType = "user" | "system" | "admin";

export interface WorkflowAuditEntry {
  id: string;
  workflowId: string | null;
  workflowName: string | null;
  userId: string | null;
  sessionId: string | null;
  action: WorkflowAuditAction;
  actorType: WorkflowAuditActorType;
  details: Record<string, unknown>;
  createdAt: string;
}

export const WORKFLOW_VISIBILITY_LABELS: Record<WorkflowVisibility, string> = {
  private: "Private",
  shared: "Shared",
  company: "Company",
};

export const WORKFLOW_ROLE_LABELS: Record<WorkflowPermissionRole, string> = {
  owner: "Owner",
  editor: "Editor",
  viewer: "Viewer",
};