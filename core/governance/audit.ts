/**
 * Governance Audit Module
 * 
 * GOVERNANCE-MANDATORY: Maintains comprehensive audit trail of all decisions.
 * Records who did what, when, and with what result.
 */

import { DecisionId } from '../decision-engine/types';

/**
 * Audit Event Type - what happened
 */
export enum AuditEventType {
  DECISION_CREATED = 'decision_created',
  DECISION_SUBMITTED = 'decision_submitted',
  DECISION_UPDATED = 'decision_updated',
  APPROVAL_RECORDED = 'approval_recorded',
  DECISION_REJECTED = 'decision_rejected',
  DECISION_APPROVED = 'decision_approved',
  EXECUTION_STARTED = 'execution_started',
  EXECUTION_COMPLETED = 'execution_completed',
  EXECUTION_FAILED = 'execution_failed',
  DECISION_REVOKED = 'decision_revoked',
  HUMAN_OVERRIDE = 'human_override',
}

/**
 * Audit Record - immutable log entry
 */
export interface AuditRecord {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  decisionId: DecisionId;
  userId: string;
  userName?: string;
  userRole?: string;
  action: string; // Human-readable description
  details: Record<string, unknown>; // Context-specific data
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  errorMessage?: string;
}

/**
 * Audit Log - manages audit records
 */
export class AuditLog {
  private records: AuditRecord[] = [];
  private recordId = 0;

  /**
   * Record an audit event
   */
  recordEvent(
    eventType: AuditEventType,
    decisionId: DecisionId,
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
  ): AuditRecord {
    const record: AuditRecord = {
      id: `audit_${this.recordId++}`,
      timestamp: new Date(),
      eventType,
      decisionId,
      userId,
      userName: options?.userName,
      userRole: options?.userRole,
      action,
      details,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      status: options?.errorMessage ? 'failure' : 'success',
      errorMessage: options?.errorMessage,
    };

    this.records.push(record);
    return record;
  }

  /**
   * Get audit trail for a decision
   */
  getAuditTrail(decisionId: DecisionId): AuditRecord[] {
    return this.records.filter((r) => r.decisionId === decisionId);
  }

  /**
   * Get all audit records (for admin)
   */
  getAllRecords(): AuditRecord[] {
    return [...this.records];
  }

  /**
   * Query audit records
   */
  query(filters: {
    eventType?: AuditEventType;
    userId?: string;
    decisionId?: DecisionId;
    fromDate?: Date;
    toDate?: Date;
  }): AuditRecord[] {
    return this.records.filter((r) => {
      if (filters.eventType && r.eventType !== filters.eventType) return false;
      if (filters.userId && r.userId !== filters.userId) return false;
      if (filters.decisionId && r.decisionId !== filters.decisionId) return false;
      if (filters.fromDate && r.timestamp < filters.fromDate) return false;
      if (filters.toDate && r.timestamp > filters.toDate) return false;
      return true;
    });
  }
}
