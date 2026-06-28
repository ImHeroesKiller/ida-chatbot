import Link from "next/link";

import { IDA_CONFIG } from "@/lib/config";

export default function SharedWorksheetNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Link tidak ditemukan</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Tautan Worksheet ini tidak ada atau sudah kedaluwarsa. Minta pengirim
        membuat tautan baru dari panel Worksheet.
      </p>
      <Link
        href="/chat"
        className="mt-6 text-sm font-medium text-primary hover:underline"
      >
        Buka {IDA_CONFIG.name}
      </Link>
    </main>
  );
}