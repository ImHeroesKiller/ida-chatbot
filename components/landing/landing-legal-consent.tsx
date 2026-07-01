"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const legalLinkClass =
  "font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary";

interface LandingLegalConsentProps {
  className?: string;
}

export function LandingLegalConsent({ className }: LandingLegalConsentProps) {
  const t = useTranslations("Landing.legal");

  return (
    <p className={cn("text-sm leading-relaxed text-muted-foreground", className)}>
      {t.rich("consent", {
        privacy: (chunks) => (
          <Link href="/privacy" className={legalLinkClass}>
            {chunks}
          </Link>
        ),
        terms: (chunks) => (
          <Link href="/terms" className={legalLinkClass}>
            {chunks}
          </Link>
        ),
      })}
    </p>
  );
}

export { legalLinkClass };