/**
 * Shared ID Generator
 * 
 * Centralized ID generation for the entire IDA platform.
 * Uses native crypto.randomUUID() to avoid external dependencies.
 */

export function generateId(prefix: string = ''): string {
  const uuid = crypto.randomUUID();
  return prefix ? `${prefix}_${uuid}` : uuid;
}

export function generateAgentId(): string {
  return generateId('agent');
}

export function generateTaskId(): string {
  return generateId('task');
}

export function generateDecisionId(): string {
  return generateId('dec');
}
