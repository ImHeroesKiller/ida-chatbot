'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, Briefcase, TrendingUp, AlertTriangle, Clock, ArrowRight } from 'lucide-react';

export default function DemoPage() {
  const [selectedNode, setSelectedNode] = useState({
    name: 'Ary Wibowo',
    role: 'Founder & CEO',
    health: 'High Engagement',
    comm: 23,
    meetings: 7,
    invoices: 2,
    projects: 5
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans">
      {/* Premium Header */}
      <header className="border-b border-[#E5E7EB] bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-x-4">
            <div className="w-9 h-9 bg-[#2563EB] rounded-2xl flex items-center justify-center text-white font-bold text-xl tracking-tighter">
              I
            </div>
            <div>
              <div className="font-semibold text-2xl tracking-tighter">IDA</div>
              <div className="text-[10px] text-[#64748B] -mt-1">Enterprise OS</div>
            </div>
            <div className="ml-3 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-3xl">
              Investor Demo
            </div>
          </div>

          <div className="flex items-center gap-x-6 text-sm">
            <Link href="/" className="text-[#64748B] hover:text-[#0F172A] transition-colors">← Back to Homepage</Link>
            <button className="px-6 py-2 bg-[#2563EB] text-white rounded-3xl font-medium text-sm hover:bg-[#1E40AF] transition-all">
              Book Enterprise Demo
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Greeting */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="text-[#64748B] text-sm mb-1">Monday, July 06, 2026 • 10:28 AM</div>
            <h1 className="text-6xl font-semibold tracking-tighter text-[#0F172A]">Good morning, Ary</h1>
            <p className="text-2xl text-[#64748B] mt-1">Here are 3 things that need your attention today.</p>
          </div>
          <div className="text-xs px-4 py-2 bg-white border border-[#E5E7EB] rounded-3xl text-[#64748B]">Last updated • just now</div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Left Panel - Priorities */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold tracking-tight">What needs your attention</div>
                <div className="text-xs text-[#64748B]">3 items</div>
              </div>

              {/* Priority Cards */}
              <div className="space-y-4">
                {/* Communication */}
                <div className="bg-white rounded-3xl p-6 border border-[#E5E7EB] hover:border-emerald-200 transition-all group cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <Users size={20} />
                      </div>
                      <div>
                        <div className="font-medium">Communication with PLN</div>
                        <div className="text-xs text-emerald-600">+35% last 24 hours</div>
                      </div>
                    </div>
                    <div className="text-xs text-emerald-600 font-medium">HIGH</div>
                  </div>
                  <div className="text-sm text-[#64748B]">18 new messages</div>
                  <div className="text-xs text-[#94A3B8] mt-1">Last message: 8 minutes ago</div>
                </div>

                {/* Invoice */}
                <div className="bg-white rounded-3xl p-6 border border-[#E5E7EB] hover:border-amber-200 transition-all group cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                        <Briefcase size={20} />
                      </div>
                      <div>
                        <div className="font-medium">Invoice #INV-203</div>
                        <div className="text-xs text-amber-600">Rp 1.2M</div>
                      </div>
                    </div>
                    <div className="text-xs text-amber-600 font-medium">DUE TOMORROW</div>
                  </div>
                  <div className="text-sm text-[#64748B]">From: PT ABC Construction</div>
                </div>

                {/* Stalled Project */}
                <div className="bg-white rounded-3xl p-6 border border-[#E5E7EB] hover:border-red-200 transition-all group cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <div className="font-medium">Project Alpha</div>
                        <div className="text-xs text-red-600">No update for 9 days</div>
                      </div>
                    </div>
                    <div className="text-xs text-red-600 font-medium">STALLED</div>
                  </div>
                  <div className="text-sm text-[#64748B]">Budget Rp 45M • 3 deliverables pending</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <div className="text-xs uppercase tracking-widest text-[#64748B] mb-3">Quick Actions</div>
              <div className="grid grid-cols-2 gap-3">
                <button className="bg-white border border-[#E5E7EB] hover:border-[#2563EB] text-[#0F172A] p-4 rounded-3xl text-left transition-all hover:shadow-sm group">
                  <div className="font-medium">Ask IDA</div>
                  <div className="text-xs text-[#64748B]">Context-aware answers</div>
                </button>
                <button className="bg-white border border-[#E5E7EB] hover:border-[#2563EB] text-[#0F172A] p-4 rounded-3xl text-left transition-all hover:shadow-sm group">
                  <div className="font-medium">Upload Document</div>
                  <div className="text-xs text-[#64748B]">Add to Memory</div>
                </button>
              </div>
            </div>
          </div>

          {/* Center - Living Organization Map */}
          <div className="col-span-12 lg:col-span-5">
            <div className="bg-white rounded-3xl p-8 border border-[#E5E7EB] shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <div className="font-semibold text-2xl tracking-tight">Living Organization</div>
                  <div className="text-[#64748B]">One system. Many connections.</div>
                </div>
                <button className="px-4 py-2 text-sm text-[#64748B] hover:text-[#0F172A] flex items-center gap-1 transition-colors" onClick={() => setSelectedNode({ name: 'Organization Overview', role: 'Healthy', health: '82', comm: 47, meetings: 12, invoices: 8, projects: 5 })}>
                  Reset View
                </button>
              </div>

              <div className="relative h-[420px] flex items-center justify-center">
                {/* Central Node - Ary */}
                <div 
                  onClick={() => setSelectedNode({ name: 'Ary Wibowo', role: 'Founder & CEO', health: 'High Engagement', comm: 23, meetings: 7, invoices: 2, projects: 5 })}
                  className="absolute z-20 bg-white border-2 border-[#2563EB] text-[#2563EB] px-8 py-6 rounded-3xl text-center cursor-pointer hover:scale-105 transition-all shadow-xl"
                >
                  <div className="font-semibold text-xl">Ary Wibowo</div>
                  <div className="text-xs opacity-70">Founder &amp; CEO</div>
                </div>

                {/* PLN */}
                <div 
                  onClick={() => setSelectedNode({ name: 'PLN', role: 'Customer Health', health: '92', comm: 12, meetings: 4, invoices: 3, projects: 2 })}
                  className="absolute left-12 top-12 bg-white border border-[#3B82F6] text-[#3B82F6] px-6 py-4 rounded-3xl text-center cursor-pointer hover:scale-105 transition-all shadow"
                >
                  <div className="font-medium">PLN</div>
                  <div className="text-xs opacity-70">Customer Health 92</div>
                </div>

                {/* Project Alpha */}
                <div 
                  onClick={() => setSelectedNode({ name: 'Project Alpha', role: 'At Risk', health: 'Stalled', comm: 8, meetings: 3, invoices: 1, projects: 1 })}
                  className="absolute right-12 top-12 bg-white border border-[#F59E0B] text-[#F59E0B] px-6 py-4 rounded-3xl text-center cursor-pointer hover:scale-105 transition-all shadow"
                >
                  <div className="font-medium">Project Alpha</div>
                  <div className="text-xs opacity-70">Stalled • 9 days</div>
                </div>

                {/* Finance */}
                <div 
                  onClick={() => setSelectedNode({ name: 'Finance', role: 'On Track', health: '87', comm: 15, meetings: 5, invoices: 12, projects: 3 })}
                  className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-white border border-[#10B981] text-[#10B981] px-6 py-4 rounded-3xl text-center cursor-pointer hover:scale-105 transition-all shadow"
                >
                  <div className="font-medium">Finance</div>
                  <div className="text-xs opacity-70">On Track</div>
                </div>

                {/* Operations */}
                <div className="absolute top-1/2 -left-6 bg-white border border-[#8B5CF6] text-[#8B5CF6] px-5 py-3 rounded-3xl text-center cursor-pointer hover:scale-105 transition-all shadow text-sm">
                  Operations
                </div>

                {/* Sales */}
                <div className="absolute top-1/2 -right-6 bg-white border border-[#EC4899] text-[#EC4899] px-5 py-3 rounded-3xl text-center cursor-pointer hover:scale-105 transition-all shadow text-sm">
                  Sales
                </div>

                {/* Legal */}
                <div className="absolute bottom-8 left-1/3 bg-white border border-[#64748B] text-[#64748B] px-5 py-3 rounded-3xl text-center cursor-pointer hover:scale-105 transition-all shadow text-sm">
                  Legal
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Current Context */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-3xl p-8 border border-[#E5E7EB] shadow-sm h-full flex flex-col">
              <div className="mb-8">
                <div className="text-xs text-[#64748B] mb-1">CURRENT CONTEXT</div>
                <div className="font-semibold text-3xl tracking-tight">{selectedNode.name}</div>
                <div className="text-emerald-600 text-sm mt-1">{selectedNode.role} • {selectedNode.health}</div>
              </div>

              <div className="mb-8">
                <div className="text-xs text-[#64748B] mb-4">DERIVED FROM</div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">✉️</div>
                      <div>Communications</div>
                    </div>
                    <div className="font-medium">{selectedNode.comm}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">📅</div>
                      <div>Meetings</div>
                    </div>
                    <div className="font-medium">{selectedNode.meetings}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">📄</div>
                      <div>Invoices</div>
                    </div>
                    <div className="font-medium">{selectedNode.invoices}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">📋</div>
                      <div>Projects</div>
                    </div>
                    <div className="font-medium">{selectedNode.projects}</div>
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <button className="w-full py-4 bg-[#2563EB] text-white rounded-3xl text-sm font-medium hover:bg-[#1E40AF] transition-all flex items-center justify-center gap-2" onClick={() => alert('Ask IDA about current context')}>
                  <span>Ask IDA</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Metrics */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl p-8 border border-[#E5E7EB]">
            <div className="text-4xl font-semibold text-emerald-600">128</div>
            <div className="text-sm text-[#64748B] mt-1">Active Connections</div>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-[#E5E7EB]">
            <div className="text-4xl font-semibold text-emerald-600">24</div>
            <div className="text-sm text-[#64748B] mt-1">Updates Today</div>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-[#E5E7EB]">
            <div className="text-4xl font-semibold text-amber-600">5</div>
            <div className="text-sm text-[#64748B] mt-1">At Risk Items</div>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-[#E5E7EB]">
            <div className="text-4xl font-semibold text-emerald-600">92%</div>
            <div className="text-sm text-[#64748B] mt-1">Organization Health Score</div>
          </div>
        </div>
      </div>
    </div>
  );
}
