"use client";

import { AuthProvider } from "@/components/auth/auth-provider";
import { LandingAgentFlowCtaButton } from "@/components/landing/landing-agentflow-cta-button";

interface LandingAgentFlowCtaWithAuthProps {
  className?: string;
}

export function LandingAgentFlowCtaWithAuth({
  className,
}: LandingAgentFlowCtaWithAuthProps) {
  return (
    <AuthProvider>
      <LandingAgentFlowCtaButton className={className} />
    </AuthProvider>
  );
}