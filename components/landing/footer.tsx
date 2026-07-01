import { getTranslations } from "next-intl/server";

import { IdaLogo } from "@/components/brand/ida-logo";
import { Link } from "@/i18n/navigation";
import { IDA_CONFIG } from "@/lib/config";

export async function LandingFooter() {
  const t = await getTranslations("Landing");

  return (
    <footer className="border-t bg-muted/30 dark:bg-muted/10">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-md space-y-3 text-center sm:text-left">
          <div className="flex items-center justify-center gap-3 sm:justify-start">
            <IdaLogo size="sm" />
            <span className="text-sm font-semibold tracking-tight">
              {IDA_CONFIG.name}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("hero.subtitle")}
          </p>
        </div>

        <div className="mt-8 space-y-4 border-t border-border/60 pt-6">
          <div className="flex flex-wrap justify-center gap-x-6 text-sm text-muted-foreground">
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              {t("legal.privacy")}
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              {t("legal.terms")}
            </Link>
          </div>

          <p className="text-center text-xs text-muted-foreground sm:text-left">
            © 2026 {IDA_CONFIG.name} — Intelligent Digital Assistant. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}