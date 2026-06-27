"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { isSupabaseBrowserConfigured } from "@/lib/supabase/client";
import { LANDING_COPY } from "@/lib/landing/content";
import { COPY } from "@/lib/i18n";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function LandingLoginAuth() {
  const copy = COPY.id;
  const { user, signInWithGoogle, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [signingIn, setSigningIn] = useState(false);
  const supabaseReady = isSupabaseBrowserConfigured();
  const authError = searchParams.get("error") === "auth";
  const nextPath = searchParams.get("next");
  const chatHref = nextPath?.startsWith("/chat") ? nextPath : "/chat";

  useEffect(() => {
    if (authError) {
      toast.error(copy.authError);
    }
  }, [authError, copy.authError]);

  const handleLogin = async () => {
    if (!supabaseReady) {
      toast.error(
        "Supabase belum dikonfigurasi. Set NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
      return;
    }

    setSigningIn(true);

    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("[IDA login]", error);
      toast.error(copy.authError);
      setSigningIn(false);
    }
  };

  if (user) {
    return (
      <div className="space-y-3 rounded-xl border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Anda sudah masuk. Lanjutkan ke chat room IDA.
        </p>
        <Link
          href={chatHref}
          className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {LANDING_COPY.continueToChat}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
      {authError && (
        <p className="text-center text-xs text-destructive">{copy.authError}</p>
      )}
      {!supabaseReady && (
        <p className="text-xs text-amber-600">
          NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY belum diset.
          Login tidak tersedia.
        </p>
      )}
      <Button
        className="w-full gap-2"
        size="lg"
        onClick={() => void handleLogin()}
        disabled={signingIn || authLoading || !supabaseReady}
      >
        <GoogleIcon />
        {signingIn ? "Redirecting..." : LANDING_COPY.googleSignInLabel}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        {copy.loginSubtitle}
      </p>
    </div>
  );
}