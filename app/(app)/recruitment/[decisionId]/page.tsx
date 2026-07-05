'use client';

/**
 * Recruitment Decision Detail View
 * 
 * Shows:
 * - Decision metadata and timeline
 * - Candidate research (ResearcherAgent output)
 * - Document generation panel (DocumentSpecialistAgent)
 * - Approval workflow (ApprovalCoordinatorAgent)
 * - Action plan execution status
 * - Audit trail
 */

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, FileText, CheckCircle2, Clock, AlertCircle, ChevronDown, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { DecisionStatus, DecisionPriority } from '@/core/decision-engine/types';

interface DecisionDetail {
  id: string;
  title: string;
  description: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  department: string;
  seniority: string;
  status: DecisionStatus;
  priority: DecisionPriority;
  createdAt: string;
  aiAnalysis?: {
    summary: string;
    recommendation: string;
    confidence: { score: number; rationale: string };
    details: Record<string, unknown>;
  };
  actionPlan?: {
    steps: Array<{ sequence: number; title: string; description: string; status?: string }>;
    estimatedDurationMinutes: number;
  };
  metadata?: {
    approvals: Array<{ approved: boolean; actorName: string; timestamp: string; comment?: string }>;
  };
}

export default function RecruitmentDecisionPage() {
  const params = useParams();
  const decisionId = params?.decisionId as string;
  const [decision, setDecision] = useState<DecisionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'documents' | 'approvals' | 'audit'>('overview');
  const [showApprovalPanel, setShowApprovalPanel] = useState(false);

  useEffect(() => {
    loadDecision();
  }, [decisionId]);

  const loadDecision = async () => {
    setIsLoading(true);
    try {
      // TODO: Fetch from /api/decisions/:id
      // Mock data for now
      const mockDecision: DecisionDetail = {
        id: decisionId,
        title: 'Senior Engineer Hiring Decision',
        description: 'Evaluating candidate for Backend Engineer position',
        candidateName: 'Alice Johnson',
        candidateEmail: 'alice@example.com',
        position: 'Senior Backend Engineer',
        department: 'Engineering',
        seniority: 'senior',
        status: DecisionStatus.PENDING_APPROVAL,
        priority: DecisionPriority.HIGH,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        aiAnalysis: {
          summary: 'Candidate assessment completed for Senior Backend Engineer role',
          recommendation: 'Recommend for offer preparation. Strong technical background with 8 years experience.',
          confidence: {
            score: 0.87,
            rationale: 'Strong skill alignment with position requirements',
          },
          details: {
            skillMatch: 0.95,
            experienceLevel: 0.85,
            cultureFit: 0.75,
            previousRoles: ['Backend Lead', 'Senior Developer'],
            yearsExperience: 8,
          },
        },
        actionPlan: {
          steps: [
            { sequence: 1, title: 'Generate Offer Letter', description: 'Create professional offer', status: 'pending' },
            { sequence: 2, title: 'HR Review', description: 'Compliance check', status: 'pending' },
            { sequence: 3, title: 'Manager Approval', description: 'Final approval', status: 'pending' },
            { sequence: 4, title: 'Send to Candidate', description: 'Deliver offer', status: 'pending' },
          ],
          estimatedDurationMinutes: 45,
        },
        metadata: {
          approvals: [
            { approved: true, actorName: 'HR Manager', timestamp: new Date().toISOString(), comment: 'Compliant with company policy' },
          ],
        },
      };
      setDecision(mockDecision);
    } catch (error) {
      console.error('Failed to load decision:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-slate-600 mt-3">Loading decision...</p>
      </div>
    );
  }

  if (!decision) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">Decision not found</p>
      </div>
    );
  }

  const getStatusColor = (status: DecisionStatus) => {
    const colors = {
      [DecisionStatus.DRAFT]: 'bg-slate-100 text-slate-700 border-slate-200',
      [DecisionStatus.PENDING_APPROVAL]: 'bg-amber-100 text-amber-700 border-amber-200',
      [DecisionStatus.APPROVED]: 'bg-green-100 text-green-700 border-green-200',
      [DecisionStatus.IN_EXECUTION]: 'bg-blue-100 text-blue-700 border-blue-200',
      [DecisionStatus.COMPLETED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      [DecisionStatus.REJECTED]: 'bg-red-100 text-red-700 border-red-200',
      [DecisionStatus.FAILED]: 'bg-red-100 text-red-700 border-red-200',
      [DecisionStatus.REVOKED]: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return colors[status];
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Link href="/recruitment" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Decisions
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Main Content */}
        <div className="col-span-2">
          {/* Decision Header */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{decision.title}</h1>
                <p className="text-slate-600 mt-1">{decision.description}</p>
              </div>
              <div className={`px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(decision.status)}`}>
                {decision.status.replace('_', ' ').toUpperCase()}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Candidate</p>
                <p className="text-slate-900 font-medium mt-1">{decision.candidateName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Position</p>
                <p className="text-slate-900 font-medium mt-1">{decision.position}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200 mb-6">
            <div className="flex gap-6">
              {(['overview', 'analysis', 'documents', 'approvals', 'audit'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-1 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">AI Analysis</h3>
                {decision.aiAnalysis && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="text-blue-600 mt-1">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">{decision.aiAnalysis.recommendation}</p>
                        <p className="text-sm text-blue-800 mt-1">{decision.aiAnalysis.summary}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-900">{(decision.aiAnalysis.confidence.score * 100).toFixed(0)}%</div>
                        <p className="text-xs text-slate-600 mt-1">Confidence</p>
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${decision.aiAnalysis.confidence.score * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-600 mt-2">{decision.aiAnalysis.confidence.rationale}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {decision.actionPlan && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Action Plan</h3>
                  <div className="space-y-3">
                    {decision.actionPlan.steps.map((step) => (
                      <div key={step.sequence} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-700 text-sm">
                            {step.sequence}
                          </div>
                          {step.sequence < decision.actionPlan!.steps.length && (
                            <div className="w-0.5 h-8 bg-slate-200 mt-1" />
                          )}
                        </div>
                        <div className="pb-4">
                          <p className="font-medium text-slate-900">{step.title}</p>
                          <p className="text-sm text-slate-600">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 mt-4">Estimated duration: {decision.actionPlan.estimatedDurationMinutes} minutes</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <p className="text-slate-600">Detailed AI analysis coming soon...</p>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
                <FileText className="w-4 h-4" />
                Generate Offer Letter
              </button>
              <p className="text-slate-600 text-sm mt-3">Documents generated by DocumentSpecialistAgent will appear here</p>
            </div>
          )}

          {activeTab === 'approvals' && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="space-y-4">
                {decision.metadata?.approvals && decision.metadata.approvals.length > 0 && (
                  <>
                    <h3 className="font-semibold text-slate-900">Approval History</h3>
                    {decision.metadata.approvals.map((approval, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-900">{approval.actorName} approved</p>
                          <p className="text-sm text-green-800">{approval.comment}</p>
                          <p className="text-xs text-green-700 mt-1">{new Date(approval.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <p className="text-slate-600">Audit trail and compliance logs coming soon...</p>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Approval Panel */}
          {decision.status === DecisionStatus.PENDING_APPROVAL && (
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <button
                onClick={() => setShowApprovalPanel(!showApprovalPanel)}
                className="w-full flex items-center justify-between font-semibold text-slate-900 hover:bg-slate-50 p-2 rounded transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Awaiting Approval
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showApprovalPanel ? 'rotate-180' : ''}`} />
              </button>
              {showApprovalPanel && (
                <div className="mt-4 space-y-3 pt-4 border-t border-slate-200">
                  <button className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors">
                    Approve
                  </button>
                  <button className="w-full px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium text-sm transition-colors">
                    Reject
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action Panel */}
          {decision.status === DecisionStatus.APPROVED && (
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <button className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors">
                Execute Action Plan
              </button>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 mb-3 text-sm">Timeline</h3>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-900">Decision Created</p>
                  <p className="text-slate-600 text-xs">{new Date(decision.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 mb-3 text-sm">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-sm transition-colors text-left flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Add Comment
              </button>
              <button className="w-full px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-sm transition-colors text-left flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Download Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
