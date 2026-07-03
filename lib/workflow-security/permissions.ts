import type { WorkflowDefinition } from "@/lib/workflow";

import type {
  WorkflowPermissionRole,
  WorkflowSecuritySettings,
  WorkflowVisibility,
} from "./types";

export type WorkflowAccessAction =
  | "view"
  | "edit"
  | "execute"
  | "approve"
  | "manage_security";

/**
 * Temporary bypass: allow anyone to view/execute workflows without RBAC gates.
 * Set to false when account-level security is ready.
 */
export const WORKFLOW_SECURITY_GUARDS_DISABLED = true;

const ROLE_RANK: Record<WorkflowPermissionRole, number> = {
  viewer: 1,
  editor: 2,
  owner: 3,
};

export function createDefaultWorkflowSecurity(
  ownerId: string,
): WorkflowSecuritySettings {
  return {
    visibility: "private",
    ownerId,
    permissions: [],
    approvalHierarchy: [
      { level: 1, label: "Manager Review", requiredRole: "editor" },
      { level: 2, label: "Director Sign-off", requiredRole: "owner" },
    ],
  };
}

export function normalizeWorkflowSecurity(
  security: WorkflowSecuritySettings | null | undefined,
  ownerId: string,
): WorkflowSecuritySettings {
  const base = createDefaultWorkflowSecurity(ownerId);
  if (!security) return base;

  const visibility: WorkflowVisibility =
    security.visibility === "shared" || security.visibility === "company"
      ? security.visibility
      : "private";

  const permissions = Array.isArray(security.permissions)
    ? security.permissions.filter(
        (grant) =>
          typeof grant.userId === "string" &&
          grant.userId.trim() &&
          (grant.role === "owner" ||
            grant.role === "editor" ||
            grant.role === "viewer"),
      )
    : [];

  const approvalHierarchy =
    Array.isArray(security.approvalHierarchy) &&
    security.approvalHierarchy.length > 0
      ? security.approvalHierarchy
      : base.approvalHierarchy;

  return {
    visibility,
    ownerId: security.ownerId?.trim() || ownerId,
    permissions,
    approvalHierarchy,
  };
}

export function getWorkflowSecurity(
  workflow: WorkflowDefinition,
  fallbackOwnerId: string,
): WorkflowSecuritySettings {
  return normalizeWorkflowSecurity(workflow.security, fallbackOwnerId);
}

export function resolveUserWorkflowRole(
  security: WorkflowSecuritySettings,
  userId: string | null | undefined,
): WorkflowPermissionRole | null {
  if (!userId) return null;
  if (security.ownerId === userId) return "owner";

  const grant = security.permissions.find((entry) => entry.userId === userId);
  return grant?.role ?? null;
}

export function canAccessWorkflow(
  security: WorkflowSecuritySettings,
  userId: string | null | undefined,
  action: WorkflowAccessAction,
): boolean {
  if (WORKFLOW_SECURITY_GUARDS_DISABLED) {
    return action !== "manage_security";
  }

  const role = resolveUserWorkflowRole(security, userId);

  if (action === "manage_security") {
    return role === "owner";
  }

  if (role === "owner") return true;

  if (role === "editor") {
    return action === "view" || action === "edit" || action === "execute" || action === "approve";
  }

  if (role === "viewer") {
    return action === "view" || action === "approve";
  }

  if (!userId) return false;

  if (security.visibility === "company" && action === "view") {
    return true;
  }

  if (security.visibility === "shared") {
    return action === "view";
  }

  return false;
}

export function canApproveAtLevel(
  security: WorkflowSecuritySettings,
  userId: string | null | undefined,
  level: number,
): boolean {
  if (!canAccessWorkflow(security, userId, "approve")) return false;

  const hierarchy = security.approvalHierarchy ?? [];
  const levelConfig = hierarchy.find((entry) => entry.level === level);
  if (!levelConfig?.requiredRole) return true;

  const role = resolveUserWorkflowRole(security, userId);
  if (!role) {
    return security.visibility === "company" && levelConfig.requiredRole === "viewer";
  }

  const requiredRank =
    ROLE_RANK[
      levelConfig.requiredRole === "manager" ||
      levelConfig.requiredRole === "director"
        ? "editor"
        : levelConfig.requiredRole === "admin"
          ? "owner"
          : (levelConfig.requiredRole as WorkflowPermissionRole)
    ] ?? 1;

  return ROLE_RANK[role] >= requiredRank;
}

export function attachSecurityToWorkflow(
  workflow: WorkflowDefinition,
  ownerId: string,
): WorkflowDefinition {
  return {
    ...workflow,
    security: normalizeWorkflowSecurity(workflow.security, ownerId),
  };
}