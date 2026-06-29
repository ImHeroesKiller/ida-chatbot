"use client";

import Link from "next/link";
import { Bot } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { LandingCtaButton } from "@/components/landing/landing-cta-button";
import { LANDING_AGENTFLOW } from "@/lib/landing/content";
import { cn } from "@/lib/utils";

export function LandingHeaderActions() {
  const { user } = useAuth();

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {user ? (
        <Link
          href="/agent"
          className={cn(
            "hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex",
          )}
        >
          <Bot className="size-4" aria-hidden />
          {LANDING_AGENTFLOW.headerLink}
        </Link>
      ) : null}
      <LandingCtaButton variant="header" />
    </div>
  );
}