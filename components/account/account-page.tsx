"use client";

import { ArrowLeft, LogOut } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { IdaLogo } from "@/components/brand/ida-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LegalFooterLinks } from "@/components/legal/legal-page";
import type { IdaUserProfile } from "@/lib/auth/user-service";
import { COPY } from "@/lib/i18n";

export function AccountPage() {
  const copy = COPY.id;
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<IdaUserProfile | null>(null);

  useEffect(() => {
    if (!user) return;

    void fetch("/api/auth/profile")
      .then((response) => response.json())
      .then((data: { profile?: IdaUserProfile | null }) => {
        setProfile(data.profile ?? null);
      })
      .catch(() => setProfile(null));
  }, [user]);

  const displayName =
    profile?.fullName ??
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    "User";

  const email = profile?.email ?? user?.email ?? "—";
  const avatarUrl =
    profile?.avatarUrl ??
    (user?.user_metadata?.avatar_url as string | undefined) ??
    undefined;

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link
            href="/chat"
            className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={copy.backToChat}
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex items-center gap-2">
            <IdaLogo size={28} />
            <h1 className="text-base font-semibold">{copy.profileTitle}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-8 sm:px-6">
        <Card>
          <CardHeader className="items-center text-center">
            <Avatar className="size-16">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-lg">{displayName}</CardTitle>
            <CardDescription>{email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 rounded-lg border p-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">{copy.profileName}</p>
                <p className="font-medium">{displayName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{copy.profileEmail}</p>
                <p className="font-medium">{email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{copy.profileUserId}</p>
                <p className="break-all font-mono text-xs">{user?.id ?? "—"}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/chat"
                className="inline-flex h-8 flex-1 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
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

            <LegalFooterLinks className="justify-start pt-2" />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}