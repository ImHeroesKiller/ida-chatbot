"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

export const WorkflowAnalyticsDashboardLazy = dynamic(
  () =>
    import("@/components/admin/workflow-analytics-dashboard").then((mod) => ({
      default: mod.WorkflowAnalyticsDashboard,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[16rem] items-center justify-center rounded-xl border border-dashed bg-muted/20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);