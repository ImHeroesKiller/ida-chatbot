import type { ReactNode } from "react";

export default function EnterpriseLayout({ children }: { children: ReactNode }) {
  return <div className="h-dvh max-h-dvh overflow-hidden">{children}</div>;
}