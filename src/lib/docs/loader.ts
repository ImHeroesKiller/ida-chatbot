import fs from 'node:fs/promises';
import path from 'node:path';
import { Document } from './types';

export interface DocumentationManifest {
  manifestVersion: string;
  schemaVersion: string;
  documentationVersion: string;
  generatedAt: string | null;
  documents: Document[];
}

export interface LoadManifestResult {
  manifest: DocumentationManifest;
  error: string | null;
}

const EMPTY_MANIFEST: DocumentationManifest = {
  manifestVersion: '1.0',
  schemaVersion: '1.0',
  documentationVersion: '1.0',
  generatedAt: null,
  documents: [],
};

export async function loadDocumentationManifest(): Promise<LoadManifestResult> {
  const manifestPath = path.join(process.cwd(), 'docs', 'documentation.manifest.json');

  try {
    const raw = await fs.readFile(manifestPath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<DocumentationManifest>;

    if (!parsed || !Array.isArray(parsed.documents)) {
      return {
        manifest: EMPTY_MANIFEST,
        error: 'Invalid manifest structure',
      };
    }

    return {
      manifest: {
        manifestVersion: parsed.manifestVersion ?? '1.0',
        schemaVersion: parsed.schemaVersion ?? '1.0',
        documentationVersion: parsed.documentationVersion ?? '1.0',
        generatedAt: parsed.generatedAt ?? null,
        documents: parsed.documents as Document[],
      },
      error: null,
    };
  } catch (error) {
    return {
      manifest: EMPTY_MANIFEST,
      error: error instanceof Error ? error.message : 'Unknown manifest load error',
    };
  }
}
