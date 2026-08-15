import { IDA_CONFIG } from "@/lib/config";

export const EMBEDDING_DIMENSIONS = 768;

// In-memory Promise-based LRU cache to optimize embedding lookups and prevent cache stampedes.
// Caching the Promise directly ensures concurrent requests for identical text share a single network call.
const CACHE_LIMIT = 1000;
const embeddingCache = new Map<string, Promise<number[]>>();

/**
 * Clear the in-memory embedding cache (useful for testing).
 */
export function clearEmbeddingCache(): void {
  embeddingCache.clear();
}

/**
 * Get current cached embedding count (useful for testing/telemetry).
 */
export function getEmbeddingCacheSize(): number {
  return embeddingCache.size;
}

async function fetchEmbeddingFromApi(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${IDA_CONFIG.embeddingModel}:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${IDA_CONFIG.embeddingModel}`,
        content: { parts: [{ text }] },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
    },
  );

  const payload = (await response.json()) as {
    embedding?: { values?: number[] };
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(
      payload.error?.message ??
        `Embedding request failed with status ${response.status}`,
    );
  }

  const values = payload.embedding?.values;

  if (!values?.length) {
    throw new Error("Empty embedding returned from model.");
  }

  if (values.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Unexpected embedding dimensions: ${values.length} (expected ${EMBEDDING_DIMENSIONS}).`,
    );
  }

  return values;
}

export async function embedText(text: string): Promise<number[]> {
  const cacheKey = text.trim();

  // Return existing cached promise if present, updating LRU order
  if (embeddingCache.has(cacheKey)) {
    const promise = embeddingCache.get(cacheKey)!;
    // Move to end of Map to maintain LRU order (most recently used)
    embeddingCache.delete(cacheKey);
    embeddingCache.set(cacheKey, promise);
    return promise;
  }

  // Create new promise for network request and cache it immediately to prevent duplicate concurrent calls
  const promise = fetchEmbeddingFromApi(cacheKey).catch((error) => {
    // Evict failed requests so future retries can succeed
    embeddingCache.delete(cacheKey);
    throw error;
  });

  embeddingCache.set(cacheKey, promise);

  // Enforce LRU capacity limit by evicting the least recently used (first inserted) item
  if (embeddingCache.size > CACHE_LIMIT) {
    const oldestKey = embeddingCache.keys().next().value;
    if (oldestKey !== undefined) {
      embeddingCache.delete(oldestKey);
    }
  }

  return promise;
}
