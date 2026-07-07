import { Suspense } from "react";

import {
  ArrowRight,
  Brain,
  LayoutDashboard,
  Network,
  ShieldCheck,
  Users,
} from "lucide-react";

import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { LandingFooter } from "@/components/landing/footer";
import { LandingHeaderActionsLazy } from "@/components/landing/landing-header-actions-lazy";
import { LandingLcpLogo } from "@/components/landing/landing-lcp-logo";
import NextLink from "next/link";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

import { IDA_CONFIG } from "@/lib/config";
import { routes } from "@/lib/routes";

// Note: This is a Server Component. For dynamic locale-aware routes,
// we would normally get locale from params. For now we use a placeholder.
// In production, pass locale from parent or use getLocale().
const DEFAULT_LOCALE = 'en' as const;

export function LandingPageStatic() {
  const t = useTranslations("Landing");

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
                {t("hero.subtitle")}
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
        <section className="relative overflow-hidden border-b px-4 py-16 sm:px-6 sm:py-20">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/12 via-background to-background"
            aria-hidden
          />

          <div className="relative mx-auto max-w-4xl text-center">
            <h1 className="text-balance text-4xl font-bold tracking-tighter sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
              {t("hero.title")}
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
              {t("hero.subtitle")}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <NextLink
                href={routes.demo(DEFAULT_LOCALE)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.985]"
              >
                {t("hero.ctaPrimary")}
                <ArrowRight className="size-4" />
              </NextLink>
              <Link
                href="#four-questions"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border bg-card/60 px-8 text-base font-medium transition-colors hover:bg-muted"
              >
                {t("hero.ctaSecondary")}
              </Link>
            </div>
          </div>
        </section>

        {/* 4 QUESTIONS */}
        <section id="four-questions" className="scroll-mt-20 border-b bg-muted/20 px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-4xl">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-primary">
              {t("fourQuestions.badge")}
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[ "what", "who", "whyNot", "outcome" ].map((key) => (
                <div key={key} className="rounded-2xl border bg-background p-6">
                  <h2 className="text-base font-semibold">{t(`fourQuestions.${key}.question`)}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(`fourQuestions.${key}.answer`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRUST SIGNALS */}
        <section className="border-b px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-4 sm:grid-cols-3">
              {[ "enterprise", "human", "audit" ].map((key) => (
                <div
                  key={key}
                  className="flex items-start gap-3 rounded-2xl border bg-card/50 p-5"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    <ShieldCheck className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{t(`trustSignals.${key}.label`)}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {t(`trustSignals.${key}.detail`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ENTERPRISE SCALE */}
        <section className="border-b px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              {t("scale.title")}
            </h2>
            <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { value: "2.4M+", label: "Records indexed" },
                { value: "Rp 6.5B", label: "Pipeline managed" },
                { value: "147", label: "Relationships" },
                { value: "91%", label: "Org health score" },
              ].map((m) => (
                <div key={m.label} className="rounded-2xl border bg-card/50 p-5 text-center">
                  <div className="text-2xl font-bold tracking-tight text-primary">{m.value}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHAT YOU SEE IN THE DEMO */}
        <section id="platform" className="scroll-mt-20 border-b bg-muted/20 px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              {t("demo.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
              {t("demo.subtitle")}
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-3">
              {[ 
                { icon: LayoutDashboard, key: "executiveBrief" },
                { icon: Network, key: "livingOrganization" },
                { icon: Brain, key: "knowledge" }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.key} className="rounded-2xl border bg-background p-6">
                    <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="font-semibold">{t(`demo.${item.key}.title`)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {t(`demo.${item.key}.desc`)}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-10 flex justify-center">
              <NextLink
                href={routes.demo(DEFAULT_LOCALE)}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-7 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t("demo.cta")}
                <ArrowRight className="size-4" />
              </NextLink>
            </div>
          </div>
        </section>

        {/* WHO IT'S FOR */}
        <section className="px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1 text-xs font-medium text-muted-foreground">
              <Users className="size-3.5" />
              {t("whoFor.badge")}
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("whoFor.title")}
            </h2>
            <p className="mt-4 text-muted-foreground">
              {t("whoFor.subtitle")}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <NextLink
                href={routes.demo(DEFAULT_LOCALE)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-10 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90"
              >
                {t("whoFor.ctaPrimary")}
              </NextLink>
              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border bg-card/60 px-8 text-base font-medium transition-colors hover:bg-muted"
              >
                {t("whoFor.ctaSecondary")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}