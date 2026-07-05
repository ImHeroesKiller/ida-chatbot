// Capability Contracts - Architecture Blueprint Part 2

import { Context } from '../Context';
import { Actor } from '../Actor';
import { EnterpriseMemory } from '../EnterpriseMemory';
import { MemoryQuery } from '../EnterpriseMemory.types';

// Temporary placeholder until ActionLog is properly defined
export interface ActionLog {
  id: string;
  workItemId: string;
  actorId: string;
  action: string;
  reasoning: string;
  timestamp: string;
}

export interface OutcomeContinuity {
  maintainOutcome(initiativeId: string, newOutcome: string): Promise<void>;
  getCurrentOutcome(initiativeId: string): Promise<string | null>;
}

export interface ContextContinuity {
  getCurrentContext(workItemId: string): Promise<Context>;
  preserveContextDuringTransition(fromWorkItemId: string, toWorkItemId: string): Promise<void>;
}

export interface ResponsibilityContinuity {
  assignResponsibility(workItemId: string, actorId: string): Promise<void>;
  transferResponsibility(workItemId: string, fromActorId: string, toActorId: string): Promise<void>;
  getResponsibleActor(workItemId: string): Promise<Actor | null>;
}

export interface TrustPreservation {
  recordAction(workItemId: string, actorId: string, action: string, reasoning: string): Promise<void>;
  getActionHistory(workItemId: string): Promise<ActionLog[]>;
}

export interface OrganizationalMemoryGrowth {
  storeMemory(content: string, context: string, sourceWorkItemId?: string): Promise<string>;
  retrieveRelevantMemory(query: MemoryQuery): Promise<EnterpriseMemory[]>;
}

export interface LearningEvolution {
  recordOutcomeAndLearning(workItemId: string, outcome: string, learning: string): Promise<void>;
  getOrganizationalCapabilityGrowth(): Promise<CapabilityGrowth[]>;
}

export interface AdaptiveCoordination {
  adjustCoordination(workItemId: string, newActorIds: string[]): Promise<void>;
}

export interface AlignmentPreservation {
  checkAlignment(initiativeId: string): Promise<AlignmentStatus>;
  realignWorkItems(initiativeId: string): Promise<void>;
}
