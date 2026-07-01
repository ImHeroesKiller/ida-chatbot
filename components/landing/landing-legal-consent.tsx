"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const consentLinkClass = "underline hover:text-primary";

interface LandingLegalConsentProps {
  className?: string;
}

export function LandingLegalConsent({ className }: LandingLegalConsentProps) {
  const t = useTranslations("Landing.legal");

  return (
    <p className={cn("text-sm leading-relaxed text-muted-foreground", className)}>
      {t.rich("consent", {
        privacy: (chunks) => (
          <Link href="/privacy" className={consentLinkClass}>
            {chunks}
          </Link>
        ),
        terms: (chunks) => (
          <Link href="/terms" className={consentLinkClass}>
            {chunks}
          </Link>
        ),
      })}
    </p>
  );
}

export { consentLinkClass as legalLinkClass };