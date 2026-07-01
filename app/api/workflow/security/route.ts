import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth/session";
import {
  canAccessWorkflow,
  getWorkflowSecurity,
  normalizeWorkflowSecurity,
  recordWorkflowAudit,
  syncWorkflowAcl,
  type WorkflowPermissionGrant,
  type WorkflowVisibility,
} from "@/lib/workflow-security";
import { workflowDefinitionSchema } from "@/lib/workflow-api-schema";
import type { WorkflowDefinition } from "@/lib/workflow";

const updateSecuritySchema = z.object({
  workflow: workflowDefinitionSchema,
  sessionId: z.string().min(8).max(64).optional(),
  visibility: z.enum(["private", "shared", "company"]).optional(),
  permissions: z
    .array(
      z.object({
        userId: z.string().min(1),
        role: z.enum(["owner", "editor", "viewer"]),
      }),
    )
    .optional(),
});

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  const actorId = user?.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = updateSecuritySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid security payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const workflow = parsed.data.workflow as WorkflowDefinition;
  const ownerId =
    workflow.security?.ownerId ?? actorId ?? parsed.data.sessionId ?? "anonymous";
  const security = getWorkflowSecurity(workflow, ownerId);

  if (!canAccessWorkflow(security, actorId ?? ownerId, "manage_security")) {
    return NextResponse.json(
      { error: "Only the workflow owner can update security settings." },
      { status: 403 },
    );
  }

  const nextSecurity = normalizeWorkflowSecurity(
    {
      ...security,
      visibility:
        (parsed.data.visibility as WorkflowVisibility | undefined) ??
        security.visibility,
      permissions:
        (parsed.data.permissions as WorkflowPermissionGrant[] | undefined) ??
        security.permissions,
    },
    ownerId,
  );

  const updatedWorkflow: WorkflowDefinition = {
    ...workflow,
    security: nextSecurity,
    updatedAt: Date.now(),
  };

  await syncWorkflowAcl({
    workflowId: workflow.id,
    ownerUserId: ownerId,
    visibility: nextSecurity.visibility,
    sessionId: parsed.data.sessionId,
    permissions: nextSecurity.permissions.map((grant) => ({
      userId: grant.userId,
      role: grant.role,
      grantedBy: actorId ?? ownerId,
    })),
  });

  void recordWorkflowAudit({
    workflowId: workflow.id,
    workflowName: workflow.name,
    userId: actorId ?? ownerId,
    sessionId: parsed.data.sessionId,
    action: "workflow.security_updated",
    details: {
      visibility: nextSecurity.visibility,
      permissionCount: nextSecurity.permissions.length,
    },
  });

  return NextResponse.json({ ok: true, workflow: updatedWorkflow });
}