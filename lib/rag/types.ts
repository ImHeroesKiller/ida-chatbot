import type { Locale } from "@/lib/config";

export type DocumentSourceType = "knowledge" | "faq" | "guide";

export interface SourceDocument {
  content: string;
  locale: Locale;
  source: string;
  section: string;
  sourceType: DocumentSourceType;
  metadata?: Record<string, string>;
}

export interface DocumentChunk {
  content: string;
  locale: Locale;
  pageSlug: string;
  section: string;
  sourceType: DocumentSourceType;
  metadata: Record<string, string>;
  contentHash: string;
}

export interface RetrievedChunk {
  id: string;
  content: string;
  pageSlug: string;
  section: string;
  sourceType: DocumentSourceType;
  metadata: Record<string, string>;
  similarity: number;
}