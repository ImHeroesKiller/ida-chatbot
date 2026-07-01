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

const workflowSecuritySchema = z
  .object({
    visibility: z.enum(["private", "shared", "company"]).optional(),
    ownerId: z.string().optional(),
    permissions: z
      .array(
        z.object({
          userId: z.string().min(1),
          role: z.enum(["owner", "editor", "viewer"]),
          grantedAt: z.number().optional(),
        }),
      )
      .optional(),
    approvalHierarchy: z
      .array(
        z.object({
          level: z.number().int().min(1),
          label: z.string().min(1),
          requiredRole: z
            .enum(["owner", "editor", "viewer", "manager", "director", "admin"])
            .optional(),
        }),
      )
      .optional(),
  })
  .optional();

export const workflowDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  security: workflowSecuritySchema,
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
  approvalState: z
    .object({
      nodeId: z.string(),
      totalLevels: z.number().int().min(1),
      currentLevel: z.number().int().min(1),
      completedLevels: z.array(z.number().int()),
      history: z.array(
        z.object({
          level: z.number().int(),
          action: z.enum(["approve", "reject"]),
          actorId: z.string().optional(),
          note: z.string().optional(),
          at: z.number(),
        }),
      ),
    })
    .optional(),
  approvalLevelLabel: z.string().optional(),
});