import Link from "next/link";
import { Brain, Globe2, MessageSquare, Shield } from "lucide-react";

import { LandingLcpLogo } from "@/components/landing/landing-lcp-logo";
import { LandingLoginLazy } from "@/components/landing/landing-login-lazy";
import { LegalFooterLinks } from "@/components/legal/legal-page";
import { IDA_CONFIG } from "@/lib/config";
import { LANDING_COPY, LANDING_FEATURES } from "@/lib/landing/content";

const FEATURE_ICONS = [Brain, MessageSquare, Globe2, Shield] as const;

export function LandingPageStatic() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LandingLcpLogo />
            <span className="text-sm font-semibold tracking-tight">
              {IDA_CONFIG.name}
            </span>
          </div>
          <nav
            className="flex items-center gap-4 text-sm text-muted-foreground"
            aria-label="Legal"
          >
            <Link href="/privacy" className="hover:text-foreground hover:underline">
              {LANDING_COPY.privacyLink}
            </Link>
            <Link href="/terms" className="hover:text-foreground hover:underline">
              {LANDING_COPY.termsLink}
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {LANDING_COPY.headline}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {LANDING_COPY.subheadline}
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {LANDING_COPY.description}
            </p>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-xl font-semibold tracking-tight sm:text-2xl">
              Fitur Utama
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground">
              IDA dirancang sebagai asisten digital yang andal untuk kebutuhan
              informasi dan produktivitas Anda.
            </p>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2">
              {LANDING_FEATURES.map((feature, index) => {
                const Icon = FEATURE_ICONS[index] ?? Brain;
                return (
                  <li
                    key={feature.title}
                    className="rounded-xl border bg-card p-5 shadow-sm"
                  >
                    <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" aria-hidden />
                    </div>
                    <h3 className="text-base font-semibold">{feature.title}</h3>
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
          id="sign-in"
          className="border-t bg-muted/20 px-4 py-12 sm:px-6 sm:py-16"
        >
          <div className="mx-auto max-w-md space-y-6 text-center">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">
                {LANDING_COPY.signInTitle}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {LANDING_COPY.signInDescription}
              </p>
            </div>
            <LandingLoginLazy />
            <p className="text-xs leading-relaxed text-muted-foreground">
              {LANDING_COPY.privacyNote}{" "}
              <Link href="/terms" className="underline hover:text-foreground">
                {LANDING_COPY.termsLink}
              </Link>{" "}
              dan{" "}
              <Link href="/privacy" className="underline hover:text-foreground">
                {LANDING_COPY.privacyLink}
              </Link>
              .
            </p>
          </div>
        </section>
      </main>

      <footer className="shrink-0 border-t px-4 py-5">
        <LegalFooterLinks />
        <p className="mt-2 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {IDA_CONFIG.name} — Intelligent Digital
          Assistant
        </p>
      </footer>
    </div>
  );
}