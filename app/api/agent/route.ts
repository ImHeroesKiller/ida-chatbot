import { NextResponse } from "next/server";
import { z } from "zod";

import { handleAgentRequest } from "@/lib/agent/handler";
import type { AgentApiResponse } from "@/lib/agent/types";
import { getSessionUser } from "@/lib/auth/session";
import { LOCALES } from "@/lib/config";
import {
  buildRateLimitKey,
  enforceIdaRateLimit,
  getClientIp,
  IdaRateLimitError,
} from "@/lib/rate-limit";

const documentSchema = z.object({
  fileName: z.string().min(1).max(256),
  fileType: z.enum(["pdf", "docx", "xlsx"]),
  base64: z.string().min(1).max(15_000_000),
  sizeBytes: z.number().int().positive().max(10 * 1024 * 1024),
});

const templateSchema = z.object({
  fileName: z.string().min(1).max(256),
  fileType: z.enum(["docx", "pdf"]),
  base64: z.string().min(1).max(15_000_000),
  sizeBytes: z.number().int().positive().max(10 * 1024 * 1024),
});

const workflowStepSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  agent: z.string().max(64).optional(),
  toolCategory: z
    .enum(["document", "playwright", "placeholder", "custom"])
    .optional(),
  branchType: z.enum(["sequential", "parallel", "conditional"]).optional(),
  leadTimeType: z.enum(["none", "polling", "webhook", "recurring"]).optional(),
  estimatedDurationMinutes: z.number().optional(),
  requiresApproval: z.boolean(),
});

const agentRequestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("analyze"),
    locale: z.enum(LOCALES),
    instruction: z.string().min(3).max(8000),
    documents: z.array(documentSchema).max(10),
    runId: z.string().min(8).max(64).optional(),
    existingRun: z.never().optional(),
  }),
  z.object({
    action: z.literal("approve"),
    runId: z.string().min(8).max(64),
    existingRun: z.any(),
  }),
  z.object({
    action: z.literal("upload_templates"),
    runId: z.string().min(8).max(64),
    templates: z.array(templateSchema).min(1).max(5),
    existingRun: z.any(),
  }),
  z.object({
    action: z.literal("inject_templates"),
    runId: z.string().min(8).max(64),
    existingRun: z.any(),
  }),
  z.object({
    action: z.literal("execute"),
    runId: z.string().min(8).max(64),
    existingRun: z.any(),
  }),
  z.object({
    action: z.literal("cancel"),
    runId: z.string().min(8).max(64),
    existingRun: z.any(),
  }),
  z.object({
    action: z.literal("edit_workflow"),
    runId: z.string().min(8).max(64),
    steps: z.array(workflowStepSchema).min(1).max(20),
    mermaidDiagram: z.string().max(8000).optional(),
    existingRun: z.any(),
  }),
]);

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = agentRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid agent payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    await enforceIdaRateLimit(
      buildRateLimitKey({
        ip: getClientIp(request),
        sessionId: user.id,
      }),
    );
  } catch (error) {
    if (error instanceof IdaRateLimitError) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 },
      );
    }
    throw error;
  }

  const payload = parsed.data;
  const existingRun =
    "existingRun" in payload && payload.existingRun
      ? payload.existingRun
      : undefined;

  try {
    const request =
      payload.action === "edit_workflow"
        ? {
            ...payload,
            steps: payload.steps.map((step) => ({
              toolCategory: step.toolCategory ?? "custom",
              branchType: step.branchType ?? "sequential",
              leadTimeType: step.leadTimeType ?? "none",
              estimatedDurationMinutes: step.estimatedDurationMinutes ?? 5,
              ...step,
            })),
          }
        : payload;

    const run = await handleAgentRequest(request, existingRun, user.id);

    return NextResponse.json<AgentApiResponse>({
      run,
      message: "AgentFlow request processed.",
    });
  } catch (error) {
    console.error("[AgentFlow API]", error);
    const message =
      error instanceof Error ? error.message : "AgentFlow processing failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}