/**
 * Recruitment Agents - Domain-specific agents for HR Recruitment decisions
 * 
 * Three specialized agents:
 * 1. RESEARCHER - Gathers and analyzes candidate/role information
 * 2. DOCUMENT_SPECIALIST - Processes and manages recruitment documents
 * 3. APPROVAL_COORDINATOR - Manages approvals and compliance
 * 
 * HUMAN-AMPLIFICATION: Agents provide analysis; humans make final decisions
 */

import { AgentRegistry, AgentRole, AgentTask, AgentCapability } from './registry';
import { AIAnalysisResult, ConfidenceScore } from '../decision-engine/types';

/**
 * Recruitment Context - specific data for HR decisions
 */
export interface RecruitmentContext {
  positionId: string;
  positionTitle: string;
  department: string;
  candidateId?: string;
  candidateName?: string;
  candidateEmail?: string;
  seniority: 'junior' | 'mid' | 'senior' | 'lead';
  requiredSkills: string[];
}

/**
 * ResearcherAgent - Gathers and analyzes recruitment data
 * HUMAN-AMPLIFICATION: Provides research-based recommendations
 */
export class ResearcherAgent {
  private registry: AgentRegistry;
  private agentId: string;

  constructor(registry: AgentRegistry) {
    this.registry = registry;

    // Register this agent on instantiation
    const capabilities: AgentCapability[] = [
      {
        name: 'candidate_research',
        description: 'Research candidate background and qualifications',
        toolsUsed: ['research', 'web_search'],
        estimatedDurationMinutes: 15,
      },
      {
        name: 'role_analysis',
        description: 'Analyze job requirements and market data',
        toolsUsed: ['research', 'worksheet'],
        estimatedDurationMinutes: 10,
      },
      {
        name: 'fit_assessment',
        description: 'Assess candidate-role fit based on data',
        toolsUsed: ['research', 'workflow'],
        estimatedDurationMinutes: 20,
      },
    ];

    const agentMetadata = this.registry.registerAgent({
      name: 'Recruitment Researcher',
      role: AgentRole.RESEARCHER,
      description: 'Researches candidates and roles to provide data-driven analysis',
      version: '1.0.0',
      capabilities,
      maxConcurrentTasks: 5,
      requiresHumanOversight: true,
      isActive: true,
    });

    this.agentId = agentMetadata.id;
  }

  /**
   * Execute research task for a recruitment decision
   * EXECUTION-FIRST: Returns immediately executable analysis
   */
  async analyzeCandidate(
    decisionId: string,
    context: RecruitmentContext
  ): Promise<AIAnalysisResult> {
    // Create task in registry
    const task = this.registry.createTask(this.agentId, decisionId, {
      type: 'candidate_research',
      context,
    });

    try {
      this.registry.updateTask(task.taskId, {
        status: 'in_progress',
        startedAt: new Date(),
      });

      // Simulated research (in production, would call research API)
      const analysis = await this.performCandidateResearch(context);

      this.registry.updateTask(task.taskId, {
        status: 'completed',
        output: analysis,
        completedAt: new Date(),
      });

      return analysis;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.registry.updateTask(task.taskId, {
        status: 'failed',
        error: errorMessage,
        completedAt: new Date(),
      });
      throw error;
    }
  }

  /**
   * Internal: Perform candidate research (simulated)
   */
  private async performCandidateResearch(
    context: RecruitmentContext
  ): Promise<AIAnalysisResult> {
    // In production: Call actual research API
    // - Query candidate information
    // - Analyze skills and experience
    // - Check market comparables
    // - Generate fit assessment

    return {
      summary: `Candidate research for ${context.candidateName || 'Unknown'} applying to ${context.positionTitle}`,
      recommendation: 'Recommend for next interview round based on qualifications',
      confidence: {
        score: 0.85,
        rationale: 'Strong skill alignment with position requirements',
        factors: {
          skillMatch: 0.9,
          experienceLevel: 0.85,
          cultureFit: 0.75,
        },
      } as ConfidenceScore,
      details: {
        candidateSkills: context.requiredSkills,
        yearsExperience: 5,
        previousRoles: ['Senior Developer', 'Tech Lead'],
        education: 'BS Computer Science',
      },
      sources: [
        'candidate_resume',
        'linkedin_profile',
        'github_portfolio',
      ],
      timestamp: new Date(),
    };
  }
}

/**
 * DocumentSpecialistAgent - Manages recruitment documents
 * EXECUTION-FIRST: Produces ready-to-use documents
 */
export class DocumentSpecialistAgent {
  private registry: AgentRegistry;
  private agentId: string;

  constructor(registry: AgentRegistry) {
    this.registry = registry;

    const capabilities: AgentCapability[] = [
      {
        name: 'offer_letter_generation',
        description: 'Generate professional offer letters',
        toolsUsed: ['worksheet'],
        estimatedDurationMinutes: 10,
      },
      {
        name: 'contract_preparation',
        description: 'Prepare employment contracts',
        toolsUsed: ['worksheet', 'workflow'],
        estimatedDurationMinutes: 20,
      },
      {
        name: 'onboarding_docs',
        description: 'Generate onboarding documentation',
        toolsUsed: ['worksheet'],
        estimatedDurationMinutes: 15,
      },
    ];

    const agentMetadata = this.registry.registerAgent({
      name: 'Document Specialist',
      role: AgentRole.DOCUMENT_SPECIALIST,
      description: 'Generates and manages recruitment-related documents',
      version: '1.0.0',
      capabilities,
      maxConcurrentTasks: 10,
      requiresHumanOversight: true,
      isActive: true,
    });

    this.agentId = agentMetadata.id;
  }

  /**
   * Generate offer letter for approved candidate
   */
  async generateOfferLetter(
    decisionId: string,
    context: RecruitmentContext & { compensation: { salary: number; benefits: string[] } }
  ): Promise<AIAnalysisResult> {
    const task = this.registry.createTask(this.agentId, decisionId, {
      type: 'offer_letter',
      context,
    });

    try {
      this.registry.updateTask(task.taskId, {
        status: 'in_progress',
        startedAt: new Date(),
      });

      const result = await this.createOfferLetter(context);

      this.registry.updateTask(task.taskId, {
        status: 'completed',
        output: result.details,
        completedAt: new Date(),
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.registry.updateTask(task.taskId, {
        status: 'failed',
        error: errorMessage,
        completedAt: new Date(),
      });
      throw error;
    }
  }

  /**
   * Internal: Create offer letter (simulated)
   */
  private async createOfferLetter(
    context: RecruitmentContext & { compensation: { salary: number; benefits: string[] } }
  ): Promise<AIAnalysisResult> {
    // In production: Use worksheet API to generate formatted document
    return {
      summary: `Offer letter generated for ${context.candidateName}`,
      recommendation: 'Document ready for review and signature',
      confidence: {
        score: 1.0,
        rationale: 'Document generated from template',
      } as ConfidenceScore,
      details: {
        documentId: `offer_${Date.now()}`,
        documentType: 'offer_letter',
        candidateName: context.candidateName,
        position: context.positionTitle,
        salary: context.compensation.salary,
        benefits: context.compensation.benefits,
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
      },
      timestamp: new Date(),
    };
  }
}

/**
 * ApprovalCoordinatorAgent - Manages approval workflows
 * GOVERNANCE-MANDATORY: Ensures compliance and audit trail
 */
export class ApprovalCoordinatorAgent {
  private registry: AgentRegistry;
  private agentId: string;

  constructor(registry: AgentRegistry) {
    this.registry = registry;

    const capabilities: AgentCapability[] = [
      {
        name: 'approval_routing',
        description: 'Route decisions to appropriate approvers',
        toolsUsed: ['workflow'],
        estimatedDurationMinutes: 5,
      },
      {
        name: 'compliance_check',
        description: 'Verify compliance with HR policies',
        toolsUsed: ['research', 'workflow'],
        estimatedDurationMinutes: 10,
      },
      {
        name: 'status_tracking',
        description: 'Track approval status and escalate if needed',
        toolsUsed: ['workflow'],
        estimatedDurationMinutes: 5,
      },
    ];

    const agentMetadata = this.registry.registerAgent({
      name: 'Approval Coordinator',
      role: AgentRole.APPROVAL_COORDINATOR,
      description: 'Coordinates approvals and ensures compliance',
      version: '1.0.0',
      capabilities,
      maxConcurrentTasks: 20,
      requiresHumanOversight: false,
      isActive: true,
    });

    this.agentId = agentMetadata.id;
  }

  /**
   * Route decision to approvers
   */
  async routeForApproval(
    decisionId: string,
    approvers: { id: string; name: string; role: string }[]
  ): Promise<AIAnalysisResult> {
    const task = this.registry.createTask(this.agentId, decisionId, {
      type: 'approval_routing',
      approvers,
    });

    try {
      this.registry.updateTask(task.taskId, {
        status: 'in_progress',
        startedAt: new Date(),
      });

      const result = {
        summary: 'Decision routed for approval',
        recommendation: `Awaiting approval from ${approvers.length} reviewer(s)`,
        confidence: {
          score: 1.0,
          rationale: 'Approval routing completed',
        } as ConfidenceScore,
        details: {
          routedTo: approvers.map((a) => a.name),
          routedAt: new Date(),
          expectedCompletionTime: '24 hours',
        },
        timestamp: new Date(),
      };

      this.registry.updateTask(task.taskId, {
        status: 'completed',
        output: result.details,
        completedAt: new Date(),
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.registry.updateTask(task.taskId, {
        status: 'failed',
        error: errorMessage,
        completedAt: new Date(),
      });
      throw error;
    }
  }
}
