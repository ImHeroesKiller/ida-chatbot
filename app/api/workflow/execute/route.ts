import { NextResponse } from "next/server";
import { z } from "zod";

import { LOCALES } from "@/lib/config";
import {
  buildRateLimitKey,
  enforceIdaRateLimit,
  getClientIp,
  IdaRateLimitError,
} from "@/lib/rate-limit";
import { executeChatWorkflow } from "@/lib/workflow-executor";
import type { WorkflowDefinition } from "@/lib/workflow";

const workflowNodeSchema = z.object({
  id: z.string().min(1),
  type: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.object({
    label: z.string().min(1),
    kind: z.enum(["trigger", "action", "condition", "output"]),
    description: z.string().optional(),
    config: z.record(z.string(), z.unknown()).optional(),
  }),
});

const workflowDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  nodes: z.array(workflowNodeSchema).min(1).max(50),
  edges: z
    .array(
      z.object({
        id: z.string().min(1),
        source: z.string().min(1),
        target: z.string().min(1),
      }),
    )
    .max(100),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const executeRequestSchema = z.object({
  workflow: workflowDefinitionSchema,
  locale: z.enum(LOCALES),
  sessionId: z.string().min(8).max(64).optional(),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = executeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid workflow payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    await enforceIdaRateLimit(
      buildRateLimitKey({
        ip: getClientIp(request),
        sessionId: parsed.data.sessionId,
      }),
    );
  } catch (error) {
    if (error instanceof IdaRateLimitError) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(error.retryAfterSec) },
        },
      );
    }
    throw error;
  }

  try {
    const workflow = parsed.data.workflow as WorkflowDefinition;

    console.info("[workflow:execute] request", {
      workflowId: workflow.id,
      name: workflow.name,
      nodeCount: workflow.nodes.length,
      edgeCount: workflow.edges.length,
      locale: parsed.data.locale,
      sessionId: parsed.data.sessionId ?? null,
    });

    const result = await executeChatWorkflow({
      workflow,
      locale: parsed.data.locale,
      sessionId: parsed.data.sessionId,
    });

    console.info("[workflow:execute] completed", {
      workflowId: result.workflowId,
      status: result.status,
      logCount: result.logs?.length ?? 0,
    });

    return NextResponse.json({ result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Workflow execution failed.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}