/**
 * Supabase Decision Repository Implementation
 * 
 * Persists decisions to Supabase PostgreSQL with JSONB support.
 * Implements full CRUD, querying, and audit logging.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Decision, DecisionId, DecisionQuery, DecisionStatus } from './types';

export interface IDecisionRepository {
  save(decision: Decision): Promise<void>;
  findById(id: DecisionId): Promise<Decision | null>;
  query(query: DecisionQuery): Promise<{
    decisions: Decision[];
    total: number;
  }>;
  delete(id: DecisionId): Promise<void>;
}

/**
 * In-Memory Decision Repository (for development/testing)
 */
export class InMemoryDecisionRepository implements IDecisionRepository {
  private decisions = new Map<DecisionId, Decision>();
  private idCounter = 0;

  async save(decision: Decision): Promise<void> {
    this.decisions.set(decision.id, structuredClone(decision));
  }

  async findById(id: DecisionId): Promise<Decision | null> {
    const decision = this.decisions.get(id);
    return decision ? structuredClone(decision) : null;
  }

  async query(query: DecisionQuery): Promise<{
    decisions: Decision[];
    total: number;
  }> {
    let results = Array.from(this.decisions.values());

    if (query.status) {
      results = results.filter((d) => d.metadata.status === query.status);
    }
    if (query.contextType) {
      results = results.filter(
        (d) => d.metadata.contextType === query.contextType
      );
    }
    if (query.priority) {
      results = results.filter((d) => d.metadata.priority === query.priority);
    }
    if (query.createdBy) {
      results = results.filter((d) => d.metadata.createdBy === query.createdBy);
    }
    if (query.createdAfter) {
      results = results.filter(
        (d) => d.metadata.createdAt >= query.createdAfter!
      );
    }
    if (query.createdBefore) {
      results = results.filter(
        (d) => d.metadata.createdAt <= query.createdBefore!
      );
    }
    if (query.tags && query.tags.length > 0) {
      results = results.filter((d) =>
        query.tags!.some((tag) => d.metadata.tags?.includes(tag))
      );
    }
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      results = results.filter(
        (d) =>
          d.title.toLowerCase().includes(searchLower) ||
          d.description.toLowerCase().includes(searchLower)
      );
    }

    const total = results.length;
    const limit = query.limit || 10;
    const offset = query.offset || 0;
    results = results.slice(offset, offset + limit);

    return { decisions: results, total };
  }

  async delete(id: DecisionId): Promise<void> {
    this.decisions.delete(id);
  }
}

/**
 * Supabase Decision Repository
 * Production implementation using Supabase PostgreSQL
 */
export class SupabaseDecisionRepository implements IDecisionRepository {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Save a decision (create or update)
   * Uses upsert for idempotent saves
   */
  async save(decision: Decision): Promise<void> {
    const row = this.decisionToRow(decision);

    const { error } = await this.supabase
      .from('decisions')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      throw new Error(`Failed to save decision: ${error.message}`);
    }
  }

  /**
   * Find decision by ID
   */
  async findById(id: DecisionId): Promise<Decision | null> {
    const { data, error } = await this.supabase
      .from('decisions')
      .select(
        `
        *,
        approvals:decision_approvals(*)
      `
      )
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch decision: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return this.rowToDecision(data);
  }

  /**
   * Query decisions with filtering
   */
  async query(query: DecisionQuery): Promise<{
    decisions: Decision[];
    total: number;
  }> {
    let q = this.supabase
      .from('decisions')
      .select('*, approvals:decision_approvals(*)', { count: 'exact' });

    // Apply filters
    if (query.status) {
      q = q.eq('status', query.status);
    }
    if (query.contextType) {
      q = q.eq('context_type', query.contextType);
    }
    if (query.priority) {
      q = q.eq('priority', query.priority);
    }
    if (query.createdBy) {
      q = q.eq('created_by', query.createdBy);
    }
    if (query.createdAfter) {
      q = q.gte('created_at', query.createdAfter.toISOString());
    }
    if (query.createdBefore) {
      q = q.lte('created_at', query.createdBefore.toISOString());
    }
    if (query.search) {
      q = q.or(
        `title.ilike.%${query.search}%,description.ilike.%${query.search}%`
      );
    }

    // Apply sorting
    q = q.order('created_at', { ascending: false });

    // Apply pagination
    const limit = query.limit || 10;
    const offset = query.offset || 0;
    q = q.range(offset, offset + limit - 1);

    const { data, error, count } = await q;

    if (error) {
      throw new Error(`Failed to query decisions: ${error.message}`);
    }

    const decisions = (data || []).map((row) => this.rowToDecision(row));

    return {
      decisions,
      total: count || 0,
    };
  }

  /**
   * Delete a decision (soft delete via status)
   */
  async delete(id: DecisionId): Promise<void> {
    // For compliance, use soft delete by marking status
    const { error } = await this.supabase
      .from('decisions')
      .update({ status: DecisionStatus.REVOKED })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete decision: ${error.message}`);
    }
  }

  /**
   * Add approval record
   */
  async addApproval(
    decisionId: DecisionId,
    actorId: string,
    actorName: string,
    actorRole: string,
    approved: boolean,
    comment?: string
  ): Promise<void> {
    const { error } = await this.supabase.from('decision_approvals').insert({
      decision_id: decisionId,
      actor_id: actorId,
      actor_name: actorName,
      actor_role: actorRole,
      approved,
      comment,
    });

    if (error) {
      throw new Error(`Failed to add approval: ${error.message}`);
    }
  }

  /**
   * Get approval records for decision
   */
  async getApprovals(decisionId: DecisionId) {
    const { data, error } = await this.supabase
      .from('decision_approvals')
      .select('*')
      .eq('decision_id', decisionId)
      .order('timestamp', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch approvals: ${error.message}`);
    }

    return (data || []).map((row) => ({
      actorId: row.actor_id,
      actorName: row.actor_name,
      actorRole: row.actor_role,
      approved: row.approved,
      timestamp: new Date(row.timestamp),
      comment: row.comment,
      overriddenPriorDecision: row.overridden_prior_decision,
    }));
  }

  /**
   * Add audit log entry
   */
  async addAuditLog(
    decisionId: DecisionId,
    eventType: string,
    userId: string,
    action: string,
    details: Record<string, unknown>,
    options?: {
      userName?: string;
      userRole?: string;
      ipAddress?: string;
      userAgent?: string;
      errorMessage?: string;
    }
  ): Promise<void> {
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { error } = await this.supabase
      .from('decision_audit_logs')
      .insert({
        id: auditId,
        decision_id: decisionId,
        event_type: eventType,
        user_id: userId,
        user_name: options?.userName,
        user_role: options?.userRole,
        action,
        details,
        ip_address: options?.ipAddress,
        user_agent: options?.userAgent,
        status: options?.errorMessage ? 'failure' : 'success',
        error_message: options?.errorMessage,
      });

    if (error) {
      console.error('Failed to add audit log:', error);
      // Don't throw - audit logging failures shouldn't block main flow
    }
  }

  /**
   * Get audit trail for decision
   */
  async getAuditTrail(decisionId: DecisionId) {
    const { data, error } = await this.supabase
      .from('decision_audit_logs')
      .select('*')
      .eq('decision_id', decisionId)
      .order('timestamp', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch audit trail: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Internal: Convert Decision to database row
   */
  private decisionToRow(decision: Decision) {
    return {
      id: decision.id,
      title: decision.title,
      description: decision.description,
      context_type: decision.metadata.contextType,
      status: decision.metadata.status,
      priority: decision.metadata.priority,
      ai_analysis: decision.aiAnalysis,
      context_data: decision.contextData,
      action_plan: decision.actionPlan,
      human_notes: decision.humanNotes,
      override_ai_recommendation: decision.overrideAIRecommendation,
      override_reason: decision.overrideReason,
      created_by: decision.metadata.createdBy,
      created_at: decision.metadata.createdAt.toISOString(),
      updated_at: decision.metadata.updatedAt.toISOString(),
      execution_started_at: decision.metadata.executionStartedAt?.toISOString(),
      execution_completed_at: decision.metadata.executionCompletedAt?.toISOString(),
      execution_error: decision.metadata.executionError,
      rejection_reason: decision.metadata.rejectionReason,
      revocation_reason: decision.metadata.revocationReason,
      tags: decision.metadata.tags || [],
      external_id: decision.metadata.externalId,
    };
  }

  /**
   * Internal: Convert database row to Decision
   */
  private rowToDecision(row: any): Decision {
    return {
      id: row.id as DecisionId,
      title: row.title,
      description: row.description,
      aiAnalysis: row.ai_analysis,
      contextData: row.context_data,
      actionPlan: row.action_plan,
      humanNotes: row.human_notes,
      overrideAIRecommendation: row.override_ai_recommendation,
      overrideReason: row.override_reason,
      metadata: {
        createdBy: row.created_by,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        contextType: row.context_type,
        priority: row.priority,
        status: row.status,
        requiredApprovers: [],
        approvals: (row.approvals || []).map((a: any) => ({
          actorId: a.actor_id,
          actorName: a.actor_name,
          actorRole: a.actor_role,
          approved: a.approved,
          timestamp: new Date(a.timestamp),
          comment: a.comment,
          overriddenPriorDecision: a.overridden_prior_decision,
        })),
        rejectionReason: row.rejection_reason,
        revocationReason: row.revocation_reason,
        executionStartedAt: row.execution_started_at ? new Date(row.execution_started_at) : undefined,
        executionCompletedAt: row.execution_completed_at ? new Date(row.execution_completed_at) : undefined,
        executionError: row.execution_error,
        tags: row.tags || [],
        externalId: row.external_id,
      },
    };
  }
}

export type { IDecisionRepository as DecisionRepository };
