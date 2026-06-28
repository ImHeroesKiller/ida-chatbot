import { randomUUID } from "crypto";

import type { Locale } from "@/lib/config";
import {
  createSharedWorksheetInDb,
  getSharedWorksheetFromDb,
} from "@/lib/worksheet-share-db";

export interface SharedWorksheetRecord {
  id: string;
  title: string;
  content: string;
  locale: Locale;
  createdAt: number;
  expiresAt: number;
}

export const SHARE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 120_000;

type WorksheetShareGlobal = typeof globalThis & {
  __idaWorksheetShareStore?: Map<string, SharedWorksheetRecord>;
};

function getMemoryStore(): Map<string, SharedWorksheetRecord> {
  const globalStore = globalThis as WorksheetShareGlobal;

  if (!globalStore.__idaWorksheetShareStore) {
    globalStore.__idaWorksheetShareStore = new Map();
  }

  return globalStore.__idaWorksheetShareStore;
}

function pruneExpiredMemoryShares(): void {
  const now = Date.now();
  const store = getMemoryStore();

  for (const [id, record] of store.entries()) {
    if (record.expiresAt <= now) {
      store.delete(id);
    }
  }
}

function createSharedWorksheetInMemory(params: {
  title: string;
  content: string;
  locale: Locale;
}): SharedWorksheetRecord {
  pruneExpiredMemoryShares();

  const now = Date.now();
  const record: SharedWorksheetRecord = {
    id: randomUUID(),
    title: params.title,
    content: params.content,
    locale: params.locale,
    createdAt: now,
    expiresAt: now + SHARE_TTL_MS,
  };

  getMemoryStore().set(record.id, record);
  return record;
}

function getSharedWorksheetFromMemory(
  id: string,
): SharedWorksheetRecord | null {
  pruneExpiredMemoryShares();

  const record = getMemoryStore().get(id);
  if (!record) return null;

  if (record.expiresAt <= Date.now()) {
    getMemoryStore().delete(id);
    return null;
  }

  return record;
}

function validateShareInput(params: {
  title: string;
  content: string;
}): { title: string; content: string } {
  const title = params.title.trim().slice(0, MAX_TITLE_LENGTH) || "Document";
  const content = params.content.trim();

  if (!content) {
    throw new Error("Worksheet content is empty.");
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    throw new Error("Worksheet content is too large to share.");
  }

  return { title, content };
}

export async function createSharedWorksheet(params: {
  title: string;
  content: string;
  locale: Locale;
}): Promise<SharedWorksheetRecord> {
  const { title, content } = validateShareInput(params);
  const expiresAt = Date.now() + SHARE_TTL_MS;

  const dbRecord = await createSharedWorksheetInDb({
    title,
    content,
    locale: params.locale,
    expiresAt,
  });

  if (dbRecord) {
    return dbRecord;
  }

  return createSharedWorksheetInMemory({
    title,
    content,
    locale: params.locale,
  });
}

export async function getSharedWorksheet(
  id: string,
): Promise<SharedWorksheetRecord | null> {
  const dbRecord = await getSharedWorksheetFromDb(id);
  if (dbRecord) return dbRecord;

  return getSharedWorksheetFromMemory(id);
}