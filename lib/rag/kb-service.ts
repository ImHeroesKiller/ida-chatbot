import type { Locale } from "@/lib/config";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";

import {
  buildContentHash,
  chunkSourceDocuments,
} from "./chunk";
import { embedText } from "./embeddings";
import type {
  KbChunkFilters,
  KbChunkListItem,
  KbChunkListResult,
  KbChunkRow,
  KbDocumentListItem,
  KbDocumentRow,
  KbFileType,
} from "./kb-types";
import type { DocumentSourceType, SourceDocument } from "./types";
import { deleteChunksForSource, upsertDocumentChunks } from "./vector-store";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const PREVIEW_LENGTH = 160;

function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

function mapChunkRow(row: KbChunkRow): KbChunkListItem {
  return {
    id: row.id,
    content: row.content,
    locale: row.locale,
    pageSlug: row.page_slug,
    section: row.section,
    sourceType: row.source_type,
    metadata: (row.metadata ?? {}) as Record<string, string>,
    contentHash: row.content_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    preview:
      row.content.length > PREVIEW_LENGTH
        ? `${row.content.slice(0, PREVIEW_LENGTH)}…`
        : row.content,
  };
}

function mapDocumentRow(row: KbDocumentRow): KbDocumentListItem {
  return {
    id: row.id,
    title: row.title,
    fileName: row.file_name,
    fileType: row.file_type,
    locale: row.locale,
    pageSlug: row.page_slug,
    section: row.section,
    sourceType: row.source_type,
    chunkCount: row.chunk_count,
    contentLength: row.content.length,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function assertSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
}

export async function listKbChunks(
  filters: KbChunkFilters = {},
): Promise<KbChunkListResult> {
  assertSupabase();

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE),
  );
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("ida_document_chunks")
    .select(
      "id, content, locale, page_slug, section, source_type, metadata, content_hash, created_at, updated_at",
      { count: "exact" },
    );

  if (filters.search?.trim()) {
    query = query.ilike("content", `%${escapeIlike(filters.search.trim())}%`);
  }

  if (filters.locale) query = query.eq("locale", filters.locale);
  if (filters.sourceType) query = query.eq("source_type", filters.sourceType);
  if (filters.pageSlug?.trim()) {
    query = query.eq("page_slug", filters.pageSlug.trim());
  }
  if (filters.section?.trim()) {
    query = query.eq("section", filters.section.trim());
  }

  const { data, error, count } = await query
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  const total = count ?? 0;

  return {
    chunks: ((data ?? []) as KbChunkRow[]).map(mapChunkRow),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getKbChunk(id: string): Promise<KbChunkListItem | null> {
  assertSupabase();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ida_document_chunks")
    .select(
      "id, content, locale, page_slug, section, source_type, metadata, content_hash, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return mapChunkRow(data as KbChunkRow);
}

export async function updateKbChunk(
  id: string,
  updates: { content: string },
): Promise<KbChunkListItem> {
  assertSupabase();

  const supabase = getSupabaseAdmin();
  const { data: existing, error: fetchError } = await supabase
    .from("ida_document_chunks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!existing) throw new Error("Chunk not found.");

  const row = existing as KbChunkRow;
  const content = updates.content.trim();
  if (!content) throw new Error("Chunk content cannot be empty.");

  const metadata = (row.metadata ?? {}) as Record<string, string>;
  const chunkIndex = Number.parseInt(metadata.chunkIndex ?? "0", 10);
  const contentHash = buildContentHash({
    content,
    locale: row.locale,
    source: row.page_slug,
    section: row.section,
    chunkIndex: Number.isFinite(chunkIndex) ? chunkIndex : 0,
  });

  const embedding = await embedText(content);

  const { data, error } = await supabase
    .from("ida_document_chunks")
    .update({
      content,
      embedding,
      content_hash: contentHash,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(
      "id, content, locale, page_slug, section, source_type, metadata, content_hash, created_at, updated_at",
    )
    .single();

  if (error) throw new Error(error.message);

  return mapChunkRow(data as KbChunkRow);
}

export async function deleteKbChunk(id: string): Promise<void> {
  assertSupabase();

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("ida_document_chunks").delete().eq("id", id);

  if (error) throw new Error(error.message);
}

export async function listKbDocuments(): Promise<KbDocumentListItem[]> {
  assertSupabase();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ida_kb_documents")
    .select(
      "id, title, file_name, file_type, locale, page_slug, section, source_type, content, chunk_count, created_at, updated_at",
    )
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);

  return ((data ?? []) as KbDocumentRow[]).map(mapDocumentRow);
}

export async function getKbDocument(id: string): Promise<KbDocumentRow | null> {
  assertSupabase();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ida_kb_documents")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as KbDocumentRow | null) ?? null;
}

async function indexSourceDocument(doc: SourceDocument): Promise<number> {
  await deleteChunksForSource({
    pageSlug: doc.source,
    section: doc.section,
    locale: doc.locale,
  });

  const chunks = await chunkSourceDocuments([doc]);
  return upsertDocumentChunks(chunks);
}

export async function createKbDocument(options: {
  title: string;
  fileName: string;
  fileType: KbFileType;
  locale: Locale;
  pageSlug: string;
  section: string;
  sourceType: DocumentSourceType;
  content: string;
  metadata?: Record<string, string>;
}): Promise<{ document: KbDocumentListItem; chunksIndexed: number }> {
  assertSupabase();

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("ida_kb_documents")
    .upsert(
      {
        title: options.title,
        file_name: options.fileName,
        file_type: options.fileType,
        locale: options.locale,
        page_slug: options.pageSlug,
        section: options.section,
        source_type: options.sourceType,
        content: options.content,
        metadata: {
          ...options.metadata,
          fileName: options.fileName,
          fileType: options.fileType,
        },
        updated_at: now,
      },
      { onConflict: "page_slug,section,locale" },
    )
    .select(
      "id, title, file_name, file_type, locale, page_slug, section, source_type, content, chunk_count, created_at, updated_at",
    )
    .single();

  if (error) throw new Error(error.message);

  const chunksIndexed = await indexSourceDocument({
    content: options.content,
    locale: options.locale,
    source: options.pageSlug,
    section: options.section,
    sourceType: options.sourceType,
    metadata: {
      title: options.title,
      fileName: options.fileName,
      fileType: options.fileType,
      ...options.metadata,
    },
  });

  const { error: countError } = await supabase
    .from("ida_kb_documents")
    .update({ chunk_count: chunksIndexed, updated_at: now })
    .eq("id", data.id);

  if (countError) throw new Error(countError.message);

  return {
    document: mapDocumentRow({
      ...(data as KbDocumentRow),
      chunk_count: chunksIndexed,
    }),
    chunksIndexed,
  };
}

export async function reindexKbDocument(id: string): Promise<{
  document: KbDocumentListItem;
  chunksIndexed: number;
}> {
  const document = await getKbDocument(id);
  if (!document) throw new Error("Document not found.");

  const chunksIndexed = await indexSourceDocument({
    content: document.content,
    locale: document.locale,
    source: document.page_slug,
    section: document.section,
    sourceType: document.source_type,
    metadata: {
      title: document.title,
      fileName: document.file_name,
      fileType: document.file_type,
      ...((document.metadata ?? {}) as Record<string, string>),
    },
  });

  assertSupabase();
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("ida_kb_documents")
    .update({ chunk_count: chunksIndexed, updated_at: now })
    .eq("id", id)
    .select(
      "id, title, file_name, file_type, locale, page_slug, section, source_type, content, chunk_count, created_at, updated_at",
    )
    .single();

  if (error) throw new Error(error.message);

  return {
    document: mapDocumentRow(data as KbDocumentRow),
    chunksIndexed,
  };
}

export async function deleteKbDocument(id: string): Promise<void> {
  const document = await getKbDocument(id);
  if (!document) throw new Error("Document not found.");

  await deleteChunksForSource({
    pageSlug: document.page_slug,
    section: document.section,
    locale: document.locale,
  });

  assertSupabase();
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("ida_kb_documents").delete().eq("id", id);

  if (error) throw new Error(error.message);
}

export async function getKbStats(): Promise<{
  totalChunks: number;
  totalDocuments: number;
  byLocale: Record<string, number>;
  bySourceType: Record<string, number>;
}> {
  assertSupabase();
  const supabase = getSupabaseAdmin();

  const [chunksCountResult, docsCountResult, breakdownResult] = await Promise.all([
    supabase
      .from("ida_document_chunks")
      .select("*", { count: "exact", head: true }),
    supabase.from("ida_kb_documents").select("*", { count: "exact", head: true }),
    supabase.from("ida_document_chunks").select("locale, source_type"),
  ]);

  if (chunksCountResult.error) throw new Error(chunksCountResult.error.message);
  if (docsCountResult.error) throw new Error(docsCountResult.error.message);
  if (breakdownResult.error) throw new Error(breakdownResult.error.message);

  const byLocale: Record<string, number> = {};
  const bySourceType: Record<string, number> = {};

  for (const row of breakdownResult.data ?? []) {
    const locale = row.locale as string;
    const sourceType = row.source_type as string;
    byLocale[locale] = (byLocale[locale] ?? 0) + 1;
    bySourceType[sourceType] = (bySourceType[sourceType] ?? 0) + 1;
  }

  return {
    totalChunks: chunksCountResult.count ?? 0,
    totalDocuments: docsCountResult.count ?? 0,
    byLocale,
    bySourceType,
  };
}