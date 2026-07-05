/**
 * Decision Repository - Data access layer for decisions
 * 
 * Abstract interface for persisting and querying decisions.
 * Implementations can use Supabase, MongoDB, PostgreSQL, etc.
 */

import { Decision, DecisionId, DecisionQuery } from './types';

/**
 * Decision Repository Interface
 * Defines persistence contract for Decision entities
 */
export interface IDecisionRepository {
  /**
   * Save a decision (create or update)
   */
  save(decision: Decision): Promise<void>;

  /**
   * Find decision by ID
   */
  findById(id: DecisionId): Promise<Decision | null>;

  /**
   * Query decisions with filtering
   */
  query(query: DecisionQuery): Promise<{
    decisions: Decision[];
    total: number;
  }>;

  /**
   * Delete a decision (soft delete recommended)
   */
  delete(id: DecisionId): Promise<void>;
}

/**
 * In-Memory Decision Repository (for development/testing)
 * In production, implement with Supabase or other database
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

    // Apply filters
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

    // Apply pagination
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
 * Supabase Decision Repository (production implementation)
 * Persists decisions to Supabase PostgreSQL
 */
export class SupabaseDecisionRepository implements IDecisionRepository {
  // Implementation would go here
  // This requires:
  // - Supabase client initialized
  // - Database schema for decisions table
  // - Proper type serialization (dates, nested objects)

  async save(decision: Decision): Promise<void> {
    // TODO: Implement with supabase.from('decisions').upsert(...)
    throw new Error('Not implemented');
  }

  async findById(id: DecisionId): Promise<Decision | null> {
    // TODO: Implement with supabase.from('decisions').select(...).eq('id', id)
    throw new Error('Not implemented');
  }

  async query(query: DecisionQuery): Promise<{
    decisions: Decision[];
    total: number;
  }> {
    // TODO: Implement with supabase query builder
    throw new Error('Not implemented');
  }

  async delete(id: DecisionId): Promise<void> {
    // TODO: Implement with supabase.from('decisions').delete().eq('id', id)
    throw new Error('Not implemented');
  }
}

/**
 * Export the interface as the public contract
 */
export { IDecisionRepository as DecisionRepository };
