"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/components/auth/auth-provider";
import { GoogleIcon } from "@/components/landing/google-icon";
import { Button } from "@/components/ui/button";
import { LANDING_AGENTFLOW } from "@/lib/landing/content";
import { COPY } from "@/lib/i18n";
import { isSupabaseBrowserConfigured } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const AGENT_PATH = "/agent";

interface LandingAgentFlowCtaButtonProps {
  className?: string;
}

export function LandingAgentFlowCtaButton({
  className,
}: LandingAgentFlowCtaButtonProps) {
  const copy = COPY.id;
  const { user, signInWithGoogle, loading: authLoading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const supabaseReady = isSupabaseBrowserConfigured();
  const busy = signingIn || authLoading;

  const handleLogin = useCallback(async () => {
    if (!supabaseReady) {
      toast.error(
        "Supabase belum dikonfigurasi. Set NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
      return;
    }

    setSigningIn(true);

    try {
      await signInWithGoogle({ next: AGENT_PATH });
    } catch (error) {
      console.error("[IDA AgentFlow login]", error);
      toast.error(copy.authError);
      setSigningIn(false);
    }
  }, [copy.authError, signInWithGoogle, supabaseReady]);

  if (user) {
    return (
      <Link
        href={AGENT_PATH}
        className={cn(
          "inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90",
          className,
        )}
      >
        {LANDING_AGENTFLOW.cta}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    );
  }

  return (
    <Button
      type="button"
      onClick={() => void handleLogin()}
      disabled={busy || !supabaseReady}
      className={cn(
        "h-12 gap-2 px-8 text-base font-semibold shadow-lg shadow-primary/25",
        className,
      )}
      size="lg"
    >
      <GoogleIcon className="size-4" />
      {busy ? "Redirecting..." : LANDING_AGENTFLOW.cta}
      {!busy ? <ArrowRight className="size-4" aria-hidden /> : null}
    </Button>
  );
}