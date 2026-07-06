'use client'

import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">IDA</span>
            </div>
            <span className="font-semibold text-xl tracking-tight">IDA</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center border rounded-full px-1 py-1 text-sm">
              <Link href="/id" className="px-3 py-1 rounded-full hover:bg-slate-100">ID</Link>
              <Link href="/en" className="px-3 py-1 rounded-full bg-black text-white">EN</Link>
            </div>

            <Link 
              href="/demo" 
              className="px-5 py-2.5 bg-black text-white rounded-2xl text-sm font-medium hover:bg-zinc-800 transition"
            >
              Try IDA Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-6xl md:text-7xl font-semibold tracking-tighter leading-none">
          Your Organization.<br />
          Your Digital Workforce.<br />
          One Intelligence.
        </h1>
        <p className="mt-6 text-2xl text-slate-600 max-w-3xl mx-auto">
          IDA is the operating system that lets every team work with the same living memory of the company.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/demo" 
            className="inline-flex items-center justify-center px-8 py-4 bg-black text-white rounded-3xl text-lg font-medium hover:bg-zinc-800 transition"
          >
            Enter Enterprise Platform <span className="ml-2">→</span>
          </Link>
          <Link 
            href="/demo" 
            className="inline-flex items-center justify-center px-8 py-4 border border-slate-300 rounded-3xl text-lg font-medium hover:bg-slate-50 transition"
          >
            Watch 60-Second Demo
          </Link>
        </div>

        <div className="mt-6 inline-flex items-center gap-2 text-sm text-slate-500">
          <div className="px-3 py-1 bg-slate-100 rounded-full">4 questions answered</div>
        </div>
      </section>

      {/* What is IDA? */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t">
        <h2 className="text-4xl font-semibold tracking-tight">What Is IDA?</h2>
        <p className="mt-4 text-xl text-slate-600 max-w-3xl">
          IDA is not another AI chat. It is the shared intelligence layer that connects people, data, and digital workers across your entire organization.
        </p>
      </section>

      {/* Built for the Whole Organization */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t">
        <h2 className="text-4xl font-semibold tracking-tight">Built for the Whole Organization</h2>
        <p className="mt-4 text-xl text-slate-600">
          From the CEO to the project team, from finance to sales — everyone works from the same up-to-date memory.
        </p>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-3xl">
            <h3 className="font-semibold text-lg">Leadership</h3>
            <p className="mt-2 text-slate-600">See organization health, risks, and opportunities in one view.</p>
          </div>
          <div className="p-6 border rounded-3xl">
            <h3 className="font-semibold text-lg">Finance & Operations</h3>
            <p className="mt-2 text-slate-600">Track commitments, cash flow, and execution in real time.</p>
          </div>
          <div className="p-6 border rounded-3xl">
            <h3 className="font-semibold text-lg">Sales & Customer Teams</h3>
            <p className="mt-2 text-slate-600">Understand every account, relationship, and upcoming renewal.</p>
          </div>
        </div>
      </section>

      {/* How IDA Works */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t">
        <h2 className="text-4xl font-semibold tracking-tight mb-10">How IDA Works</h2>

        <div className="space-y-10">
          <div>
            <h3 className="font-semibold text-2xl">One Organization Memory</h3>
            <p className="mt-2 text-lg text-slate-600">Every email, document, meeting, and decision is connected in one place.</p>
          </div>
          <div>
            <h3 className="font-semibold text-2xl">Multiple Human Perspectives</h3>
            <p className="mt-2 text-lg text-slate-600">CEO, CFO, Sales, Project Manager, and HR each see the information they need.</p>
          </div>
          <div>
            <h3 className="font-semibold text-2xl">Digital Workforce</h3>
            <p className="mt-2 text-lg text-slate-600">AI workers handle analysis, drafting, and monitoring — so humans can focus on decisions.</p>
          </div>
        </div>
      </section>

      {/* Why Different */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t text-center">
        <h2 className="text-4xl font-semibold tracking-tight">Why IDA Is Different</h2>
        <p className="mt-4 text-xl text-slate-600 max-w-2xl mx-auto">
          Most AI tools help individuals. IDA helps the entire organization think and act together.
        </p>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center border-t">
        <Link 
          href="/demo" 
          className="inline-flex items-center justify-center px-10 py-4 bg-black text-white rounded-3xl text-xl font-medium hover:bg-zinc-800 transition"
        >
          Start Free Enterprise Demo
        </Link>
        <p className="mt-4 text-sm text-slate-500">No credit card required • Ready in under 2 minutes</p>
      </section>
    </div>
  )
}
