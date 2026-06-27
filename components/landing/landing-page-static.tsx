import { LandingLcpLogo } from "@/components/landing/landing-lcp-logo";
import { LandingLoginLazy } from "@/components/landing/landing-login-lazy";
import { LegalFooterLinks } from "@/components/legal/legal-page";
import { IDA_CONFIG } from "@/lib/config";
import { COPY } from "@/lib/i18n";

export function LandingPageStatic() {
  const copy = COPY.id;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mx-auto w-full max-w-md space-y-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <LandingLcpLogo />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {IDA_CONFIG.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {copy.subtitle}
              </p>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              {copy.loginTagline}
            </p>
          </div>

          <LandingLoginLazy />
        </div>
      </div>

      <footer className="shrink-0 border-t px-4 py-5">
        <LegalFooterLinks />
        <p className="mt-2 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {IDA_CONFIG.name}
        </p>
      </footer>
    </div>
  );
}