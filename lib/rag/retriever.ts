import type { Locale } from "@/lib/config";
import { IDA_CONFIG } from "@/lib/config";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

import { searchDocumentChunks } from "./vector-store";
import type { RetrievedChunk } from "./types";

function resolveChunkLabel(chunk: RetrievedChunk): {
  source: string;
  section: string;
  locale: string;
} {
  return {
    source: chunk.metadata.source ?? chunk.pageSlug,
    section: chunk.metadata.section ?? chunk.section,
    locale: chunk.metadata.locale ?? "id",
  };
}

export function formatRetrievedContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return "Tidak ada dokumen relevan ditemukan di knowledge base.";
  }

  return chunks
    .map((chunk, index) => {
      const { source, section, locale } = resolveChunkLabel(chunk);

      return `[${index + 1}] (${chunk.sourceType} | source: ${source} | section: ${section} | locale: ${locale} | relevansi: ${(chunk.similarity * 100).toFixed(0)}%)
${chunk.content}`;
    })
    .join("\n\n");
}

export async function retrieveContext(options: {
  query: string;
  locale: Locale;
}): Promise<{ chunks: RetrievedChunk[]; context: string }> {
  if (!isSupabaseConfigured()) {
    return { chunks: [], context: "" };
  }

  try {
    const chunks = await searchDocumentChunks({
      query: options.query,
      locale: options.locale,
      matchCount: IDA_CONFIG.retrievalTopK,
      matchThreshold: IDA_CONFIG.retrievalThreshold,
    });

    return {
      chunks,
      context: formatRetrievedContext(chunks),
    };
  } catch (error) {
    console.error("[IDA retrieval]", error);
    return { chunks: [], context: "" };
  }
}