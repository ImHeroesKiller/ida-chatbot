/**
 * Workforce Supervisor - Orchestrates all agents in the digital workforce
 * 
 * DECISION-CENTRIC: Supervisor ensures all agents work toward complete decisions
 * HUMAN-AMPLIFICATION: Coordinates agents to augment human decision-making
 */

import {
  Decision,
  DecisionContextType,
  AIAnalysisResult,
  ActionPlan,
  ExecutionStep,
} from '../decision-engine/types';
import { AgentRegistry, AgentRole, AgentTask } from './registry';
import { ResearcherAgent, DocumentSpecialistAgent, ApprovalCoordinatorAgent, RecruitmentContext } from './recruitment-agents';

/**
 * Workforce Supervisor - manages agent lifecycle and orchestration
 */
export class WorkforceSupervisor {
  private registry: AgentRegistry;
  private researcherAgent: ResearcherAgent;
  private documentAgent: DocumentSpecialistAgent;
  private approvalAgent: ApprovalCoordinatorAgent;

  constructor() {
    this.registry = new AgentRegistry();
    this.researcherAgent = new ResearcherAgent(this.registry);
    this.documentAgent = new DocumentSpecialistAgent(this.registry);
    this.approvalAgent = new ApprovalCoordinatorAgent(this.registry);
  }

  /**
   * Orchestrate agent analysis for HR Recruitment decisions
   * DECISION-CENTRIC: Coordinates agents to produce complete decision analysis
   */
  async orchestrateRecruitmentAnalysis(
    decisionId: string,
    context: RecruitmentContext
  ): Promise<{
    analysis: AIAnalysisResult;
    actionPlan: ActionPlan;
  }> {
    // Step 1: Researcher analyzes candidate and role fit
    const researchAnalysis = await this.researcherAgent.analyzeCandidate(
      decisionId,
      context
    );

    if (!this.isRecommendationPositive(researchAnalysis)) {
      // If researcher doesn't recommend, stop here
      return {
        analysis: researchAnalysis,
        actionPlan: this.createRejectionPlan(),
      };
    }

    // Step 2: Build action plan with document generation and approval
    const actionPlan = await this.buildRecruitmentActionPlan(context);

    // Step 3: Approval coordinator prepares approval routing
    const coordinationAnalysis = await this.approvalAgent.routeForApproval(
      decisionId,
      [
        { id: 'hr_manager', name: 'HR Manager', role: 'hr_manager' },
        { id: 'hiring_manager', name: 'Hiring Manager', role: 'hiring_manager' },
      ]
    );

    // Synthesize final analysis
    const synthesizedAnalysis: AIAnalysisResult = {
      summary: `${researchAnalysis.summary} - Ready for approval routing`,
      recommendation: `${researchAnalysis.recommendation}. Document preparation required.`,
      confidence: researchAnalysis.confidence,
      details: {
        researchDetails: researchAnalysis.details,
        approvalPlan: coordinationAnalysis.details,
        actionPlan: actionPlan,
      },
      sources: [...(researchAnalysis.sources || []), ...coordinationAnalysis.sources || []],
      timestamp: new Date(),
    };

    return {
      analysis: synthesizedAnalysis,
      actionPlan,
    };
  }

  /**
   * Build recruitment action plan with executable steps
   * EXECUTION-FIRST: Every step is immediately executable
   */
  private async buildRecruitmentActionPlan(
    context: RecruitmentContext
  ): Promise<ActionPlan> {
    const steps: ExecutionStep[] = [
      {
        sequence: 1,
        title: 'Generate Offer Letter',
        description: `Create professional offer letter for ${context.candidateName}`,
        tool: 'worksheet',
        toolInput: {
          templateId: 'offer_letter_standard',
          candidateName: context.candidateName,
          position: context.positionTitle,
          department: context.department,
        },
        expectedOutput: {
          documentId: 'string',
          documentUrl: 'string',
          status: 'ready_for_review',
        },
        requiresHumanReview: true,
      },
      {
        sequence: 2,
        title: 'Route for HR Approval',
        description: 'Send offer to HR for compliance review',
        tool: 'workflow',
        toolInput: {
          workflowId: 'hr_approval_workflow',
          approverRole: 'hr_manager',
        },
        expectedOutput: {
          workflowId: 'string',
          status: 'initiated',
        },
        requiresHumanReview: false,
      },
      {
        sequence: 3,
        title: 'Route for Manager Approval',
        description: 'Send offer to hiring manager for final approval',
        tool: 'workflow',
        toolInput: {
          workflowId: 'manager_approval_workflow',
          approverRole: 'hiring_manager',
        },
        expectedOutput: {
          workflowId: 'string',
          status: 'initiated',
        },
        requiresHumanReview: false,
      },
      {
        sequence: 4,
        title: 'Send Offer to Candidate',
        description: `Send signed offer letter to ${context.candidateEmail}`,
        tool: 'workflow',
        toolInput: {
          workflowId: 'candidate_notification_workflow',
          recipientEmail: context.candidateEmail,
        },
        expectedOutput: {
          emailSent: true,
          status: 'completed',
        },
        requiresHumanReview: false,
      },
    ];

    return {
      steps,
      estimatedDurationMinutes: 45,
      requiredApprovals: true,
      toolsRequired: ['worksheet', 'workflow'],
      rollbackPlan: 'Revoke offer if candidate declines or conditions not met',
    };
  }

  /**
   * Check if analysis recommendation is positive
   */
  private isRecommendationPositive(analysis: AIAnalysisResult): boolean {
    const scoreThreshold = 0.7;
    return analysis.confidence.score >= scoreThreshold &&
      analysis.recommendation.toLowerCase().includes('recommend');
  }

  /**
   * Create rejection plan (when recommendation is negative)
   */
  private createRejectionPlan(): ActionPlan {
    return {
      steps: [
        {
          sequence: 1,
          title: 'Send Rejection Notification',
          description: 'Notify candidate and hiring manager',
          tool: 'workflow',
          toolInput: {
            workflowId: 'rejection_notification',
          },
          expectedOutput: {
            notificationSent: true,
          },
          requiresHumanReview: true,
        },
      ],
      estimatedDurationMinutes: 5,
      requiredApprovals: false,
      toolsRequired: ['workflow'],
    };
  }

  /**
   * Get workforce status and metrics
   */
  getWorkforceStatus() {
    const agents = this.registry.getAllAgents();
    return {
      totalAgents: agents.length,
      activeAgents: agents.filter((a) => a.isActive).length,
      agentsByRole: {
        researchers: agents.filter((a) => a.role === AgentRole.RESEARCHER).length,
        documentSpecialists: agents.filter((a) => a.role === AgentRole.DOCUMENT_SPECIALIST).length,
        approvalCoordinators: agents.filter((a) => a.role === AgentRole.APPROVAL_COORDINATOR).length,
      },
      agents,
    };
  }
}
