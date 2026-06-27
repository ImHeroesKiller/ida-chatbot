import type { Locale } from "@/lib/config";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

import { embedText } from "./embeddings";
import type { DocumentChunk, RetrievedChunk } from "./types";

interface ChunkRow {
  content: string;
  embedding: number[];
  locale: string;
  page_slug: string;
  section: string;
  source_type: string;
  metadata: Record<string, string>;
  content_hash: string;
}

export async function upsertDocumentChunks(
  chunks: DocumentChunk[],
): Promise<number> {
  const supabase = getSupabaseAdmin();
  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const embeddings = await Promise.all(
      batch.map((chunk) => embedText(chunk.content)),
    );

    const rows: ChunkRow[] = batch.map((chunk, index) => ({
      content: chunk.content,
      embedding: embeddings[index]!,
      locale: chunk.locale,
      page_slug: chunk.pageSlug,
      section: chunk.section,
      source_type: chunk.sourceType,
      metadata: chunk.metadata,
      content_hash: chunk.contentHash,
    }));

    const { error } = await supabase.from("ida_document_chunks").upsert(rows, {
      onConflict: "content_hash",
    });

    if (error) {
      throw new Error(`Failed to upsert chunks: ${error.message}`);
    }

    inserted += batch.length;
  }

  return inserted;
}

export async function searchDocumentChunks(options: {
  query: string;
  locale: Locale;
  matchCount?: number;
  matchThreshold?: number;
}): Promise<RetrievedChunk[]> {
  const {
    query,
    locale,
    matchCount = 6,
    matchThreshold = 0.35,
  } = options;

  const supabase = getSupabaseAdmin();
  const queryEmbedding = await embedText(query);

  const { data, error } = await supabase.rpc("match_ida_chunks", {
    query_embedding: queryEmbedding,
    match_locale: locale,
    match_count: matchCount,
    match_threshold: matchThreshold,
  });

  if (error) {
    throw new Error(`Vector search failed: ${error.message}`);
  }

  return (data ?? []).map(
    (row: {
      id: string;
      content: string;
      page_slug: string;
      section: string;
      source_type: string;
      similarity: number;
    }) => ({
      id: row.id,
      content: row.content,
      pageSlug: row.page_slug,
      section: row.section,
      sourceType: row.source_type as RetrievedChunk["sourceType"],
      similarity: row.similarity,
    }),
  );
}