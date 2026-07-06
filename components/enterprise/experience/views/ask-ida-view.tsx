"use client";

import { useEnterpriseLocale } from "@/components/enterprise/i18n/enterprise-locale-provider";

import { AskIdaPanel } from "../ask-ida-panel";
import { PageHeader } from "../page-header";

export function AskIdaView() {
  const { t } = useEnterpriseLocale();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("enterprise", "nav.askIda")}
        title={t("enterprise", "workspace.askPageTitle")}
        description={`${t("enterprise", "slogan.core")} ${t("enterprise", "workspace.askDescription")}`}
      />
      <AskIdaPanel />
    </div>
  );
}