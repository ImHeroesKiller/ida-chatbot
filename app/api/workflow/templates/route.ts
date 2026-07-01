import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createUserWorkflowTemplate,
  listUserWorkflowTemplates,
  requireAuthenticatedUser,
} from "@/lib/workflow-templates-server";

const saveSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  category: z.string().trim().max(40).optional(),
  definition: z.object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).optional(),
    nodes: z.array(z.record(z.string(), z.unknown())).min(1),
    edges: z.array(z.record(z.string(), z.unknown())).default([]),
  }),
});

export async function GET() {
  const user = await requireAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const templates = await listUserWorkflowTemplates(user.id);
  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid workflow template payload." },
      { status: 400 },
    );
  }

  const template = await createUserWorkflowTemplate({
    userId: user.id,
    name: parsed.data.name,
    description: parsed.data.description,
    category: (parsed.data.category as "custom" | undefined) ?? "custom",
    definition: {
      name: parsed.data.definition.name,
      description: parsed.data.definition.description,
      nodes: parsed.data.definition.nodes as never,
      edges: parsed.data.definition.edges as never,
    },
  });

  if (!template) {
    return NextResponse.json(
      { error: "Failed to save workflow template." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, template });
}