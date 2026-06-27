import type { Locale } from "@/lib/config";
import { IDA_CONFIG } from "@/lib/config";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

import { searchDocumentChunks } from "./vector-store";
import type { RetrievedChunk } from "./types";

export type RagFallbackReason =
  | "supabase_unconfigured"
  | "retrieval_error"
  | "no_chunks"
  | "low_confidence";

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  context: string;
  usedRag: boolean;
  fallbackReason?: RagFallbackReason;
  maxSimilarity: number;
  retrievedChunkCount: number;
}

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

function buildFallbackResult(options: {
  fallbackReason: RagFallbackReason;
  maxSimilarity?: number;
  retrievedChunkCount?: number;
  error?: unknown;
}): RetrievalResult {
  const {
    fallbackReason,
    maxSimilarity = 0,
    retrievedChunkCount = 0,
    error,
  } = options;

  console.log("[IDA retrieval] RAG fallback", {
    reason: fallbackReason,
    maxSimilarity,
    retrievedChunkCount,
    threshold: IDA_CONFIG.ragConfidenceThreshold,
    ...(error instanceof Error ? { error: error.message } : {}),
  });

  return {
    chunks: [],
    context: "",
    usedRag: false,
    fallbackReason,
    maxSimilarity,
    retrievedChunkCount,
  };
}

export async function retrieveContext(options: {
  query: string;
  locale: Locale;
}): Promise<RetrievalResult> {
  if (!isSupabaseConfigured()) {
    return buildFallbackResult({ fallbackReason: "supabase_unconfigured" });
  }

  try {
    const chunks = await searchDocumentChunks({
      query: options.query,
      locale: options.locale,
      matchCount: IDA_CONFIG.retrievalTopK,
      matchThreshold: IDA_CONFIG.retrievalThreshold,
    });

    const retrievedChunkCount = chunks.length;
    const maxSimilarity = chunks.reduce(
      (max, chunk) => Math.max(max, chunk.similarity),
      0,
    );

    if (retrievedChunkCount === 0) {
      return buildFallbackResult({
        fallbackReason: "no_chunks",
        retrievedChunkCount: 0,
        maxSimilarity: 0,
      });
    }

    if (maxSimilarity < IDA_CONFIG.ragConfidenceThreshold) {
      return buildFallbackResult({
        fallbackReason: "low_confidence",
        maxSimilarity,
        retrievedChunkCount,
      });
    }

    const confidentChunks = chunks.filter(
      (chunk) => chunk.similarity >= IDA_CONFIG.ragConfidenceThreshold,
    );

    console.log("[IDA retrieval] RAG active", {
      retrievedChunkCount,
      usedChunks: confidentChunks.length,
      maxSimilarity,
      threshold: IDA_CONFIG.ragConfidenceThreshold,
    });

    return {
      chunks: confidentChunks,
      context: formatRetrievedContext(confidentChunks),
      usedRag: true,
      maxSimilarity,
      retrievedChunkCount,
    };
  } catch (error) {
    console.error("[IDA retrieval]", error);
    return buildFallbackResult({
      fallbackReason: "retrieval_error",
      error,
    });
  }
}