import { getTranslations } from "next-intl/server";

import { IdaLogo } from "@/components/brand/ida-logo";
import {
  LandingLegalConsent,
  legalLinkClass,
} from "@/components/landing/landing-legal-consent";
import { Link } from "@/i18n/navigation";
import { IDA_CONFIG } from "@/lib/config";

export async function LandingFooter() {
  const t = await getTranslations("Landing");

  return (
    <footer className="border-t bg-muted/30 dark:bg-muted/10">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-start sm:justify-between">
          <div className="max-w-md space-y-3">
            <div className="flex items-center gap-3">
              <IdaLogo size="sm" />
              <span className="text-sm font-semibold tracking-tight">
                {IDA_CONFIG.name}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("hero.subtitle")}
            </p>
          </div>

          <nav
            className="flex flex-col gap-3 text-sm sm:items-end"
            aria-label="Footer"
          >
            <Link
              href="/#mulai"
              className="font-medium text-foreground hover:text-primary"
            >
              {t("hero.ctaPrimary")}
            </Link>
          </nav>
        </div>

        <div className="mt-8 space-y-4 border-t border-border/60 pt-6">
          <nav
            className="flex flex-wrap items-center gap-x-6 gap-y-2"
            aria-label="Legal"
          >
            <Link href="/privacy" className={legalLinkClass}>
              {t("legal.privacy")}
            </Link>
            <Link href="/terms" className={legalLinkClass}>
              {t("legal.terms")}
            </Link>
          </nav>

          <LandingLegalConsent />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              © 2026 {IDA_CONFIG.name} — Intelligent Digital Assistant. All
              rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}