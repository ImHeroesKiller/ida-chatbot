"use client";

import dynamic from "next/dynamic";

const LandingAgentFlowCtaWithAuth = dynamic(
  () =>
    import("@/components/landing/landing-agentflow-cta-with-auth").then(
      (mod) => ({
        default: mod.LandingAgentFlowCtaWithAuth,
      }),
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-12 w-56 animate-pulse rounded-lg bg-primary/20 sm:w-64" />
    ),
  },
);

interface LandingAgentFlowCtaLazyProps {
  className?: string;
}

export function LandingAgentFlowCtaLazy({
  className,
}: LandingAgentFlowCtaLazyProps) {
  return <LandingAgentFlowCtaWithAuth className={className} />;
}