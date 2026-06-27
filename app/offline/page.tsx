import type { Metadata } from "next";
import Link from "next/link";

import { IdaLogo } from "@/components/brand/ida-logo";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <IdaLogo size="xl" />
      <div className="max-w-sm space-y-2">
        <h1 className="text-lg font-semibold">{BRAND.name} sedang offline</h1>
        <p className="text-sm text-muted-foreground">
          Periksa koneksi internet Anda, lalu coba lagi.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Kembali ke beranda
      </Link>
    </div>
  );
}