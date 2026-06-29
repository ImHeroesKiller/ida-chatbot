import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  Globe2,
  MessageSquare,
  Shield,
  Sparkles,
} from "lucide-react";

import { LandingFooter } from "@/components/landing/footer";
import { LandingAgentFlowCtaLazy } from "@/components/landing/landing-agentflow-cta-lazy";
import { LandingCtaLazy } from "@/components/landing/landing-cta-lazy";
import { LandingHeaderActionsLazy } from "@/components/landing/landing-header-actions-lazy";
import { LandingLcpLogo } from "@/components/landing/landing-lcp-logo";
import { LandingLoginLazy } from "@/components/landing/landing-login-lazy";
import { IDA_CONFIG } from "@/lib/config";
import {
  LANDING_AGENTFLOW,
  LANDING_COPY,
  LANDING_FEATURES,
} from "@/lib/landing/content";

const FEATURE_ICONS = [Brain, MessageSquare, Globe2, Shield] as const;

export function LandingPageStatic() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
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
        <section className="relative overflow-hidden border-b px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -top-24 right-0 size-72 rounded-full bg-primary/5 blur-3xl"
            aria-hidden
          />

          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm sm:text-sm">
              <Sparkles className="size-3.5 text-primary" aria-hidden />
              {LANDING_COPY.badge}
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {LANDING_COPY.headline}
              <span className="mt-2 block bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-3xl font-semibold text-transparent sm:text-4xl lg:text-5xl">
                {LANDING_COPY.headlineAccent}
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {LANDING_COPY.subheadline}
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground/90">
              {LANDING_COPY.description}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <LandingCtaLazy variant="hero" />
              <Link
                href="#features"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border bg-card/50 px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:text-base"
              >
                {LANDING_COPY.heroSecondaryCta}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>

            <p className="mt-6 text-xs text-muted-foreground sm:text-sm">
              {LANDING_COPY.trustLine}
            </p>
          </div>
        </section>

        <section
          id="features"
          className="scroll-mt-20 px-4 py-14 sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {LANDING_COPY.featuresTitle}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {LANDING_COPY.featuresSubtitle}
              </p>
            </div>

            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:gap-6">
              {LANDING_FEATURES.map((feature, index) => {
                const Icon = FEATURE_ICONS[index] ?? Brain;
                return (
                  <li
                    key={feature.title}
                    className="group rounded-2xl border bg-card/50 p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md dark:bg-card/30"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                        <Icon className="size-5" aria-hidden />
                      </div>
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                        {feature.highlight}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section
          id="agentflow"
          className="scroll-mt-20 border-t bg-gradient-to-b from-primary/[0.04] to-background px-4 py-14 sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:text-sm">
                  <Bot className="size-3.5" aria-hidden />
                  {LANDING_AGENTFLOW.badge}
                </div>

                <div className="space-y-3">
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                    {LANDING_AGENTFLOW.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {LANDING_AGENTFLOW.description}
                  </p>
                </div>

                <ul className="space-y-3">
                  {LANDING_AGENTFLOW.benefits.map((benefit) => (
                    <li key={benefit.title} className="flex gap-3">
                      <CheckCircle2
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        aria-hidden
                      />
                      <div>
                        <p className="text-sm font-medium">{benefit.title}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                          {benefit.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="pt-2">
                  <LandingAgentFlowCtaLazy />
                </div>
              </div>

              <div className="rounded-2xl border border-primary/15 bg-card/60 p-6 shadow-sm backdrop-blur-sm dark:bg-card/30 sm:p-8">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Bot className="size-5" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">AgentFlow AI</p>
                    <p className="text-xs text-muted-foreground">
                      Human-in-the-loop · Sandbox terisolasi
                    </p>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-dashed bg-muted/20 p-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="size-2 rounded-full bg-primary" aria-hidden />
                    <span>Analisis dokumen & validasi</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="size-2 rounded-full bg-primary/70" aria-hidden />
                    <span>Generate proposal workflow</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="size-2 rounded-full bg-primary/40" aria-hidden />
                    <span>Approval → eksekusi sandbox</span>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  Login Google yang sama dengan chat IDA — tanpa akun terpisah.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="sign-in"
          className="scroll-mt-20 border-t bg-muted/30 px-4 py-14 dark:bg-muted/10 sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-lg space-y-8 text-center">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {LANDING_COPY.signInTitle}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {LANDING_COPY.signInDescription}
              </p>
            </div>
            <LandingLoginLazy />
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}