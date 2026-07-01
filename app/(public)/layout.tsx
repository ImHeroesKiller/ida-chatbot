import type { Metadata } from "next";

import { DeferredPwa } from "@/components/performance/deferred-pwa";
import { BRAND } from "@/lib/brand";
import { buildLandingPageMetadata } from "@/lib/seo/landing-metadata";

export const metadata: Metadata = {
  ...buildLandingPageMetadata(),
  applicationName: BRAND.shortName,
  appleWebApp: {
    capable: true,
    title: BRAND.shortName,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": BRAND.shortName,
  },
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-dvh min-h-0 overflow-x-hidden overflow-y-auto overscroll-y-contain">
      {children}
      <DeferredPwa />
    </div>
  );
}