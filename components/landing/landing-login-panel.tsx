"use client";

import { AuthProvider } from "@/components/auth/auth-provider";
import { LandingLoginAuth } from "@/components/landing/landing-login-auth";

export function LandingLoginPanel() {
  return (
    <AuthProvider>
      <LandingLoginAuth />
    </AuthProvider>
  );
}