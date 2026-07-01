"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

const linkClass =
  "font-medium underline transition-colors hover:text-primary";

export function LandingLegalConsent() {
  const t = useTranslations("Landing.legal");

  return (
    <p className="mx-auto max-w-md text-center text-xs text-muted-foreground">
      {t.rich("consent", {
        privacy: () => (
          <Link href="/privacy" className={linkClass}>
            {t("privacy")}
          </Link>
        ),
        terms: () => (
          <Link href="/terms" className={linkClass}>
            {t("terms")}
          </Link>
        ),
      })}
    </p>
  );
}