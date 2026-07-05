'use client';

/**
 * Recruitment Dashboard
 * 
 * Main page showing:
 * - List of hiring decisions
 * - Pipeline overview (draft → approved → completed)
 * - Quick create button for new decisions
 * - Filter and search capabilities
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, TrendingUp, AlertCircle } from 'lucide-react';
import { DecisionStatus, DecisionPriority } from '@/core/decision-engine/types';

interface Decision {
  id: string;
  title: string;
  description: string;
  candidateName?: string;
  position?: string;
  status: DecisionStatus;
  priority: DecisionPriority;
  createdAt: string;
  metadata?: {
    approvals: Array<{ approved: boolean; actorName: string }>;
  };
}

export default function RecruitmentDashboard() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [filteredDecisions, setFilteredDecisions] = useState<Decision[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<DecisionStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showNewDecisionModal, setShowNewDecisionModal] = useState(false);

  // Load decisions on mount
  useEffect(() => {
    loadDecisions();
  }, []);

  // Filter decisions based on status and search query
  useEffect(() => {
    let filtered = decisions;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((d) => d.status === selectedStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(query) ||
          d.candidateName?.toLowerCase().includes(query) ||
          d.position?.toLowerCase().includes(query)
      );
    }

    setFilteredDecisions(filtered);
  }, [decisions, selectedStatus, searchQuery]);

  const loadDecisions = async () => {
    setIsLoading(true);
    try {
      // TODO: Fetch from /api/decisions
      // Mock data for now
      const mockDecisions: Decision[] = [
        {
          id: 'dec_001',
          title: 'Senior Engineer Hiring',
          description: 'Evaluating candidate for Backend Engineer role',
          candidateName: 'Alice Johnson',
          position: 'Senior Backend Engineer',
          status: DecisionStatus.PENDING_APPROVAL,
          priority: DecisionPriority.HIGH,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            approvals: [
              { approved: true, actorName: 'HR Manager' },
              { approved: false, actorName: 'Hiring Manager' },
            ],
          },
        },
        {
          id: 'dec_002',
          title: 'Product Manager Recruitment',
          description: 'Initial screening for PM role',
          candidateName: 'Bob Chen',
          position: 'Product Manager',
          status: DecisionStatus.DRAFT,
          priority: DecisionPriority.MEDIUM,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'dec_003',
          title: 'Data Scientist Offer',
          description: 'Final offer preparation',
          candidateName: 'Carol Wang',
          position: 'Senior Data Scientist',
          status: DecisionStatus.APPROVED,
          priority: DecisionPriority.HIGH,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            approvals: [
              { approved: true, actorName: 'HR Manager' },
              { approved: true, actorName: 'Hiring Manager' },
            ],
          },
        },
      ];
      setDecisions(mockDecisions);
    } catch (error) {
      console.error('Failed to load decisions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: DecisionStatus) => {
    const statusConfig = {
      [DecisionStatus.DRAFT]: 'bg-slate-100 text-slate-700',
      [DecisionStatus.PENDING_APPROVAL]: 'bg-amber-100 text-amber-700',
      [DecisionStatus.APPROVED]: 'bg-green-100 text-green-700',
      [DecisionStatus.IN_EXECUTION]: 'bg-blue-100 text-blue-700',
      [DecisionStatus.COMPLETED]: 'bg-emerald-100 text-emerald-700',
      [DecisionStatus.REJECTED]: 'bg-red-100 text-red-700',
      [DecisionStatus.FAILED]: 'bg-red-100 text-red-700',
      [DecisionStatus.REVOKED]: 'bg-slate-100 text-slate-700',
    };

    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusConfig[status]}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getPriorityIndicator = (priority: DecisionPriority) => {
    const colors = {
      [DecisionPriority.LOW]: 'text-slate-400',
      [DecisionPriority.MEDIUM]: 'text-blue-400',
      [DecisionPriority.HIGH]: 'text-amber-400',
      [DecisionPriority.CRITICAL]: 'text-red-500',
    };
    return <div className={`w-2 h-2 rounded-full ${colors[priority]}`} />;
  };

  return (
    <div className="flex-1 p-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Hiring Decisions</h2>
            <p className="text-slate-600 text-sm mt-1">Manage recruitment decisions with AI-powered analysis and human oversight</p>
          </div>
          <button
            onClick={() => setShowNewDecisionModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Decision
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by candidate name, position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as DecisionStatus | 'all')}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="all">All Statuses</option>
            <option value={DecisionStatus.DRAFT}>Draft</option>
            <option value={DecisionStatus.PENDING_APPROVAL}>Pending Approval</option>
            <option value={DecisionStatus.APPROVED}>Approved</option>
            <option value={DecisionStatus.IN_EXECUTION}>In Execution</option>
            <option value={DecisionStatus.COMPLETED}>Completed</option>
          </select>
        </div>
      </div>

      {/* Decisions Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 mt-3">Loading decisions...</p>
        </div>
      ) : filteredDecisions.length === 0 ? (
        <div className="border border-dashed border-slate-300 rounded-lg p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No decisions found</p>
          <p className="text-slate-500 text-sm mt-1">Create a new hiring decision to get started</p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Decision</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Candidate</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Priority</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Created</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDecisions.map((decision, idx) => (
                <tr key={decision.id} className={idx !== filteredDecisions.length - 1 ? 'border-b border-slate-200' : ''}>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{decision.title}</p>
                      <p className="text-sm text-slate-500 mt-1">{decision.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{decision.candidateName || '-'}</p>
                    <p className="text-sm text-slate-500">{decision.position || '-'}</p>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(decision.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getPriorityIndicator(decision.priority)}
                      <span className="text-sm text-slate-600">{decision.priority}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{new Date(decision.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/recruitment/${decision.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      View Details →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Decision Modal */}
      {showNewDecisionModal && (
        <NewDecisionModal onClose={() => setShowNewDecisionModal(false)} onCreateDecision={loadDecisions} />
      )}
    </div>
  );
}

function NewDecisionModal({ onClose, onCreateDecision }: { onClose: () => void; onCreateDecision: () => void }) {
  const [formData, setFormData] = useState({
    candidateName: '',
    positionTitle: '',
    department: '',
    seniority: 'mid' as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Call /api/decisions/create
    console.log('Creating decision:', formData);
    onCreateDecision();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Create New Hiring Decision</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Candidate Name</label>
            <input
              type="text"
              required
              value={formData.candidateName}
              onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Jane Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
            <input
              type="text"
              required
              value={formData.positionTitle}
              onChange={(e) => setFormData({ ...formData, positionTitle: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Senior Engineer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
            <input
              type="text"
              required
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Engineering"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Seniority Level</label>
            <select
              value={formData.seniority}
              onChange={(e) => setFormData({ ...formData, seniority: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="junior">Junior</option>
              <option value="mid">Mid-Level</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Create Decision
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
