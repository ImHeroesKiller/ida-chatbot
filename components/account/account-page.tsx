"use client";

import { ArrowLeft, Loader2, LogOut } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AccountProfileForm } from "@/components/account/account-profile-form";
import { CustomPromptEditor } from "@/components/account/custom-prompt-editor";
import { useAuth } from "@/components/auth/auth-provider";
import { IdaLogo } from "@/components/brand/ida-logo";
import { LegalFooterLinks } from "@/components/legal/legal-page";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUserProfile } from "@/lib/auth/use-user-profile";
import type { Locale } from "@/lib/config";
import { COPY } from "@/lib/i18n";
import { readStoredLocale } from "@/lib/locale-prefs";

export function AccountPage() {
  const { signOut } = useAuth();
  const {
    user,
    profile,
    googleAvatarUrl,
    displayName,
    avatarUrl,
    isLoading,
    isFetching,
  } = useUserProfile();
  const [locale, setLocale] = useState<Locale>("id");

  const copy = COPY[locale];
  const email = profile?.email ?? user?.email ?? "—";
  const showProfileSpinner = isLoading || (isFetching && !profile);

  useEffect(() => {
    const stored = readStoredLocale();
    if (stored) setLocale(stored);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            href="/chat"
            className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={copy.backToChat}
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex items-center gap-2">
            <IdaLogo size="xs" />
            <h1 className="text-base font-semibold">{copy.profileTitle}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{copy.accountSettingsTitle}</CardTitle>
            <CardDescription>{copy.accountSettingsDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {showProfileSpinner ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <AccountProfileForm
                copy={copy}
                profile={profile}
                displayName={displayName}
                email={email}
                avatarUrl={avatarUrl}
                googleAvatarUrl={googleAvatarUrl}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {showProfileSpinner ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <CustomPromptEditor copy={copy} profile={profile} />
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/chat"
            className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {copy.backToChat}
          </Link>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => void signOut()}
          >
            <LogOut className="size-4" />
            {copy.logout}
          </Button>
        </div>

        <LegalFooterLinks className="justify-start" />
      </main>
    </div>
  );
}