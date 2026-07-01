import { NextResponse } from "next/server";

import {
  deleteUserWorkflowTemplate,
  requireAuthenticatedUser,
} from "@/lib/workflow-templates-server";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await deleteUserWorkflowTemplate(user.id, id);

  if (!deleted) {
    return NextResponse.json(
      { error: "Failed to delete workflow template." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}