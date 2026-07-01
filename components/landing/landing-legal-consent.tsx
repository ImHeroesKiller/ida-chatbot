import Link from "next/link";

import { LANDING_COPY } from "@/lib/landing/content";
import { cn } from "@/lib/utils";

const legalLinkClass =
  "font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary";

interface LandingLegalConsentProps {
  className?: string;
}

export function LandingLegalConsent({ className }: LandingLegalConsentProps) {
  return (
    <p className={cn("text-sm leading-relaxed text-muted-foreground", className)}>
      Dengan menggunakan IDA, kamu menyetujui{" "}
      <Link href="/privacy" className={legalLinkClass}>
        {LANDING_COPY.privacyLink}
      </Link>{" "}
      dan{" "}
      <Link href="/terms" className={legalLinkClass}>
        {LANDING_COPY.termsLink}
      </Link>
      .
    </p>
  );
}

export { legalLinkClass };