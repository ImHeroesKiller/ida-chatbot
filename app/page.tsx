'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navbar */}
      <nav className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-x-3">
            <div className="w-9 h-9 bg-[#0A66C2] rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl tracking-tighter">I</span>
            </div>
            <span className="font-semibold text-2xl tracking-tighter">IDA</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-8 pt-20 pb-16 text-center">
        <h1 className="font-semibold text-6xl tracking-tighter leading-none mb-6">
          Understand your organization<br />as one living system.
        </h1>
        
        <p className="max-w-2xl mx-auto text-2xl text-slate-600 mb-10">
          IDA transforms emails, chats, meetings, documents, and enterprise systems into one living organizational memory that helps leaders make better decisions.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/demo"
            className="px-10 py-4 bg-[#0A66C2] hover:bg-[#0A66C2]/90 transition-colors text-white rounded-3xl font-semibold text-lg flex items-center gap-x-3"
          >
            Launch Interactive Demo
          </Link>
          
          <a 
            href="#"
            className="px-10 py-4 border border-slate-300 hover:bg-slate-50 transition-colors rounded-3xl font-semibold text-lg"
          >
            Book Enterprise Demo
          </a>
        </div>
      </div>

      {/* Preview */}
      <div className="max-w-6xl mx-auto px-8 pb-16">
        <div className="bg-slate-100 border border-slate-200 rounded-3xl p-4">
          <div className="aspect-video bg-white rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-semibold text-slate-700 mb-2">Living Organization Dashboard</div>
              <p className="text-slate-500">One organization. Multiple perspectives. Shared intelligence.</p>
              <Link 
                href="/demo" 
                className="inline-block mt-4 text-[#0A66C2] hover:underline font-medium"
              >
                Click to try the demo →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Value Cards */}
      <div className="max-w-6xl mx-auto px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-8">
            <div className="font-semibold text-xl mb-3">Living Organization</div>
            <p className="text-slate-600">Understand relationships across people, customers, projects, and commitments in one view.</p>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-3xl p-8">
            <div className="font-semibold text-xl mb-3">Executive Intelligence</div>
            <p className="text-slate-600">Know what needs attention, why it matters, and what changed — without opening multiple tools.</p>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-3xl p-8">
            <div className="font-semibold text-xl mb-3">AI Workforce Ready</div>
            <p className="text-slate-600">One organizational memory that can be shared by both human leaders and AI workers.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-8 text-center text-sm text-slate-500">
          Enterprise Operating System for the AI Era
        </div>
      </footer>
    </div>
  );
}
