import type { ReactNode } from "react";

/** Demo uses a fixed viewport shell; scroll lives inside EnterpriseDashboard main. */
export default function DemoLayout({ children }: { children: ReactNode }) {
  return <div className="h-dvh max-h-dvh overflow-hidden">{children}</div>;
}