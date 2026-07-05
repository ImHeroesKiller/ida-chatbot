'use client';

/**
 * Recruitment Dashboard (Placeholder)
 * 
 * MVP Placeholder - Full recruitment feature will be implemented after core stability.
 */

import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function RecruitmentDashboard() {
  return (
    <div className="flex-1 p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Hiring Decisions</h2>
            <p className="text-slate-600 text-sm mt-1">Manage recruitment decisions with AI-powered analysis and human oversight</p>
          </div>
          <button
            disabled
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium opacity-50 cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            New Decision (Coming Soon)
          </button>
        </div>
      </div>

      <div className="border border-dashed border-slate-300 rounded-lg p-12 text-center">
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Recruitment Module - Under Development</h3>
          <p className="text-slate-600 mb-4">
            The full recruitment decision system (with AI screening, document generation, and approval workflow) is being stabilized.
          </p>
          <p className="text-sm text-slate-500">
            Core Decision Engine and Governance features are already available in <code className="bg-slate-100 px-1 rounded">/core</code>.
          </p>
          <div className="mt-6">
            <Link 
              href="/" 
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
