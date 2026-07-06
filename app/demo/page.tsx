'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DemoPage() {
  const [context, setContext] = useState({
    name: 'Organization Overview',
    type: 'Healthy',
    health: '82',
    derived: { comm: 47, meetings: 12, invoices: 8, projects: 5 }
  });

  const updateContext = (newContext: Record<string, unknown>) => {
    setContext(newContext as typeof context);
  };

  return (
    <>
      {/* Top Bar */}
      <div className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-7xl mx-auto px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-x-3">
            <div className="w-8 h-8 bg-[#0A66C2] rounded-2xl flex items-center justify-center">
              <span className="font-bold">I</span>
            </div>
            <span className="font-semibold text-xl tracking-tighter">IDA</span>
            <div className="text-xs px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-3xl ml-2">Demo</div>
          </div>
          <Link href="/" className="text-sm text-slate-400 hover:text-white">← Back to Homepage</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="font-semibold text-4xl tracking-tighter">Good morning, Ary</h1>
            <p className="text-emerald-400">3 things need your attention today.</p>
          </div>
          <div className="text-xs px-4 py-2 bg-slate-900 rounded-3xl border border-slate-700">Last updated: just now</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Insights */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900 border border-emerald-900/50 rounded-3xl p-5">
              <div className="text-emerald-400 text-xs mb-2">NEEDS YOUR ATTENTION</div>
              <div className="font-semibold">Communication with PLN increased 35%</div>
            </div>
            <div className="bg-slate-900 border border-amber-900/50 rounded-3xl p-5">
              <div className="text-amber-400 text-xs mb-2">DUE TOMORROW</div>
              <div className="font-semibold">Invoice #INV-203 • Rp 1.2M</div>
            </div>
            <div className="bg-slate-900 border border-red-900/50 rounded-3xl p-5">
              <div className="text-red-400 text-xs mb-2">STALLED</div>
              <div className="font-semibold">Project Alpha has no update for 9 days</div>
            </div>
          </div>

          {/* Living Organization Map */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="font-semibold">Living Organization</div>
                <div className="text-xs text-slate-400">One system. Many connections.</div>
              </div>
              <button 
                onClick={() => updateContext({ name: 'Organization Overview', type: 'Healthy', health: '82', derived: { comm: 47, meetings: 12, invoices: 8, projects: 5 } })}
                className="text-xs px-3 py-1 bg-slate-800 rounded-3xl"
              >
                Reset View
              </button>
            </div>

            <div className="relative h-72 flex items-center justify-center">
              {/* Ary */}
              <div 
                onClick={() => updateContext({ name: 'Ary Wibowo', type: 'High Engagement', health: 'Active', derived: { comm: 23, meetings: 7, invoices: 2, projects: 5 } })}
                className="absolute bg-emerald-500/10 border border-emerald-500 text-emerald-400 px-6 py-3 rounded-3xl text-center cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="font-semibold">Ary Wibowo</div>
                <div className="text-xs">Founder &amp; CEO</div>
              </div>

              {/* PLN */}
              <div 
                onClick={() => updateContext({ name: 'PLN', type: 'Customer Health', health: '92', derived: { comm: 12, meetings: 4, invoices: 3, projects: 2 } })}
                className="absolute left-8 top-8 bg-blue-500/10 border border-blue-500 text-blue-400 px-5 py-2.5 rounded-3xl text-sm cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="font-medium">PLN</div>
                <div className="text-xs text-blue-400/70">Customer Health 92</div>
              </div>

              {/* Project Alpha */}
              <div 
                onClick={() => updateContext({ name: 'Project Alpha', type: 'At Risk', health: 'Stalled', derived: { comm: 8, meetings: 3, invoices: 1, projects: 1 } })}
                className="absolute right-8 top-8 bg-purple-500/10 border border-purple-500 text-purple-400 px-5 py-2.5 rounded-3xl text-sm cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="font-medium">Project Alpha</div>
                <div className="text-xs text-purple-400/70">Stalled • 9 days</div>
              </div>

              {/* Finance */}
              <div 
                onClick={() => updateContext({ name: 'Finance', type: 'On Track', health: '87', derived: { comm: 15, meetings: 5, invoices: 12, projects: 3 } })}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-amber-500/10 border border-amber-500 text-amber-400 px-5 py-2.5 rounded-3xl text-sm cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="font-medium">Finance</div>
              </div>
            </div>
          </div>

          {/* Current Context Panel */}
          <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <div className="text-xs text-slate-400 mb-2">CURRENT CONTEXT</div>
            <div className="font-semibold text-2xl mb-1">{context.name}</div>
            <div className="text-sm text-emerald-400 mb-6">{context.type} • {context.health}</div>

            <div className="text-xs text-slate-400 mb-2">DERIVED FROM</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Communications</span> <span className="font-medium">{context.derived.comm}</span></div>
              <div className="flex justify-between"><span>Meetings</span> <span className="font-medium">{context.derived.meetings}</span></div>
              <div className="flex justify-between"><span>Invoices</span> <span className="font-medium">{context.derived.invoices}</span></div>
              <div className="flex justify-between"><span>Projects</span> <span className="font-medium">{context.derived.projects}</span></div>
            </div>

            <div className="mt-8">
              <button 
                onClick={() => alert(`Based on current context (${context.name}):\n\n• 3 open items need attention\n• Communication is healthy\n• One commitment is due tomorrow`)}
                className="w-full py-3 bg-white text-slate-900 rounded-3xl text-sm font-medium"
              >
                Ask IDA
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
