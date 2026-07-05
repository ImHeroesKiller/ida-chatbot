/**
 * Core Decision Engine Types
 * 
 * Defines the foundational types for the Intelligent Decision Automation (IDA) platform.
 * Aligned with MASTER CONTEXT principles:
 * - DECISION-CENTRIC: All structures revolve around discrete, traceable decisions
 * - GOVERNANCE-MANDATORY: Every decision includes approval, audit, and compliance metadata
 * - HUMAN-AMPLIFICATION: AI augments human judgment; humans retain final authority
 * - EXECUTION-FIRST: Decisions are actionable and immediately executable
 */

import { z } from 'zod';

/**
 * Unique identifier for a decision instance
 */
export type DecisionId = string & { readonly __brand: 'DecisionId' };

/**
 * Decision Status - lifecycle states for a decision
 */
export enum DecisionStatus {
  /** Decision is in draft state, not yet submitted for review */
  DRAFT = 'draft',
  /** Decision is awaiting approval from governance actors */
  PENDING_APPROVAL = 'pending_approval',
  /** Decision has been approved and is executable */
  APPROVED = 'approved',
  /** Decision is actively being executed */
  IN_EXECUTION = 'in_execution',
  /** Decision execution has completed successfully */
  COMPLETED = 'completed',
  /** Decision was rejected during approval */
  REJECTED = 'rejected',
  /** Decision execution encountered an error */
  FAILED = 'failed',
  /** Decision was revoked after approval */
  REVOKED = 'revoked',
}

/**
 * Decision Priority - influences resource allocation and urgency
 */
export enum DecisionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Decision Context Type - domain-specific context for decision making
 * Extensible for different organizational decision types
 */
export type DecisionContextType = 
  | 'hr-recruitment'      // HR Recruitment decisions
  | 'financial'            // Financial/Budget decisions
  | 'operational'          // Operational process decisions
  | 'strategic'            // Strategic business decisions
  | 'compliance'           // Compliance & regulatory decisions
  | 'custom';              // Custom/extensible type

/**
 * AI Confidence Score (0-1) with reasoning
 */
export interface ConfidenceScore {
  score: number;           // 0.0 to 1.0
  rationale: string;       // Why this confidence level
  factors?: Record<string, number>; // Weighted factors
}

/**
 * AI Analysis Result - output from workforce agents
 */
export interface AIAnalysisResult {
  summary: string;         // Executive summary of analysis
  recommendation: string;  // Recommended course of action
  confidence: ConfidenceScore;
  details: Record<string, unknown>; // Context-specific detailed data
  sources?: string[];      // References/sources used (URLs, documents)
  timestamp: Date;         // When analysis was generated
}

/**
 * Approval Actor - represents a human or system that can approve decisions
 */
export interface ApprovalActor {
  id: string;
  name: string;
  role: string;            // e.g., "Hiring Manager", "Finance Director"
  email: string;
  requiredForApproval: boolean; // If true, this actor MUST approve
}

/**
 * Approval Record - tracks one actor's decision on a decision
 */
export interface ApprovalRecord {
  actorId: string;
  actorName: string;
  actorRole: string;
  approved: boolean;
  timestamp: Date;
  comment?: string;        // Reason for approval/rejection
  overriddenPriorDecision?: boolean; // If true, contradicts earlier approval
}

/**
 * Decision Metadata - governance and audit information
 * Mandatory for all decisions per GOVERNANCE-MANDATORY principle
 */
export interface DecisionMetadata {
  createdBy: string;       // User ID who initiated
  createdAt: Date;
  updatedAt: Date;
  contextType: DecisionContextType;
  priority: DecisionPriority;
  status: DecisionStatus;
  requiredApprovers: ApprovalActor[];
  approvals: ApprovalRecord[];
  rejectionReason?: string; // If status is REJECTED
  revocationReason?: string; // If status is REVOKED
  executionStartedAt?: Date;
  executionCompletedAt?: Date;
  executionError?: string;
  tags?: string[];         // For categorization and search
  externalId?: string;     // Reference to external system (e.g., HRIS, AP system)
}

/**
 * Decision - the core domain entity
 * Represents a single actionable decision with full governance
 */
export interface Decision<T = Record<string, unknown>> {
  id: DecisionId;
  title: string;           // Human-readable title
  description: string;     // Detailed description of what is being decided
  
  // AI Analysis (Human Amplification)
  aiAnalysis: AIAnalysisResult; // Output from workforce agents
  humanNotes?: string;     // Human decision-maker's additional notes
  overrideAIRecommendation?: boolean; // True if human chose differently than AI
  overrideReason?: string; // Why human overrode AI (Human Amplification audit trail)
  
  // Decision Content (Execution-First)
  contextData: T;          // Structured decision-specific data
  actionPlan: ActionPlan;  // What will be done if approved
  
  // Governance (Governance-Mandatory)
  metadata: DecisionMetadata;
}

/**
 * Action Plan - defines what happens if this decision is approved/executed
 * Execution-first: every decision must include its action plan
 */
export interface ActionPlan {
  steps: ExecutionStep[];
  estimatedDurationMinutes: number;
  requiredApprovals: boolean; // True if execution requires additional approvals
  toolsRequired: string[]; // IDs of tools/capabilities needed (e.g., 'worksheet', 'workflow')
  rollbackPlan?: string;   // How to reverse if needed
}

/**
 * Single step in an action plan
 */
export interface ExecutionStep {
  sequence: number;
  title: string;
  description: string;
  tool: 'worksheet' | 'workflow' | 'research' | 'custom';
  toolInput: Record<string, unknown>; // Parameters for the tool
  expectedOutput: Record<string, unknown>; // What we expect back
  requiresHumanReview: boolean;
}

/**
 * Decision Query/Filter - for searching decisions
 */
export interface DecisionQuery {
  status?: DecisionStatus;
  contextType?: DecisionContextType;
  priority?: DecisionPriority;
  createdBy?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  tags?: string[];
  search?: string;         // Full-text search on title/description
  limit?: number;
  offset?: number;
}

/**
 * Decision Creation Input - what's provided when creating a new decision
 */
export interface CreateDecisionInput<T = Record<string, unknown>> {
  title: string;
  description: string;
  contextType: DecisionContextType;
  contextData: T;
  priority?: DecisionPriority; // Defaults to MEDIUM
  requiredApprovers: ApprovalActor[];
  tags?: string[];
  externalId?: string;
}

/**
 * Decision Update Input - what can be modified
 */
export interface UpdateDecisionInput {
  title?: string;
  description?: string;
  priority?: DecisionPriority;
  humanNotes?: string;
  overrideAIRecommendation?: boolean;
  overrideReason?: string;
  tags?: string[];
}

/**
 * Zod schemas for validation
 */
export const ApprovalActorSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  email: z.string().email(),
  requiredForApproval: z.boolean(),
});

export const ConfidenceScoreSchema = z.object({
  score: z.number().min(0).max(1),
  rationale: z.string(),
  factors: z.record(z.string(), z.number()).optional(),
});

export const AIAnalysisResultSchema = z.object({
  summary: z.string(),
  recommendation: z.string(),
  confidence: ConfidenceScoreSchema,
  details: z.record(z.string(), z.unknown()),
  sources: z.string().array().optional(),
  timestamp: z.date(),
});

export const ExecutionStepSchema = z.object({
  sequence: z.number().positive(),
  title: z.string(),
  description: z.string(),
  tool: z.enum(['worksheet', 'workflow', 'research', 'custom']),
  toolInput: z.record(z.string(), z.unknown()),
  expectedOutput: z.record(z.string(), z.unknown()),
  requiresHumanReview: z.boolean(),
});

export const ActionPlanSchema = z.object({
  steps: z.array(ExecutionStepSchema),
  estimatedDurationMinutes: z.number().positive(),
  requiredApprovals: z.boolean(),
  toolsRequired: z.string().array(),
  rollbackPlan: z.string().optional(),
});
