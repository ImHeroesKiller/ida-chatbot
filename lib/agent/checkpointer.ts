import type { AgentWorkflowRun } from "./types";

/**
 * Checkpointer interface — prototype uses in-memory store.
 * Production target: Redis + LangGraph Checkpointer per spec §3.5.
 */
export interface AgentCheckpointer {
  get(threadId: string): Promise<AgentWorkflowRun | null>;
  put(threadId: string, run: AgentWorkflowRun): Promise<void>;
  delete(threadId: string): Promise<void>;
}

const memoryStore = new Map<string, AgentWorkflowRun>();

export class MemoryAgentCheckpointer implements AgentCheckpointer {
  async get(threadId: string): Promise<AgentWorkflowRun | null> {
    return memoryStore.get(threadId) ?? null;
  }

  async put(threadId: string, run: AgentWorkflowRun): Promise<void> {
    memoryStore.set(threadId, run);
  }

  async delete(threadId: string): Promise<void> {
    memoryStore.delete(threadId);
  }
}

let checkpointerInstance: AgentCheckpointer | null = null;

export function getAgentCheckpointer(): AgentCheckpointer {
  if (!checkpointerInstance) {
    checkpointerInstance = new MemoryAgentCheckpointer();
  }
  return checkpointerInstance;
}

export async function persistRunState(run: AgentWorkflowRun): Promise<void> {
  const checkpointer = getAgentCheckpointer();
  await checkpointer.put(run.id, run);
}