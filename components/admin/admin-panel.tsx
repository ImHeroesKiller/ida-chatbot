"use client";

import {
  Bot,
  CalendarClock,
  Database,
  LayoutDashboard,
  LineChart,
  Loader2,
  LogOut,
  ShieldCheck,
  Palette,
  ScrollText,
  Settings,
  Sparkles,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

import { AdminLogin } from "@/components/admin/admin-login";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function TabLoadingFallback() {
  return (
    <div className="mt-6 flex min-h-[12rem] items-center justify-center rounded-xl border border-dashed bg-muted/20">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

const DashboardTab = dynamic(
  () =>
    import("@/components/admin/dashboard-tab").then((mod) => ({
      default: mod.DashboardTab,
    })),
  { loading: () => <TabLoadingFallback /> },
);

const ModelsTab = dynamic(
  () =>
    import("@/components/admin/models-tab").then((mod) => ({
      default: mod.ModelsTab,
    })),
  { loading: () => <TabLoadingFallback /> },
);

const AgentModelsTab = dynamic(
  () =>
    import("@/components/admin/agent-models-tab").then((mod) => ({
      default: mod.AgentModelsTab,
    })),
  { loading: () => <TabLoadingFallback /> },
);

const KnowledgeTab = dynamic(
  () =>
    import("@/components/admin/knowledge-tab").then((mod) => ({
      default: mod.KnowledgeTab,
    })),
  { loading: () => <TabLoadingFallback /> },
);

const AppearanceTab = dynamic(
  () =>
    import("@/components/admin/appearance-tab").then((mod) => ({
      default: mod.AppearanceTab,
    })),
  { loading: () => <TabLoadingFallback /> },
);

const SettingsTab = dynamic(
  () =>
    import("@/components/admin/settings-tab").then((mod) => ({
      default: mod.SettingsTab,
    })),
  { loading: () => <TabLoadingFallback /> },
);

const LogsTab = dynamic(
  () =>
    import("@/components/admin/logs-tab").then((mod) => ({
      default: mod.LogsTab,
    })),
  { loading: () => <TabLoadingFallback /> },
);

const WorkflowAnalyticsDashboard = dynamic(
  () =>
    import("@/components/admin/workflow-analytics-dashboard").then((mod) => ({
      default: mod.WorkflowAnalyticsDashboard,
    })),
  { ssr: false, loading: () => <TabLoadingFallback /> },
);

const WorkflowAuditTab = dynamic(
  () =>
    import("@/components/admin/workflow-audit-tab").then((mod) => ({
      default: mod.WorkflowAuditTab,
    })),
  { loading: () => <TabLoadingFallback /> },
);

const WorkflowTriggersTab = dynamic(
  () =>
    import("@/components/admin/workflow-triggers-tab").then((mod) => ({
      default: mod.WorkflowTriggersTab,
    })),
  { loading: () => <TabLoadingFallback /> },
);

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
      <header className="sticky top-0 z-10 border-b border-border/40 ida-glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5" />
            <div>
              <h1 className="text-base font-semibold">IDA Admin</h1>
              <p className="text-xs text-muted-foreground">
                Dashboard, models, knowledge, analytics, settings & logs
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
          <TabsList className="ida-glass-subtle h-auto flex-wrap gap-1 rounded-2xl p-1.5 shadow-sm">
            <TabsTrigger value="dashboard">
              <LayoutDashboard className="size-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="models">
              <Sparkles className="size-4" />
              Models
            </TabsTrigger>
            <TabsTrigger value="agent-models">
              <Bot className="size-4" />
              Agent
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
            <TabsTrigger value="analytics">
              <LineChart className="size-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="workflow-audit">
              <ShieldCheck className="size-4" />
              Workflow Audit
            </TabsTrigger>
            <TabsTrigger value="workflow-triggers">
              <CalendarClock className="size-4" />
              Triggers
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            {tab === "dashboard" ? <DashboardTab /> : null}
            {tab === "models" ? <ModelsTab /> : null}
            {tab === "agent-models" ? <AgentModelsTab /> : null}
            {tab === "knowledge" ? <KnowledgeTab /> : null}
            {tab === "appearance" ? <AppearanceTab /> : null}
            {tab === "settings" ? <SettingsTab /> : null}
            {tab === "logs" ? <LogsTab /> : null}
            {tab === "analytics" ? (
              <>
                <div className="mb-4 flex justify-end">
                  <Link
                    href="/admin/analytics"
                    className="inline-flex h-8 items-center rounded-lg border px-3 text-sm hover:bg-muted"
                  >
                    Open full analytics page
                  </Link>
                </div>
                <WorkflowAnalyticsDashboard showBackLink={false} />
              </>
            ) : null}
            {tab === "workflow-audit" ? <WorkflowAuditTab /> : null}
            {tab === "workflow-triggers" ? <WorkflowTriggersTab /> : null}
          </div>
        </Tabs>
      </main>
    </div>
  );
}