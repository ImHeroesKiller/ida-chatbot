import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { IDA_CONFIG } from "@/lib/config";

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
}

export function LegalPage({
  title,
  lastUpdated,
  backHref = "/",
  backLabel = "Kembali",
  children,
}: LegalPageProps) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link
            href={backHref}
            className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={backLabel}
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span className="text-sm font-semibold">{IDA_CONFIG.name}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <article className="space-y-8">
          <header className="space-y-2 border-b pb-6">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Terakhir diperbarui: {lastUpdated}
            </p>
          </header>

          <div className="legal-prose space-y-6 text-sm leading-relaxed text-foreground/90 sm:text-base">
            {children}
          </div>

          <footer className="flex flex-wrap gap-4 border-t pt-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground hover:underline">
              Kebijakan Privasi
            </Link>
            <Link href="/terms" className="hover:text-foreground hover:underline">
              Syarat Layanan
            </Link>
            <Link href="/" className="hover:text-foreground hover:underline">
              Beranda
            </Link>
          </footer>
        </article>
      </main>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-foreground sm:text-lg">
        {title}
      </h2>
      <div className="space-y-3 text-muted-foreground">{children}</div>
    </section>
  );
}

export function LegalFooterLinks({ className }: { className?: string }) {
  return (
    <nav
      className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground sm:text-sm ${className ?? ""}`}
      aria-label="Legal"
    >
      <Link href="/privacy" className="hover:text-foreground hover:underline">
        Kebijakan Privasi
      </Link>
      <span aria-hidden className="text-border">
        ·
      </span>
      <Link href="/terms" className="hover:text-foreground hover:underline">
        Syarat Layanan
      </Link>
    </nav>
  );
}