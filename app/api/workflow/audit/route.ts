import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import {
  canAccessWorkflow,
  getWorkflowSecurity,
  listWorkflowAuditLogs,
} from "@/lib/workflow-security";

export async function GET(request: Request) {
  const user = await getSessionUser();
  const { searchParams } = new URL(request.url);
  const workflowId = searchParams.get("workflowId");
  const ownerId = searchParams.get("ownerId") ?? user?.id ?? "anonymous";
  const visibility = searchParams.get("visibility") as
    | "private"
    | "shared"
    | "company"
    | null;

  if (!workflowId) {
    return NextResponse.json(
      { error: "workflowId query parameter is required." },
      { status: 400 },
    );
  }

  const security = getWorkflowSecurity(
    {
      id: workflowId,
      name: "",
      nodes: [],
      edges: [],
      createdAt: 0,
      updatedAt: 0,
      security: {
        visibility: visibility ?? "private",
        ownerId,
        permissions: [],
      },
    },
    ownerId,
  );

  if (!canAccessWorkflow(security, user?.id ?? ownerId, "view")) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const logs = await listWorkflowAuditLogs({ workflowId, limit: 50 });
  return NextResponse.json({ logs });
}