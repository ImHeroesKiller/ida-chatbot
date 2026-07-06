import { Suspense } from "react";

import {
  ArrowRight,
  Users,
  ShieldCheck,
  Target,
  Clock,
  TrendingUp,
  Brain,
  Bot,
  GitBranch,
  Award,
} from "lucide-react";

import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { LandingFooter } from "@/components/landing/footer";
import { LandingHeaderActionsLazy } from "@/components/landing/landing-header-actions-lazy";
import { LandingLcpLogo } from "@/components/landing/landing-lcp-logo";
import NextLink from "next/link";

import { Link } from "@/i18n/navigation";
import { IDA_CONFIG } from "@/lib/config";

export async function LandingPageStatic() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <LandingLcpLogo />
            <div className="leading-tight">
              <span className="block text-sm font-semibold tracking-tight">
                {IDA_CONFIG.name}
              </span>
              <span className="hidden text-[11px] text-muted-foreground sm:block">
                Enterprise Decision Platform
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Suspense fallback={null}>
              <LocaleSwitcher />
            </Suspense>
            <LandingHeaderActionsLazy />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden border-b px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/12 via-background to-background" aria-hidden />

          <div className="relative mx-auto max-w-5xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm sm:text-sm">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Enterprise Decision &amp; Digital Workforce OS
            </div>

            <h1 className="text-balance text-4xl font-bold tracking-tighter sm:text-5xl lg:text-[3.4rem] lg:leading-[1.05]">
              See your entire organization.<br className="hidden sm:block" /> Decide with confidence.
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground sm:text-xl">
              IDA unifies organizational knowledge, executive intelligence, and governed execution — so leaders understand what matters in seconds, not weeks.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
              <span><strong className="font-semibold text-foreground">147</strong> indexed relationships</span>
              <span className="hidden sm:inline text-border">|</span>
              <span><strong className="font-semibold text-foreground">91%</strong> org intelligence score</span>
              <span className="hidden sm:inline text-border">|</span>
              <span>Built for energy, telecom &amp; infrastructure</span>
            </div>

            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <NextLink
                href="/demo"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25 active:scale-[0.985]"
              >
                Enter Enterprise Platform
                <ArrowRight className="size-4" />
              </NextLink>
              <Link href="#platform" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border bg-card/60 px-8 text-base font-medium text-foreground transition-all hover:border-border hover:bg-muted">
                Platform capabilities
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <p className="mt-5 text-xs text-muted-foreground sm:text-sm">
              Understand the product in under 60 seconds — no setup required.
            </p>
          </div>
        </section>

        {/* WHY SHOULD I CARE? */}
        <section className="border-b px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Modern organizations face a quiet crisis.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                They have more data, more tools, and more people than ever — yet decision-making remains slow, fragmented, and difficult to govern.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Target, title: "Decisions lack context", desc: "Critical choices are often made without complete visibility into knowledge, history, or downstream impact." },
                { icon: Clock, title: "Execution is fragmented", desc: "From decision to action, organizations lose significant time in handoffs, approvals, and coordination across systems." },
                { icon: Users, title: "Human judgment is underutilized", desc: "Skilled professionals spend too much time on repetitive coordination instead of high-value strategic work." },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="rounded-2xl border bg-card/50 p-8">
                    <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-6" />
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight">{item.title}</h3>
                    <p className="mt-3 text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* WHAT PROBLEM DO EXISTING SYSTEMS CREATE? */}
        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Existing enterprise systems digitize work.<br />They rarely orchestrate intelligence.
            </h2>
            <div className="mt-8 space-y-5 text-lg leading-relaxed text-muted-foreground">
              <p>
                ERP, CRM, and workflow tools have transformed how organizations record and process transactions. However, they were not designed to connect knowledge across systems, govern complex decisions, or coordinate human and digital work at scale.
              </p>
              <p>
                The result is a growing gap: organizations have more information than ever, but less clarity on what to do with it.
              </p>
            </div>
          </div>
        </section>

        {/* WHY AI ALONE IS NOT ENOUGH */}
        <section className="border-y bg-muted/30 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              AI without enterprise context remains a tool, not a system.
            </h2>
            <div className="mt-8 space-y-5 text-lg leading-relaxed text-muted-foreground">
              <p>
                Generative AI can produce impressive outputs in isolation. However, without deep integration into organizational knowledge, governance frameworks, decision history, and existing workflows, it cannot reliably support mission-critical enterprise operations.
              </p>
              <p>
                True enterprise transformation requires more than intelligence — it requires memory, accountability, and coordinated execution.
              </p>
            </div>
          </div>
        </section>

        {/* WHY IDA EXISTS */}
        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Technology should amplify human judgment, not replace it.
            </h2>
            <div className="mt-8 space-y-5 text-lg leading-relaxed text-muted-foreground">
              <p>
                In every organization, there are two essential types of work: high-value human judgment and repetitive operational execution.
              </p>
              <p>
                IDA exists to give leaders and teams the clarity and context they need to make excellent decisions — while digital workers handle defined operational work at scale, always under human governance.
              </p>
              <p>
                We connect knowledge, governance, workflows, decisions, and execution into one coherent operating system.
              </p>
            </div>
          </div>
        </section>

        {/* WHAT IS IDA? */}
        <section id="platform" className="scroll-mt-20 border-y bg-muted/30 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                One integrated platform for enterprise decisions and digital work.
              </h2>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Brain, title: "Organizational Knowledge", desc: "A unified memory layer built from communications, meetings, commercial records, and decisions — cross-linked across your enterprise." },
                { icon: Target, title: "Decision Engine", desc: "Structured decision records with AI-supported analysis, human oversight, and complete auditability." },
                { icon: Bot, title: "Digital Workforce", desc: "Specialized digital workers that execute research, document preparation, coordination, and routine operational tasks." },
                { icon: GitBranch, title: "Workflow Orchestration", desc: "Seamless connection of decisions to actions across existing enterprise systems with governance embedded." },
                { icon: ShieldCheck, title: "Governance &amp; Compliance", desc: "Built-in approval workflows, role-based access, decision history, and explainability by design." },
                { icon: TrendingUp, title: "Organizational Intelligence", desc: "Visibility into patterns across decisions, bottlenecks, and opportunities to improve how the organization operates." },
              ].map((pillar, index) => {
                const Icon = pillar.icon;
                return (
                  <div key={index} className="rounded-2xl border bg-background p-8">
                    <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight">{pillar.title}</h3>
                    <p className="mt-4 text-muted-foreground leading-relaxed">{pillar.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* DIGITAL WORKFORCE */}
        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Organizations will increasingly work with both human and digital employees.
                </h2>
                <p className="mt-6 text-lg text-muted-foreground">
                  Digital workers are specialized agents designed to execute defined operational work — research, document generation, initial analysis, and routine coordination — always under clear human governance and accountability.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  "HR Digital Worker", "Finance Digital Worker", "Legal Digital Worker",
                  "Sales Digital Worker", "Procurement Digital Worker", "Operations Digital Worker",
                ].map((role, index) => (
                  <div key={index} className="flex items-center gap-3 rounded-xl border bg-card/50 px-5 py-4">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Users className="size-4" />
                    </div>
                    <span className="font-medium">{role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* GOVERNANCE */}
        <section className="border-y bg-muted/30 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Trust and accountability are built into the platform.
              </h2>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: ShieldCheck, title: "Approval Workflows", desc: "Multi-stage human approval processes with clear ownership and accountability." },
                { icon: Target, title: "Complete Audit Trail", desc: "Every decision, change, and approval is recorded with full traceability and explainability." },
                { icon: Users, title: "Human-in-the-Loop", desc: "AI supports analysis and recommendations. Humans retain final authority and responsibility." },
                { icon: Award, title: "Enterprise Memory", desc: "Organizations learn from past decisions to improve future judgment and reduce repeated mistakes." },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="rounded-2xl border bg-background p-7">
                    <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="font-semibold tracking-tight">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* BUSINESS OUTCOMES */}
        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              What organizations achieve with IDA.
            </h2>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {[
                { title: "Faster, higher-quality decisions", desc: "Leaders make decisions with complete context, clear recommendations, and governance built into the process." },
                { title: "Scalable, governed execution", desc: "Digital workers handle repetitive operational work reliably, allowing human teams to focus on judgment and strategy." },
                { title: "Organizational intelligence", desc: "Visibility into decision patterns, bottlenecks, and opportunities to continuously improve how the organization operates." },
              ].map((outcome, index) => (
                <div key={index} className="rounded-2xl border bg-card/50 p-8 text-left">
                  <h3 className="text-xl font-semibold tracking-tight">{outcome.title}</h3>
                  <p className="mt-4 text-muted-foreground leading-relaxed">{outcome.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ACCESS TO TECHNOLOGY */}
        <section className="border-y bg-muted/20 px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1 text-xs font-medium text-muted-foreground">
              For Technical Evaluation
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Experience the core technology.
            </h2>
            <p className="mt-4 text-muted-foreground">
              You can access the interface directly to explore IDA&apos;s underlying capabilities for evaluation purposes.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <NextLink
                href="/demo"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Enter Enterprise Platform
                <ArrowRight className="size-4" />
              </NextLink>
              <Link href="/chat" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                Technical evaluation
                <ArrowRight className="size-4" />
              </Link>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Recommended for technical teams and proof-of-concept work.
            </p>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to lead with clarity and precision?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              See how IDA helps enterprise organizations make better decisions and execute at scale.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <NextLink
                href="/demo"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-10 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90"
              >
                Enter Enterprise Platform
              </NextLink>
              <Link href="/contact" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border bg-card/60 px-8 text-base font-medium text-foreground transition-colors hover:bg-muted">
                Speak with our team
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
