import Link from "next/link";

import { IdaLogo } from "@/components/brand/ida-logo";
import { IDA_CONFIG } from "@/lib/config";
import { LANDING_COPY } from "@/lib/landing/content";

export function LandingFooter() {
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
              {LANDING_COPY.subheadline}
            </p>
          </div>

          <nav
            className="flex flex-col gap-2 text-sm sm:items-end"
            aria-label="Footer"
          >
            <Link
              href="/privacy"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {LANDING_COPY.privacyLink}
            </Link>
            <Link
              href="/terms"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {LANDING_COPY.termsLink}
            </Link>
            <Link
              href="/#sign-in"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {LANDING_COPY.primaryCta}
            </Link>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © 2026 {IDA_CONFIG.name} — Intelligent Digital Assistant. All rights
            reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Asisten AI buatan Indonesia — chat + tools untuk produktivitas harian.
          </p>
        </div>
      </div>
    </footer>
  );
}