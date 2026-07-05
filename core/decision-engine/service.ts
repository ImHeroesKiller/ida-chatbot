/**
 * Decision Engine Service
 * 
 * Orchestrates creation, retrieval, approval, and execution of decisions.
 * Implements the Decision-centric and Governance-mandatory principles.
 */

import {
  Decision,
  DecisionId,
  DecisionStatus,
  DecisionPriority,
  CreateDecisionInput,
  UpdateDecisionInput,
  DecisionQuery,
  AIAnalysisResult,
  ActionPlan,
} from './types';
import { DecisionRepository } from './repository';

/**
 * Decision Engine Service - Core service for decision management
 * 
 * Principles:
 * - DECISION-CENTRIC: Every method operates on a complete Decision with context
 * - GOVERNANCE-MANDATORY: All decisions include audit metadata
 * - HUMAN-AMPLIFICATION: Service facilitates but doesn't override human judgment
 * - EXECUTION-FIRST: Decisions are structured for immediate execution
 */
export class DecisionEngineService {
  private repository: DecisionRepository;

  constructor(repository: DecisionRepository) {
    this.repository = repository;
  }

  /**
   * Create a new decision in DRAFT status
   * DECISION-CENTRIC: Creates a complete, traceable decision object
   */
  async createDecision(
    input: CreateDecisionInput<Record<string, unknown>>,
    userId: string,
    aiAnalysis: AIAnalysisResult,
    actionPlan: ActionPlan
  ): Promise<Decision> {
    const decisionId = this.generateDecisionId();

    const decision: Decision = {
      id: decisionId,
      title: input.title,
      description: input.description,
      contextData: input.contextData,
      aiAnalysis,
      actionPlan,
      metadata: {
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        contextType: input.contextType,
        priority: input.priority || DecisionPriority.MEDIUM,
        status: DecisionStatus.DRAFT,
        requiredApprovers: input.requiredApprovers,
        approvals: [],
        tags: input.tags,
        externalId: input.externalId,
      },
    };

    await this.repository.save(decision);
    return decision;
  }

  /**
   * Retrieve a decision by ID
   */
  async getDecision(id: DecisionId): Promise<Decision | null> {
    return this.repository.findById(id);
  }

  /**
   * Query decisions with filtering
   */
  async queryDecisions(query: DecisionQuery): Promise<{
    decisions: Decision[];
    total: number;
  }> {
    return this.repository.query(query);
  }

  /**
   * Update decision metadata and content
   */
  async updateDecision(
    id: DecisionId,
    input: UpdateDecisionInput
  ): Promise<Decision> {
    const decision = await this.repository.findById(id);
    if (!decision) {
      throw new Error(`Decision ${id} not found`);
    }

    if (decision.metadata.status !== DecisionStatus.DRAFT) {
      throw new Error(
        `Cannot update decision in ${decision.metadata.status} status`
      );
    }

    // Apply updates
    if (input.title) decision.title = input.title;
    if (input.description) decision.description = input.description;
    if (input.priority) decision.metadata.priority = input.priority;
    if (input.tags) decision.metadata.tags = input.tags;
    if (input.humanNotes !== undefined) decision.humanNotes = input.humanNotes;
    if (input.overrideAIRecommendation !== undefined) {
      decision.overrideAIRecommendation = input.overrideAIRecommendation;
    }
    if (input.overrideReason) decision.overrideReason = input.overrideReason;

    decision.metadata.updatedAt = new Date();

    await this.repository.save(decision);
    return decision;
  }

  /**
   * Submit decision for approval
   * Transitions from DRAFT to PENDING_APPROVAL
   */
  async submitForApproval(id: DecisionId): Promise<Decision> {
    const decision = await this.repository.findById(id);
    if (!decision) {
      throw new Error(`Decision ${id} not found`);
    }

    if (decision.metadata.status !== DecisionStatus.DRAFT) {
      throw new Error(
        `Cannot submit decision in ${decision.metadata.status} status for approval`
      );
    }

    decision.metadata.status = DecisionStatus.PENDING_APPROVAL;
    decision.metadata.updatedAt = new Date();

    await this.repository.save(decision);
    return decision;
  }

  /**
   * Record an approval from a governance actor
   * GOVERNANCE-MANDATORY: Tracks every approval decision
   */
  async recordApproval(
    id: DecisionId,
    actorId: string,
    actorName: string,
    actorRole: string,
    approved: boolean,
    comment?: string
  ): Promise<Decision> {
    const decision = await this.repository.findById(id);
    if (!decision) {
      throw new Error(`Decision ${id} not found`);
    }

    if (decision.metadata.status !== DecisionStatus.PENDING_APPROVAL) {
      throw new Error(
        `Cannot record approval for decision in ${decision.metadata.status} status`
      );
    }

    const approvalRecord = {
      actorId,
      actorName,
      actorRole,
      approved,
      timestamp: new Date(),
      comment,
      overriddenPriorDecision: false,
    };

    decision.metadata.approvals.push(approvalRecord);

    // Check if all required approvals have been collected
    const allRequiredApproved = this.checkAllRequiredApprovalsComplete(
      decision
    );

    if (approved && allRequiredApproved) {
      decision.metadata.status = DecisionStatus.APPROVED;
    } else if (!approved) {
      decision.metadata.status = DecisionStatus.REJECTED;
      decision.metadata.rejectionReason = comment || 'Approval denied';
    }

    decision.metadata.updatedAt = new Date();
    await this.repository.save(decision);
    return decision;
  }

  /**
   * Check if all required approvers have approved
   */
  private checkAllRequiredApprovalsComplete(decision: Decision): boolean {
    const requiredApprovers = decision.metadata.requiredApprovers.filter(
      (a) => a.requiredForApproval
    );

    if (requiredApprovers.length === 0) {
      return true; // No required approvers
    }

    return requiredApprovers.every((requiredActor) =>
      decision.metadata.approvals.some(
        (approval) =>
          approval.actorId === requiredActor.id && approval.approved
      )
    );
  }

  /**
   * Mark decision as ready for execution
   * Transitions from APPROVED to IN_EXECUTION
   */
  async markForExecution(id: DecisionId): Promise<Decision> {
    const decision = await this.repository.findById(id);
    if (!decision) {
      throw new Error(`Decision ${id} not found`);
    }

    if (decision.metadata.status !== DecisionStatus.APPROVED) {
      throw new Error(
        `Cannot execute decision in ${decision.metadata.status} status. Must be APPROVED.`
      );
    }

    decision.metadata.status = DecisionStatus.IN_EXECUTION;
    decision.metadata.executionStartedAt = new Date();
    decision.metadata.updatedAt = new Date();

    await this.repository.save(decision);
    return decision;
  }

  /**
   * Mark decision execution as complete
   */
  async markExecutionComplete(id: DecisionId): Promise<Decision> {
    const decision = await this.repository.findById(id);
    if (!decision) {
      throw new Error(`Decision ${id} not found`);
    }

    if (decision.metadata.status !== DecisionStatus.IN_EXECUTION) {
      throw new Error(
        `Cannot complete execution for decision in ${decision.metadata.status} status`
      );
    }

    decision.metadata.status = DecisionStatus.COMPLETED;
    decision.metadata.executionCompletedAt = new Date();
    decision.metadata.updatedAt = new Date();

    await this.repository.save(decision);
    return decision;
  }

  /**
   * Record execution error
   */
  async recordExecutionError(
    id: DecisionId,
    error: string
  ): Promise<Decision> {
    const decision = await this.repository.findById(id);
    if (!decision) {
      throw new Error(`Decision ${id} not found`);
    }

    decision.metadata.status = DecisionStatus.FAILED;
    decision.metadata.executionError = error;
    decision.metadata.executionCompletedAt = new Date();
    decision.metadata.updatedAt = new Date();

    await this.repository.save(decision);
    return decision;
  }

  /**
   * Reject a decision in PENDING_APPROVAL status
   */
  async rejectDecision(
    id: DecisionId,
    reason: string
  ): Promise<Decision> {
    const decision = await this.repository.findById(id);
    if (!decision) {
      throw new Error(`Decision ${id} not found`);
    }

    if (decision.metadata.status !== DecisionStatus.PENDING_APPROVAL) {
      throw new Error(
        `Cannot reject decision in ${decision.metadata.status} status`
      );
    }

    decision.metadata.status = DecisionStatus.REJECTED;
    decision.metadata.rejectionReason = reason;
    decision.metadata.updatedAt = new Date();

    await this.repository.save(decision);
    return decision;
  }

  /**
   * Revoke an approved decision (before execution)
   */
  async revokeDecision(
    id: DecisionId,
    reason: string
  ): Promise<Decision> {
    const decision = await this.repository.findById(id);
    if (!decision) {
      throw new Error(`Decision ${id} not found`);
    }

    if (!
      [DecisionStatus.APPROVED, DecisionStatus.IN_EXECUTION].includes(
        decision.metadata.status
      )
    ) {
      throw new Error(
        `Cannot revoke decision in ${decision.metadata.status} status. Must be APPROVED or IN_EXECUTION.`
      );
    }

    decision.metadata.status = DecisionStatus.REVOKED;
    decision.metadata.revocationReason = reason;
    decision.metadata.updatedAt = new Date();

    await this.repository.save(decision);
    return decision;
  }

  /**
   * Generate unique decision ID using native crypto (no extra dependency)
   */
  private generateDecisionId(): DecisionId {
    return (`dec_${crypto.randomUUID()}` as unknown) as DecisionId;
  }
}
