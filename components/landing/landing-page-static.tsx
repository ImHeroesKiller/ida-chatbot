import Link from "next/link";

import { LandingLegalConsent } from "@/components/landing/landing-legal-consent";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  FileText,
  Globe2,
  Map,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";

import { LandingFooter } from "@/components/landing/footer";
import { LandingChatMockup } from "@/components/landing/landing-chat-mockup";
import { LandingAgentFlowCtaLazy } from "@/components/landing/landing-agentflow-cta-lazy";
import { LandingCtaLazy } from "@/components/landing/landing-cta-lazy";
import { LandingHeaderActionsLazy } from "@/components/landing/landing-header-actions-lazy";
import { LandingLcpLogo } from "@/components/landing/landing-lcp-logo";
import { LandingLoginLazy } from "@/components/landing/landing-login-lazy";
import { IDA_CONFIG } from "@/lib/config";
import {
  LANDING_AGENTFLOW,
  LANDING_BENEFITS,
  LANDING_COPY,
  LANDING_STEPS,
  LANDING_TOOLS,
  LANDING_WHY_IDA,
} from "@/lib/landing/content";
import { cn } from "@/lib/utils";

const TOOL_ICONS = {
  worksheet: FileText,
  "web-search": Globe2,
  research: Search,
  map: Map,
} as const;

export function LandingPageStatic() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <LandingLcpLogo />
            <div className="leading-tight">
              <span className="block text-sm font-semibold tracking-tight">
                {IDA_CONFIG.name}
              </span>
              <span className="hidden text-[11px] text-muted-foreground sm:block">
                {LANDING_COPY.badge}
              </span>
            </div>
          </div>
          <LandingHeaderActionsLazy />
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/12 via-background to-background"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-16 top-10 size-72 rounded-full bg-primary/8 blur-3xl"
            aria-hidden
          />

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="text-center lg:text-left">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm sm:text-sm">
                <Sparkles className="size-3.5 text-primary" aria-hidden />
                {LANDING_COPY.badge}
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                {LANDING_COPY.headline}
              </h1>
              <p className="mt-3 text-lg font-medium text-primary/90 sm:text-xl">
                {LANDING_COPY.headlineAccent}
              </p>

              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground lg:mx-0">
                {LANDING_COPY.subheadline}
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <LandingCtaLazy variant="hero" />
                <Link
                  href="#tools"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border bg-card/60 px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:text-base"
                >
                  {LANDING_COPY.heroSecondaryCta}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>

              <p className="mt-5 text-xs text-muted-foreground sm:text-sm">
                {LANDING_COPY.trustLine}
              </p>
            </div>

            <LandingChatMockup />
          </div>
        </section>

        {/* Tools — highlight section */}
        <section
          id="tools"
          className="scroll-mt-20 border-b bg-gradient-to-b from-primary/[0.06] via-primary/[0.03] to-background px-4 py-14 sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-primary">
                  Fitur utama
                </span>
                {LANDING_COPY.toolsTitle}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {LANDING_COPY.toolsSubtitle}
              </p>
            </div>

            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:gap-6">
              {LANDING_TOOLS.map((tool) => {
                const Icon = TOOL_ICONS[tool.id];
                return (
                  <li
                    key={tool.id}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border border-primary/15 bg-card/80 p-6 shadow-md",
                      "transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg",
                      "dark:bg-card/50",
                    )}
                  >
                    <div
                      className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-primary/8 blur-2xl transition-opacity group-hover:opacity-100"
                      aria-hidden
                    />
                    <div className="relative">
                      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                        <Icon className="size-6" aria-hidden />
                      </div>
                      <h3 className="text-xl font-bold tracking-tight">
                        {tool.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {tool.description}
                      </p>
                      <p className="mt-4 flex items-start gap-2 text-sm font-medium text-foreground/90">
                        <Zap
                          className="mt-0.5 size-4 shrink-0 text-primary"
                          aria-hidden
                        />
                        {tool.benefit}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Benefits */}
        <section
          id="benefits"
          className="scroll-mt-20 px-4 py-14 sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {LANDING_COPY.benefitsTitle}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {LANDING_COPY.benefitsSubtitle}
              </p>
            </div>

            <ul className="mt-12 grid gap-5 sm:grid-cols-2">
              {LANDING_BENEFITS.map((item) => (
                <li
                  key={item.title}
                  className="rounded-2xl border bg-card/50 p-6 shadow-sm dark:bg-card/30"
                >
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="scroll-mt-20 border-y bg-muted/25 px-4 py-14 dark:bg-muted/10 sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {LANDING_COPY.howItWorksTitle}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                {LANDING_COPY.howItWorksSubtitle}
              </p>
            </div>

            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {LANDING_STEPS.map((item) => (
                <li
                  key={item.step}
                  className="relative rounded-2xl border bg-background p-6 shadow-sm"
                >
                  <span className="mb-4 flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {item.step}
                  </span>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Why IDA */}
        <section
          id="why-ida"
          className="scroll-mt-20 px-4 py-14 sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {LANDING_COPY.whyIdaTitle}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {LANDING_COPY.whyIdaSubtitle}
                </p>
                <ul className="mt-8 space-y-4">
                  {LANDING_WHY_IDA.map((point) => (
                    <li key={point} className="flex gap-3">
                      <CheckCircle2
                        className="mt-0.5 size-5 shrink-0 text-primary"
                        aria-hidden
                      />
                      <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
                        {point}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Bot className="size-5" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {LANDING_AGENTFLOW.badge}
                    </p>
                    <p className="text-xs text-muted-foreground">AgentFlow</p>
                  </div>
                </div>
                <h3 className="mt-4 text-sm font-semibold leading-relaxed">
                  {LANDING_AGENTFLOW.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {LANDING_AGENTFLOW.description}
                </p>
                <div className="mt-5">
                  <LandingAgentFlowCtaLazy className="h-10 rounded-xl px-4 text-sm" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA + testimonials placeholder */}
        <section
          id="mulai"
          className="scroll-mt-20 border-t bg-gradient-to-b from-primary/[0.05] to-background px-4 py-14 sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-4xl space-y-12 text-center">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                {LANDING_COPY.finalCtaTitle}
              </h2>
              <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {LANDING_COPY.finalCtaSubtitle}
              </p>
              <div className="flex flex-col items-center gap-4 pt-2">
                <LandingCtaLazy variant="section" />
                <LandingLegalConsent className="max-w-lg text-center" />
              </div>
            </div>

            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-muted-foreground">
                {LANDING_COPY.testimonialTitle}
              </h3>
              <ul className="grid gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((index) => (
                  <li
                    key={index}
                    className="rounded-2xl border border-dashed border-border/70 bg-card/40 px-4 py-8 text-sm italic text-muted-foreground"
                  >
                    “{LANDING_COPY.testimonialPlaceholder}”
                  </li>
                ))}
              </ul>
            </div>

            <div
              id="sign-in"
              className="scroll-mt-20 rounded-2xl border bg-card/60 p-6 shadow-sm sm:p-8"
            >
              <h3 className="text-xl font-bold">{LANDING_COPY.signInTitle}</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                {LANDING_COPY.signInDescription}
              </p>
              <div className="mt-6">
                <LandingLoginLazy />
              </div>
              <LandingLegalConsent className="mx-auto mt-4 max-w-md text-center" />
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}