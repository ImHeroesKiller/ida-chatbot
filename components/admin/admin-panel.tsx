"use client";

import {
  Database,
  LayoutDashboard,
  LogOut,
  Palette,
  ScrollText,
  Settings,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { AdminLogin } from "@/components/admin/admin-login";
import { AppearanceTab } from "@/components/admin/appearance-tab";
import { DashboardTab } from "@/components/admin/dashboard-tab";
import { KnowledgeTab } from "@/components/admin/knowledge-tab";
import { LogsTab } from "@/components/admin/logs-tab";
import { ModelsTab } from "@/components/admin/models-tab";
import { SettingsTab } from "@/components/admin/settings-tab";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AdminPanel({
  initialAuthenticated,
  configured,
}: {
  initialAuthenticated: boolean;
  configured: boolean;
}) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [tab, setTab] = useState("dashboard");

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
            Set <code className="font-mono">ADMIN_PASSWORD</code> in your
            environment variables to enable the admin panel.
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
            <Sparkles className="size-5" />
            <div>
              <h1 className="text-base font-semibold">IDA Admin</h1>
              <p className="text-xs text-muted-foreground">
                Dashboard, models, knowledge, appearance, settings & logs
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => void handleLogout()}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="dashboard">
              <LayoutDashboard className="size-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="models">
              <Sparkles className="size-4" />
              Models
            </TabsTrigger>
            <TabsTrigger value="knowledge">
              <Database className="size-4" />
              Knowledge
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="size-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="size-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="logs">
              <ScrollText className="size-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <DashboardTab />
          </TabsContent>
          <TabsContent value="models" className="mt-6">
            <ModelsTab />
          </TabsContent>
          <TabsContent value="knowledge" className="mt-6">
            <KnowledgeTab />
          </TabsContent>
          <TabsContent value="appearance" className="mt-6">
            <AppearanceTab />
          </TabsContent>
          <TabsContent value="settings" className="mt-6">
            <SettingsTab />
          </TabsContent>
          <TabsContent value="logs" className="mt-6">
            <LogsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}