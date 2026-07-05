/**
 * Agent Registry - Central registry of all workforce agents
 * 
 * Manages agent metadata, capabilities, and lifecycle.
 * Aligned with HUMAN-AMPLIFICATION: agents augment human decision-making.
 */

import { generateAgentId, generateTaskId } from '../shared/id';

/**
 * Agent Role - specialized roles in the digital workforce
 */
export enum AgentRole {
  RESEARCHER = 'researcher',
  DOCUMENT_SPECIALIST = 'document_specialist',
  APPROVAL_COORDINATOR = 'approval_coordinator',
}

/**
 * Agent Capability - what an agent can do
 */
export interface AgentCapability {
  name: string;
  description: string;
  toolsUsed: string[]; // e.g., ['research', 'worksheet', 'workflow']
  estimatedDurationMinutes: number;
}

/**
 * Agent Metadata - identifies and describes an agent
 */
export interface AgentMetadata {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
  version: string;
  capabilities: AgentCapability[];
  maxConcurrentTasks: number;
  requiresHumanOversight: boolean; // True if human review required
  isActive: boolean;
  createdAt: Date;
}

/**
 * Agent Task - represents work assigned to an agent
 */
export interface AgentTask {
  taskId: string;
  agentId: string;
  decisionId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Agent Registry - manages all agents in the digital workforce
 */
export class AgentRegistry {
  private agents: Map<string, AgentMetadata> = new Map();
  private tasks: Map<string, AgentTask> = new Map();

  /**
   * Register a new agent
   */
  registerAgent(metadata: Omit<AgentMetadata, 'id' | 'createdAt'>): AgentMetadata {
    const agent: AgentMetadata = {
      ...metadata,
      id: generateAgentId(),
      createdAt: new Date(),
    };
    this.agents.set(agent.id, agent);
    return agent;
  }

  /**
   * Get agent by ID
   */
  getAgent(id: string): AgentMetadata | undefined {
    return this.agents.get(id);
  }

  /**
   * Get all agents
   */
  getAllAgents(): AgentMetadata[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by role
   */
  getAgentsByRole(role: AgentRole): AgentMetadata[] {
    return Array.from(this.agents.values()).filter((a) => a.role === role);
  }

  /**
   * Create a task for an agent
   */
  createTask(
    agentId: string,
    decisionId: string,
    input: Record<string, unknown>
  ): AgentTask {
    const agent = this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const task: AgentTask = {
      taskId: generateTaskId(),
      agentId,
      decisionId,
      status: 'pending',
      input,
      createdAt: new Date(),
    };

    this.tasks.set(task.taskId, task);
    return task;
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): AgentTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Update task status and output
   */
  updateTask(
    taskId: string,
    updates: Partial<Omit<AgentTask, 'taskId'>>
  ): AgentTask {
    const task = this.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    Object.assign(task, updates);
    return task;
  }

  /**
   * Get tasks for a decision
   */
  getDecisionTasks(decisionId: string): AgentTask[] {
    return Array.from(this.tasks.values()).filter(
      (t) => t.decisionId === decisionId
    );
  }
}
