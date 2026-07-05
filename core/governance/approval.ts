/**
 * Governance Approval Module
 * 
 * GOVERNANCE-MANDATORY: Manages approval workflows and compliance.
 * Ensures decisions are reviewed by appropriate stakeholders.
 */

import { DecisionId, ApprovalActor, ApprovalRecord } from '../decision-engine/types';

/**
 * Approval Policy - defines rules for approving decisions
 */
export interface ApprovalPolicy {
  id: string;
  name: string;
  description: string;
  contextType: string; // e.g., 'hr-recruitment'
  approvalThresholds: {
    amount?: number; // For financial decisions
    complexity?: string; // For complexity-based routing
  };
  requiredApproverRoles: string[];
  escalationRules?: {
    delayHours: number;
    escalateToRole: string;
  };
  isActive: boolean;
}

/**
 * Approval Manager - enforces approval policies
 */
export class ApprovalManager {
  private policies: Map<string, ApprovalPolicy> = new Map();
  private approvalTimeouts: Map<DecisionId, NodeJS.Timeout> = new Map();

  /**
   * Register an approval policy
   */
  registerPolicy(policy: ApprovalPolicy): void {
    this.policies.set(policy.id, policy);
  }

  /**
   * Get policy by context type
   */
  getPolicy(contextType: string): ApprovalPolicy | undefined {
    return Array.from(this.policies.values()).find(
      (p) => p.contextType === contextType && p.isActive
    );
  }

  /**
   * Determine required approvers for a decision
   */
  determineRequiredApprovers(
    contextType: string,
    decisionData?: Record<string, unknown>
  ): string[] {
    const policy = this.getPolicy(contextType);
    if (!policy) {
      return ['default_approver'];
    }
    return policy.requiredApproverRoles;
  }

  /**
   * Check if approval is complete
   */
  isApprovalComplete(
    requiredApprovers: ApprovalActor[],
    approvals: ApprovalRecord[]
  ): boolean {
    // All required approvers must have approved
    const requiredIds = requiredApprovers
      .filter((a) => a.requiredForApproval)
      .map((a) => a.id);

    if (requiredIds.length === 0) {
      return true; // No required approvers
    }

    return requiredIds.every((id) =>
      approvals.some((a) => a.actorId === id && a.approved)
    );
  }

  /**
   * Get approval status
   */
  getApprovalStatus(
    requiredApprovers: ApprovalActor[],
    approvals: ApprovalRecord[]
  ): {
    status: 'pending' | 'approved' | 'rejected';
    approvalCount: number;
    rejectionCount: number;
    pendingCount: number;
    pendingApprovers: ApprovalActor[];
  } {
    const approvalCount = approvals.filter((a) => a.approved).length;
    const rejectionCount = approvals.filter((a) => !a.approved).length;
    const pendingCount = requiredApprovers.length - approvals.length;

    const approvedIds = new Set(
      approvals.filter((a) => a.approved).map((a) => a.actorId)
    );
    const pendingApprovers = requiredApprovers.filter(
      (a) => !approvedIds.has(a.id)
    );

    let status: 'pending' | 'approved' | 'rejected' = 'pending';
    if (rejectionCount > 0) {
      status = 'rejected';
    } else if (this.isApprovalComplete(requiredApprovers, approvals)) {
      status = 'approved';
    }

    return {
      status,
      approvalCount,
      rejectionCount,
      pendingCount,
      pendingApprovers,
    };
  }

  /**
   * Set up approval escalation
   */
  setupEscalation(
    decisionId: DecisionId,
    contextType: string,
    onEscalate: (decisionId: DecisionId, escalatedToRole: string) => void
  ): void {
    const policy = this.getPolicy(contextType);
    if (!policy || !policy.escalationRules) {
      return;
    }

    const timeoutId = setTimeout(() => {
      onEscalate(decisionId, policy.escalationRules!.escalateToRole);
    }, policy.escalationRules.delayHours * 60 * 60 * 1000);

    this.approvalTimeouts.set(decisionId, timeoutId);
  }

  /**
   * Cancel escalation
   */
  cancelEscalation(decisionId: DecisionId): void {
    const timeoutId = this.approvalTimeouts.get(decisionId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.approvalTimeouts.delete(decisionId);
    }
  }
}
