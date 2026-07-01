import { NextResponse } from "next/server";
import { z } from "zod";

import { LOCALES } from "@/lib/config";
import {
  buildRateLimitKey,
  enforceIdaRateLimit,
  getClientIp,
  IdaRateLimitError,
} from "@/lib/rate-limit";
import { executeChatWorkflowStream } from "@/lib/workflow-executor";
import {
  createWorkflowExecuteSseStream,
  workflowExecuteSseResponse,
} from "@/lib/workflow-sse";
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
  activeWorkflowId: z.string().min(1).optional(),
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

  const workflow = parsed.data.workflow as WorkflowDefinition;

  console.info("[workflow:execute] request", {
    workflowId: workflow.id,
    name: workflow.name,
    nodeCount: workflow.nodes.length,
    edgeCount: workflow.edges.length,
    locale: parsed.data.locale,
    sessionId: parsed.data.sessionId ?? null,
    streaming: true,
  });

  const stream = createWorkflowExecuteSseStream(async (send) => {
    for await (const event of executeChatWorkflowStream({
      workflow,
      locale: parsed.data.locale,
      sessionId: parsed.data.sessionId,
      activeWorkflowId:
        parsed.data.activeWorkflowId ?? workflow.id,
    })) {
      if (event.type === "start") {
        send("start", {
          workflowId: event.workflowId,
          startedAt: event.startedAt,
          totalNodes: event.totalNodes,
        });
      } else if (event.type === "progress") {
        send("progress", {
          log: event.log,
          logs: event.logs,
        });
      } else if (event.type === "done") {
        console.info("[workflow:execute] completed", {
          workflowId: event.result.workflowId,
          status: event.result.status,
          logCount: event.result.logs?.length ?? 0,
        });
        send("done", { result: event.result });
      } else if (event.type === "error") {
        send("error", {
          error: event.message,
          result: event.result,
        });
      }
    }
  });

  return workflowExecuteSseResponse(stream);
}