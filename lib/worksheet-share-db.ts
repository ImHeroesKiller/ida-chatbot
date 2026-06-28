import type { Locale } from "@/lib/config";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";

import type { SharedWorksheetRecord } from "@/lib/worksheet-share-store";

interface WorksheetShareRow {
  id: string;
  title: string;
  content: string;
  locale: Locale;
  expires_at: string;
  created_at: string;
}

function rowToRecord(row: WorksheetShareRow): SharedWorksheetRecord {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    locale: row.locale,
    createdAt: new Date(row.created_at).getTime(),
    expiresAt: new Date(row.expires_at).getTime(),
  };
}

export async function createSharedWorksheetInDb(params: {
  title: string;
  content: string;
  locale: Locale;
  expiresAt: number;
}): Promise<SharedWorksheetRecord | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ida_worksheet_shares")
    .insert({
      title: params.title,
      content: params.content,
      locale: params.locale,
      expires_at: new Date(params.expiresAt).toISOString(),
    })
    .select("id, title, content, locale, expires_at, created_at")
    .single();

  if (error || !data) {
    console.error("[IDA worksheet-share create]", error);
    return null;
  }

  return rowToRecord(data as WorksheetShareRow);
}

export async function getSharedWorksheetFromDb(
  id: string,
): Promise<SharedWorksheetRecord | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ida_worksheet_shares")
    .select("id, title, content, locale, expires_at, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[IDA worksheet-share get]", error);
    return null;
  }

  if (!data) return null;

  const record = rowToRecord(data as WorksheetShareRow);
  if (record.expiresAt <= Date.now()) {
    await supabase.from("ida_worksheet_shares").delete().eq("id", id);
    return null;
  }

  return record;
}