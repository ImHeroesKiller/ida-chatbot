import { randomUUID } from "crypto";

import type { Locale } from "@/lib/config";

export interface SharedWorksheetRecord {
  id: string;
  title: string;
  content: string;
  locale: Locale;
  createdAt: number;
  expiresAt: number;
}

const SHARE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 120_000;

type WorksheetShareGlobal = typeof globalThis & {
  __idaWorksheetShareStore?: Map<string, SharedWorksheetRecord>;
};

function getStore(): Map<string, SharedWorksheetRecord> {
  const globalStore = globalThis as WorksheetShareGlobal;

  if (!globalStore.__idaWorksheetShareStore) {
    globalStore.__idaWorksheetShareStore = new Map();
  }

  return globalStore.__idaWorksheetShareStore;
}

function pruneExpiredShares(): void {
  const now = Date.now();
  const store = getStore();

  for (const [id, record] of store.entries()) {
    if (record.expiresAt <= now) {
      store.delete(id);
    }
  }
}

export function createSharedWorksheet(params: {
  title: string;
  content: string;
  locale: Locale;
}): SharedWorksheetRecord {
  pruneExpiredShares();

  const title = params.title.trim().slice(0, MAX_TITLE_LENGTH) || "Document";
  const content = params.content.trim();

  if (!content) {
    throw new Error("Worksheet content is empty.");
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    throw new Error("Worksheet content is too large to share.");
  }

  const now = Date.now();
  const record: SharedWorksheetRecord = {
    id: randomUUID(),
    title,
    content,
    locale: params.locale,
    createdAt: now,
    expiresAt: now + SHARE_TTL_MS,
  };

  getStore().set(record.id, record);
  return record;
}

export function getSharedWorksheet(id: string): SharedWorksheetRecord | null {
  pruneExpiredShares();

  const record = getStore().get(id);
  if (!record) return null;

  if (record.expiresAt <= Date.now()) {
    getStore().delete(id);
    return null;
  }

  return record;
}