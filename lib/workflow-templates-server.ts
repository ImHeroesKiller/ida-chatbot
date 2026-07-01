import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";
import type { WorkflowEdge, WorkflowNode } from "@/lib/workflow";
import type { WorkflowTemplateCategory } from "@/lib/workflow-templates";

export interface UserWorkflowTemplateRecord {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: WorkflowTemplateCategory;
  definition: {
    name: string;
    description?: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string | null;
  definition: {
    name?: string;
    description?: string;
    nodes?: WorkflowNode[];
    edges?: WorkflowEdge[];
  } | null;
  created_at: string;
  updated_at: string;
}): UserWorkflowTemplateRecord {
  const definition = row.definition ?? {};
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? undefined,
    category: (row.category as WorkflowTemplateCategory) ?? "custom",
    definition: {
      name: definition.name ?? row.name,
      description: definition.description ?? row.description ?? undefined,
      nodes: definition.nodes ?? [],
      edges: definition.edges ?? [],
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listUserWorkflowTemplates(
  userId: string,
): Promise<UserWorkflowTemplateRecord[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ida_workflow_templates")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[IDA workflow-templates list]", error);
    return [];
  }

  return (data ?? []).map((row) =>
    mapRow(row as Parameters<typeof mapRow>[0]),
  );
}

export async function createUserWorkflowTemplate(input: {
  userId: string;
  name: string;
  description?: string;
  category?: WorkflowTemplateCategory;
  definition: {
    name: string;
    description?: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
}): Promise<UserWorkflowTemplateRecord | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("ida_workflow_templates")
    .insert({
      user_id: input.userId,
      name: input.name,
      description: input.description ?? null,
      category: input.category ?? "custom",
      definition: input.definition,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[IDA workflow-templates create]", error);
    return null;
  }

  return mapRow(data as Parameters<typeof mapRow>[0]);
}

export async function deleteUserWorkflowTemplate(
  userId: string,
  templateId: string,
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("ida_workflow_templates")
    .delete()
    .eq("id", templateId)
    .eq("user_id", userId);

  if (error) {
    console.error("[IDA workflow-templates delete]", error);
    return false;
  }

  return true;
}

export async function requireAuthenticatedUser() {
  const user = await getSessionUser();
  if (!user) return null;
  return user;
}