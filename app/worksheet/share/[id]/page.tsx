import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SharedWorksheetView } from "@/components/worksheet/shared-worksheet-view";
import { IDA_CONFIG } from "@/lib/config";
import { getSharedWorksheet } from "@/lib/worksheet-share-store";

interface SharePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { id } = await params;
  const record = getSharedWorksheet(id);

  if (!record) {
    return {
      title: `Shared Worksheet — ${IDA_CONFIG.name}`,
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${record.title} — ${IDA_CONFIG.name}`,
    description: `Shared worksheet document from ${IDA_CONFIG.name}.`,
    robots: { index: false, follow: false },
  };
}

export default async function SharedWorksheetPage({ params }: SharePageProps) {
  const { id } = await params;
  const record = getSharedWorksheet(id);

  if (!record) {
    notFound();
  }

  const expiresLabel = new Intl.DateTimeFormat(
    record.locale === "zh"
      ? "zh-CN"
      : record.locale === "en"
        ? "en-US"
        : "id-ID",
    { dateStyle: "long", timeStyle: "short" },
  ).format(record.expiresAt);

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto mb-6 max-w-3xl text-center text-xs text-muted-foreground">
        <p>
          {record.locale === "zh"
            ? "此为只读共享文档"
            : record.locale === "en"
              ? "Read-only shared document"
              : "Dokumen bersama (hanya baca)"}
        </p>
        <p className="mt-1">
          {record.locale === "zh"
            ? `链接将于 ${expiresLabel} 过期`
            : record.locale === "en"
              ? `Link expires on ${expiresLabel}`
              : `Tautan kedaluwarsa pada ${expiresLabel}`}
        </p>
      </div>

      <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-6 shadow-sm sm:p-10">
        <SharedWorksheetView
          locale={record.locale}
          title={record.title}
          content={record.content}
        />
      </div>
    </main>
  );
}