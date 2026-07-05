"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { useAuth } from "@/components/auth/auth-provider";
import { GoogleIcon } from "@/components/landing/google-icon";
import { Button } from "@/components/ui/button";
import { resolveAuthRedirect } from "@/lib/auth/redirect";
import { COPY } from "@/lib/i18n";
import { useTranslations } from "next-intl";
import { isSupabaseBrowserConfigured } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type LandingCtaVariant = "header" | "hero" | "section";

interface LandingCtaButtonProps {
  variant?: LandingCtaVariant;
  className?: string;
}

export function LandingCtaButton({
  variant = "hero",
  className,
}: LandingCtaButtonProps) {
  const copy = COPY.id;
  const t = useTranslations("Landing.hero");
  const { user, signInWithGoogle, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [signingIn, setSigningIn] = useState(false);
  const supabaseReady = isSupabaseBrowserConfigured();
  const authError = searchParams.get("error") === "auth";
  const redirectHref = resolveAuthRedirect(searchParams.get("next"));

  useEffect(() => {
    if (authError && variant !== "header") {
      toast.error(copy.authError);
    }
  }, [authError, copy.authError, variant]);

  const handleLogin = useCallback(async () => {
    if (!supabaseReady) {
      toast.error(
        "Supabase belum dikonfigurasi. Set NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
      return;
    }

    setSigningIn(true);

    try {
      // Fix: Use proper redirectTo pointing to our app, not Supabase
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectHref)}`;
      
      await signInWithGoogle({ 
        redirectTo,
        scopes: 'email profile' 
      });
    } catch (error) {
      console.error("[IDA login]", error);
      toast.error(copy.authError);
      setSigningIn(false);
    }
  }, [copy.authError, redirectHref, signInWithGoogle, supabaseReady]);

  if (user) {
    return (
      <Link
        href={redirectHref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          variant === "header" && "h-9 px-4 text-sm",
          variant === "hero" && "h-12 px-8 text-base shadow-lg shadow-primary/20",
          variant === "section" && "h-12 w-full px-6 text-base sm:w-auto",
          className,
        )}
      >
        {t("continueToChat")}
      </Link>
    );
  }

  const label = t("ctaPrimary");
  const busy = signingIn || authLoading;

  return (
    <Button
      type="button"
      onClick={() => void handleLogin()}
      disabled={busy || !supabaseReady}
      className={cn(
        "gap-2 font-semibold",
        variant === "header" && "h-9 px-4 text-sm",
        variant === "hero" && "h-12 px-8 text-base shadow-lg shadow-primary/20",
        variant === "section" && "h-12 w-full px-6 text-base sm:w-auto",
        className,
      )}
      size={variant === "header" ? "sm" : "lg"}
    >
      <GoogleIcon className={variant === "header" ? "size-3.5" : "size-4"} />
      {busy ? "Redirecting..." : label}
    </Button>
  );
}