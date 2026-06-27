import type { AgentWorkflowRun } from "./types";

/**
 * Checkpointer interface — Memory (dev) or Redis/Upstash (prod).
 * Production target: LangGraph Redis checkpointer per spec §3.5.
 */
export interface AgentCheckpointer {
  get(threadId: string): Promise<AgentWorkflowRun | null>;
  put(threadId: string, run: AgentWorkflowRun): Promise<void>;
  delete(threadId: string): Promise<void>;
}

const memoryStore = new Map<string, AgentWorkflowRun>();
const REDIS_KEY_PREFIX = "ida:agentflow:run:";
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

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

class UpstashRedisCheckpointer implements AgentCheckpointer {
  private restUrl: string;
  private token: string;

  constructor(restUrl: string, token: string) {
    this.restUrl = restUrl.replace(/\/$/, "");
    this.token = token;
  }

  private async command(
    command: (string | number)[],
  ): Promise<unknown> {
    const response = await fetch(`${this.restUrl}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      throw new Error(`Redis command failed: ${response.status}`);
    }

    const data = (await response.json()) as { result?: unknown };
    return data.result;
  }

  async get(threadId: string): Promise<AgentWorkflowRun | null> {
    const result = await this.command(["GET", `${REDIS_KEY_PREFIX}${threadId}`]);
    if (!result || typeof result !== "string") return null;
    return JSON.parse(result) as AgentWorkflowRun;
  }

  async put(threadId: string, run: AgentWorkflowRun): Promise<void> {
    const key = `${REDIS_KEY_PREFIX}${threadId}`;
    await this.command(["SET", key, JSON.stringify(run), "EX", TTL_SECONDS]);
  }

  async delete(threadId: string): Promise<void> {
    await this.command(["DEL", `${REDIS_KEY_PREFIX}${threadId}`]);
  }
}

let checkpointerInstance: AgentCheckpointer | null = null;

export function isRedisCheckpointerConfigured(): boolean {
  return Boolean(
    (process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim()) ||
      process.env.REDIS_URL?.trim(),
  );
}

export function getAgentCheckpointer(): AgentCheckpointer {
  if (checkpointerInstance) return checkpointerInstance;

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (upstashUrl && upstashToken) {
    checkpointerInstance = new UpstashRedisCheckpointer(upstashUrl, upstashToken);
    return checkpointerInstance;
  }

  checkpointerInstance = new MemoryAgentCheckpointer();
  return checkpointerInstance;
}

export async function persistRunState(run: AgentWorkflowRun): Promise<void> {
  const checkpointer = getAgentCheckpointer();
  await checkpointer.put(run.id, run);
}

export async function loadRunState(
  runId: string,
): Promise<AgentWorkflowRun | null> {
  const checkpointer = getAgentCheckpointer();
  return checkpointer.get(runId);
}