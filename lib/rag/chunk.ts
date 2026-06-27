import { createHash } from "node:crypto";

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import { IDA_CONFIG, type Locale } from "@/lib/config";

import type { DocumentChunk, SourceDocument } from "./types";

export const CHUNK_SIZE = IDA_CONFIG.chunkSize;
export const CHUNK_OVERLAP = IDA_CONFIG.chunkOverlap;

let textSplitter: RecursiveCharacterTextSplitter | null = null;

export function getTextSplitter(): RecursiveCharacterTextSplitter {
  if (!textSplitter) {
    textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
    });
  }

  return textSplitter;
}

export function buildContentHash(options: {
  content: string;
  locale: Locale;
  source: string;
  section: string;
  chunkIndex: number;
}): string {
  const { content, locale, source, section, chunkIndex } = options;

  return createHash("sha256")
    .update(`${locale}|${source}|${section}|${chunkIndex}|${content}`)
    .digest("hex");
}

export function buildChunkMetadata(
  doc: SourceDocument,
  chunkIndex: number,
  totalChunks: number,
): Record<string, string> {
  return {
    source: doc.source,
    section: doc.section,
    locale: doc.locale,
    chunkIndex: String(chunkIndex),
    totalChunks: String(totalChunks),
    ...doc.metadata,
  };
}

export async function chunkSourceDocuments(
  documents: SourceDocument[],
): Promise<DocumentChunk[]> {
  const splitter = getTextSplitter();
  const chunks: DocumentChunk[] = [];

  for (const doc of documents) {
    const parts = await splitter.splitText(doc.content);

    parts.forEach((content, index) => {
      chunks.push({
        content,
        locale: doc.locale,
        pageSlug: doc.source,
        section: doc.section,
        sourceType: doc.sourceType,
        metadata: buildChunkMetadata(doc, index, parts.length),
        contentHash: buildContentHash({
          content,
          locale: doc.locale,
          source: doc.source,
          section: doc.section,
          chunkIndex: index,
        }),
      });
    });
  }

  return chunks;
}