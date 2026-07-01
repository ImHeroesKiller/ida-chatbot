import { z } from "zod";

import { LOCALES } from "@/lib/config";

export const workflowNodeSchema = z.object({
  id: z.string().min(1),
  type: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.object({
    label: z.string().min(1),
    kind: z.enum(["trigger", "action", "condition", "output", "approval"]),
    description: z.string().optional(),
    prompt: z.string().optional(),
    config: z.record(z.string(), z.unknown()).optional(),
  }),
});

export const workflowDefinitionSchema = z.object({
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

export const workflowCheckpointSchema = z.object({
  workflowId: z.string().min(1),
  locale: z.enum(LOCALES),
  startedAt: z.number(),
  context: z.string(),
  logs: z.array(
    z.object({
      nodeId: z.string(),
      label: z.string(),
      kind: z.enum(["trigger", "action", "condition", "output", "approval"]),
      status: z.enum([
        "skipped",
        "running",
        "completed",
        "failed",
        "paused",
        "awaiting_approval",
      ]),
      actionId: z.string().optional(),
      output: z.string().optional(),
      message: z.string().optional(),
      startedAt: z.number(),
      completedAt: z.number().optional(),
    }),
  ),
  nextNodeIndex: z.number().int().min(0),
  orderedNodeIds: z.array(z.string()),
  pauseReason: z.enum(["approval", "recovery", "scheduled"]),
  pendingNodeId: z.string(),
  pendingNodeLabel: z.string(),
  pendingNodeKind: z.enum(["trigger", "action", "condition", "output", "approval"]),
  retryCount: z.number().optional(),
  maxRetries: z.number().optional(),
  errorMessage: z.string().optional(),
  errorSuggestion: z.string().optional(),
  approvalPrompt: z.string().optional(),
  scheduledRunAt: z.number().optional(),
});