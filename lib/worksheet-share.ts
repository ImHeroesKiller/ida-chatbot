import type { Locale } from "@/lib/config";

export interface CreateWorksheetShareResult {
  id: string;
  url: string;
  expiresAt: number;
}

export async function createWorksheetShare(params: {
  title: string;
  content: string;
  locale: Locale;
}): Promise<CreateWorksheetShareResult> {
  const response = await fetch("/api/worksheet/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = (await response.json().catch(() => null)) as {
    id?: string;
    url?: string;
    expiresAt?: number;
    error?: string;
  } | null;

  if (!response.ok) {
    throw new Error(data?.error ?? "Failed to create share link.");
  }

  if (!data?.id || !data.url || !data.expiresAt) {
    throw new Error("Invalid share response.");
  }

  return {
    id: data.id,
    url: data.url,
    expiresAt: data.expiresAt,
  };
}

export async function copyTextToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export function buildWorksheetShareUrl(id: string): string {
  if (typeof window === "undefined") {
    return `/worksheet/share/${id}`;
  }

  return `${window.location.origin}/worksheet/share/${id}`;
}