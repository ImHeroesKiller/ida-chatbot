import type { DocumentSourceType } from "@/lib/rag/types";
import type { Locale } from "@/lib/config";

export type KbFileType = "pdf" | "txt" | "md" | "docx";

export interface KbChunkRow {
  id: string;
  content: string;
  locale: Locale;
  page_slug: string;
  section: string;
  source_type: DocumentSourceType;
  metadata: Record<string, string>;
  content_hash: string;
  created_at: string;
  updated_at: string;
}

export interface KbChunkListItem {
  id: string;
  content: string;
  locale: Locale;
  pageSlug: string;
  section: string;
  sourceType: DocumentSourceType;
  metadata: Record<string, string>;
  contentHash: string;
  createdAt: string;
  updatedAt: string;
  preview: string;
}

export interface KbDocumentRow {
  id: string;
  title: string;
  file_name: string;
  file_type: KbFileType;
  locale: Locale;
  page_slug: string;
  section: string;
  source_type: DocumentSourceType;
  content: string;
  metadata: Record<string, string>;
  chunk_count: number;
  created_at: string;
  updated_at: string;
}

export interface KbDocumentListItem {
  id: string;
  title: string;
  fileName: string;
  fileType: KbFileType;
  locale: Locale;
  pageSlug: string;
  section: string;
  sourceType: DocumentSourceType;
  chunkCount: number;
  contentLength: number;
  createdAt: string;
  updatedAt: string;
}

export interface KbChunkListResult {
  chunks: KbChunkListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface KbChunkFilters {
  search?: string;
  locale?: Locale;
  sourceType?: DocumentSourceType;
  pageSlug?: string;
  section?: string;
  page?: number;
  pageSize?: number;
}