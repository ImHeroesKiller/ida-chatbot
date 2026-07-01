"use client";

import { LineChart, LogOut, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

import { AdminLogin } from "@/components/admin/admin-login";
import { Button } from "@/components/ui/button";

export function AdminAnalyticsShell({
  initialAuthenticated,
  configured,
  children,
}: {
  initialAuthenticated: boolean;
  configured: boolean;
  children: React.ReactNode;
}) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    toast.success("Signed out.");
  };

  if (!configured) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-semibold">Admin not configured</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Set <code className="font-mono">ADMIN_PASSWORD</code> to enable
            analytics.
          </p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <AdminLogin onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <div className="min-h-dvh overflow-y-auto bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <LineChart className="size-5" />
            <div>
              <h1 className="text-base font-semibold">IDA Workflow Analytics</h1>
              <p className="text-xs text-muted-foreground">
                Admin dashboard — executions, agents, sessions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm hover:bg-muted"
            >
              <Sparkles className="size-4" />
              Admin home
            </Link>
            <Button variant="outline" size="sm" onClick={() => void handleLogout()}>
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}