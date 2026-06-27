import { AdminPanel } from "@/components/admin/admin-panel";
import {
  isAdminAuthenticated,
  isAdminConfigured,
} from "@/lib/admin/auth";

export const metadata = {
  title: "IDA Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const configured = isAdminConfigured();
  const authenticated = configured ? await isAdminAuthenticated() : false;

  return (
    <AdminPanel
      configured={configured}
      initialAuthenticated={authenticated}
    />
  );
}