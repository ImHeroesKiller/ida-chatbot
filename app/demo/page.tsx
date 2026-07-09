import type { Metadata } from "next";

import { EnterpriseExperience } from "@/components/enterprise/experience/enterprise-experience";

export const metadata: Metadata = {
  title: "IDA Demo — Enterprise Decision Operating System",
  description:
    "Live demo of IDA: Intelligent Decision Automation — the Enterprise Decision Operating System for human and digital workforce.",
};

export default function DemoPage() {
  return <EnterpriseExperience />;
}