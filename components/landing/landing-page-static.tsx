import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

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
} from "lucide-react";

import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { LandingFooter } from "@/components/landing/footer";
import { LandingChatMockup } from "@/components/landing/landing-chat-mockup";
import {
  LandingBenefitVisual,
  type BenefitVisualKey,
} from "@/components/landing/landing-benefit-visual";
import { LandingAgentFlowMockup } from "@/components/landing/landing-agentflow-mockup";
import { LandingAgentFlowCtaLazy } from "@/components/landing/landing-agentflow-cta-lazy";
import { LandingCtaLazy } from "@/components/landing/landing-cta-lazy";
import { LandingHeaderActionsLazy } from "@/components/landing/landing-header-actions-lazy";
import { LandingLcpLogo } from "@/components/landing/landing-lcp-logo";
import { LandingLoginLazy } from "@/components/landing/landing-login-lazy";
import { Link } from "@/i18n/navigation";
import { IDA_CONFIG } from "@/lib/config";
import { cn } from "@/lib/utils";

const FEATURE_ITEMS = [
  { id: "worksheet", icon: FileText, key: "worksheet" },
  { id: "webSearch", icon: Globe2, key: "webSearch" },
  { id: "research", icon: Search, key: "research" },
  { id: "map", icon: Map, key: "map" },
] as const;

const BENEFIT_VISUALS: BenefitVisualKey[] = [
  "workflow",
  "export",
  "security",
  "language",
];

export async function LandingPageStatic() {
  const t = await getTranslations("Landing");
  const benefitItems = t.raw("benefits.items") as string[];
  const steps = t.raw("howItWorks.steps") as string[];

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
                {t("hero.badge")}
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
                {t("hero.badge")}
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                {t("hero.title")}
              </h1>

              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground lg:mx-0">
                {t("hero.subtitle")}
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <LandingCtaLazy variant="hero" />
                <Link
                  href="#tools"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border bg-card/60 px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:text-base"
                >
                  {t("hero.ctaSecondary")}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>

              <p className="mt-5 text-xs text-muted-foreground sm:text-sm">
                {t("hero.trustLine")}
              </p>
            </div>

            <LandingChatMockup />
          </div>
        </section>

        <section
          id="tools"
          className="scroll-mt-20 border-b bg-gradient-to-b from-primary/[0.06] via-primary/[0.03] to-background px-4 py-14 sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                {t("features.title")}
              </h2>
            </div>

            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:gap-6">
              {FEATURE_ITEMS.map((feature) => {
                const Icon = feature.icon;
                return (
                  <li
                    key={feature.id}
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
                        {t(`features.${feature.key}.title`)}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {t(`features.${feature.key}.desc`)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section
          id="benefits"
          className="scroll-mt-20 px-4 py-14 sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {t("benefits.title")}
              </h2>
            </div>

            <ul className="mt-12 grid gap-5 sm:grid-cols-2">
              {benefitItems.map((item, index) => (
                <li
                  key={item}
                  className="flex gap-4 rounded-2xl border bg-card/50 p-5 dark:bg-card/30"
                >
                  <LandingBenefitVisual
                    variant={BENEFIT_VISUALS[index] ?? "workflow"}
                  />
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
                    <CheckCircle2
                      className="size-4 shrink-0 text-primary sm:hidden"
                      aria-hidden
                    />
                    <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
                      {item}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="how-it-works"
          className="scroll-mt-20 border-y bg-muted/25 px-4 py-14 dark:bg-muted/10 sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {t("howItWorks.title")}
              </h2>
            </div>

            <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <li
                  key={step}
                  className="relative rounded-2xl border bg-background p-6 shadow-sm"
                >
                  <span className="mb-4 flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="agentflow"
          className="scroll-mt-20 border-y bg-muted/20 px-4 py-14 dark:bg-muted/10 sm:px-6 sm:py-20"
        >
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="order-2 lg:order-1">
              <LandingAgentFlowMockup />
            </div>

            <div className="order-1 space-y-5 lg:order-2">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Bot className="size-5" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t("agentFlow.badge")}</p>
                  <p className="text-xs text-muted-foreground">AgentFlow</p>
                </div>
              </div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {t("agentFlow.title")}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t("agentFlow.description")}
              </p>
              <LandingAgentFlowCtaLazy className="h-10 rounded-xl px-4 text-sm" />
            </div>
          </div>
        </section>

        <section
          id="sign-in"
          className="scroll-mt-20 border-t bg-gradient-to-b from-primary/[0.05] to-background px-4 py-14 sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-md text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("signIn.title")}
            </h2>
            <p className="mx-auto mt-2 text-sm text-muted-foreground">
              {t("signIn.description")}
            </p>
            <div className="mt-6">
              <LandingLoginLazy />
            </div>
            <LandingLegalConsent className="mx-auto mt-4 max-w-md text-center" />
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}