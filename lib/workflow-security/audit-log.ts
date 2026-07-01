import { randomUUID } from "crypto";

import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";

import type {
  WorkflowAuditAction,
  WorkflowAuditActorType,
  WorkflowAuditEntry,
} from "./types";

export interface RecordWorkflowAuditInput {
  workflowId?: string | null;
  workflowName?: string | null;
  userId?: string | null;
  sessionId?: string | null;
  action: WorkflowAuditAction;
  actorType?: WorkflowAuditActorType;
  details?: Record<string, unknown>;
}

export async function recordWorkflowAudit(
  input: RecordWorkflowAuditInput,
): Promise<WorkflowAuditEntry | null> {
  const entry: WorkflowAuditEntry = {
    id: randomUUID(),
    workflowId: input.workflowId ?? null,
    workflowName: input.workflowName ?? null,
    userId: input.userId ?? null,
    sessionId: input.sessionId ?? null,
    action: input.action,
    actorType: input.actorType ?? "user",
    details: input.details ?? {},
    createdAt: new Date().toISOString(),
  };

  console.info(
    JSON.stringify({
      level: "info",
      service: "ida-workflow",
      event: "audit",
      action: entry.action,
      workflowId: entry.workflowId,
      userId: entry.userId,
      details: entry.details,
    }),
  );

  if (!isSupabaseConfigured()) return entry;

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("ida_workflow_audit_logs").insert({
      id: entry.id,
      workflow_id: entry.workflowId,
      workflow_name: entry.workflowName,
      user_id: entry.userId,
      session_id: entry.sessionId,
      action: entry.action,
      actor_type: entry.actorType,
      details: entry.details,
      created_at: entry.createdAt,
    });

    if (error) {
      console.error("[IDA workflow-audit insert]", error);
    }
  } catch (error) {
    console.error("[IDA workflow-audit]", error);
  }

  return entry;
}

export async function listWorkflowAuditLogs(options?: {
  workflowId?: string;
  limit?: number;
}): Promise<WorkflowAuditEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const limit = options?.limit ?? 100;

  try {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("ida_workflow_audit_logs")
      .select(
        "id, workflow_id, workflow_name, user_id, session_id, action, actor_type, details, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (options?.workflowId) {
      query = query.eq("workflow_id", options.workflowId);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id as string,
      workflowId: (row.workflow_id as string | null) ?? null,
      workflowName: (row.workflow_name as string | null) ?? null,
      userId: (row.user_id as string | null) ?? null,
      sessionId: (row.session_id as string | null) ?? null,
      action: row.action as WorkflowAuditAction,
      actorType: row.actor_type as WorkflowAuditActorType,
      details: (row.details as Record<string, unknown>) ?? {},
      createdAt: row.created_at as string,
    }));
  } catch (error) {
    console.error("[IDA workflow-audit list]", error);
    return [];
  }
}

export async function syncWorkflowAcl(options: {
  workflowId: string;
  ownerUserId: string;
  visibility: string;
  sessionId?: string;
  permissions: Array<{ userId: string; role: string; grantedBy?: string }>;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    await supabase.from("ida_workflow_acl").upsert(
      {
        workflow_id: options.workflowId,
        owner_user_id: options.ownerUserId,
        visibility: options.visibility,
        session_id: options.sessionId ?? null,
        updated_at: now,
      },
      { onConflict: "workflow_id" },
    );

    await supabase
      .from("ida_workflow_permissions")
      .delete()
      .eq("workflow_id", options.workflowId);

    if (options.permissions.length > 0) {
      await supabase.from("ida_workflow_permissions").insert(
        options.permissions.map((grant) => ({
          workflow_id: options.workflowId,
          user_id: grant.userId,
          role: grant.role,
          granted_by: grant.grantedBy ?? options.ownerUserId,
        })),
      );
    }
  } catch (error) {
    console.error("[IDA workflow-acl sync]", error);
  }
}