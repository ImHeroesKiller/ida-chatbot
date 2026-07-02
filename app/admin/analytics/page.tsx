import { AdminAnalyticsShell } from "@/components/admin/admin-analytics-shell";
import { WorkflowAnalyticsDashboardLazy } from "@/components/admin/workflow-analytics-dashboard-lazy";
import {
  isAdminAuthenticated,
  isAdminConfigured,
} from "@/lib/admin/auth";

export const metadata = {
  title: "IDA Workflow Analytics",
  robots: { index: false, follow: false },
};

export default async function AdminAnalyticsPage() {
  const configured = isAdminConfigured();
  const authenticated = configured ? await isAdminAuthenticated() : false;

  return (
    <AdminAnalyticsShell
      configured={configured}
      initialAuthenticated={authenticated}
    >
      <WorkflowAnalyticsDashboardLazy showBackLink={false} />
    </AdminAnalyticsShell>
  );
}