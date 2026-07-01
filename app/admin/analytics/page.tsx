import { AdminAnalyticsShell } from "@/components/admin/admin-analytics-shell";
import { WorkflowAnalyticsDashboard } from "@/components/admin/workflow-analytics-dashboard";
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
      <WorkflowAnalyticsDashboard showBackLink={false} />
    </AdminAnalyticsShell>
  );
}