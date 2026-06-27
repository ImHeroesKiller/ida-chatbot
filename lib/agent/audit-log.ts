import { randomUUID } from "crypto";

import type { AgentAuditLogEntry, AgentGraphNodeId } from "./types";

export function createCorrelationId(): string {
  return `corr-${Date.now()}-${randomUUID().slice(0, 8)}`;
}

export function appendAuditLog(
  logs: AgentAuditLogEntry[],
  entry: Omit<AgentAuditLogEntry, "id" | "timestamp">,
): AgentAuditLogEntry[] {
  const record: AgentAuditLogEntry = {
    ...entry,
    id: `audit-${randomUUID().slice(0, 8)}`,
    timestamp: Date.now(),
  };

  const next = [...logs, record];

  console.log(
    JSON.stringify({
      level: "info",
      service: "agentflow",
      event: "audit",
      ...record,
    }),
  );

  return next.slice(-100);
}

export function logNodeTransition(options: {
  logs: AgentAuditLogEntry[];
  correlationId: string;
  node: AgentGraphNodeId;
  action: string;
  actor: AgentAuditLogEntry["actor"];
  details?: Record<string, string | number | boolean>;
}): AgentAuditLogEntry[] {
  return appendAuditLog(options.logs, {
    correlationId: options.correlationId,
    node: options.node,
    action: options.action,
    actor: options.actor,
    details: options.details ?? {},
  });
}