/**
 * Recruitment Workspace Layout
 * 
 * Provides navigation, sidebar, and layout structure for the recruitment module.
 * Integrated with core decision engine and governance audit.
 */

import { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight, Users, FileText, CheckCircle2, Clock } from 'lucide-react';

interface RecruitmentLayoutProps {
  children: ReactNode;
}

export default function RecruitmentLayout({ children }: RecruitmentLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Recruitment Workspace</h1>
                <p className="text-sm text-slate-500">Digital Workforce for HR Hiring Decisions</p>
              </div>
            </div>
            <Link
              href="/chat"
              className="text-sm text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Back to Chat
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r border-slate-200 bg-white">
          <nav className="p-6 space-y-2">
            <NavLink href="/recruitment" icon={<FileText className="w-4 h-4" />} label="All Decisions" />
            <NavLink href="/recruitment?status=draft" icon={<Clock className="w-4 h-4" />} label="Draft" />
            <NavLink href="/recruitment?status=pending_approval" icon={<Clock className="w-4 h-4" />} label="Pending Approval" />
            <NavLink href="/recruitment?status=approved" icon={<CheckCircle2 className="w-4 h-4" />} label="Approved" />
          </nav>

          {/* Stats Panel */}
          <div className="p-6 border-t border-slate-200 space-y-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pipeline Overview</div>
            <StatsItem label="In Progress" count={3} color="blue" />
            <StatsItem label="Pending" count={5} color="amber" />
            <StatsItem label="Completed" count={12} color="green" />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-900 transition-colors group"
    >
      <span className="text-slate-400 group-hover:text-blue-600 transition-colors">{icon}</span>
      <span>{label}</span>
      <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

function StatsItem({ label, count, color }: { label: string; count: number; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    green: 'bg-green-50 text-green-700 border-green-200',
  };

  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="text-xs font-medium opacity-75">{label}</div>
      <div className="text-2xl font-bold mt-1">{count}</div>
    </div>
  );
}
