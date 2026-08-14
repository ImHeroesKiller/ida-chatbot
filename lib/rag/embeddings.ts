import { IDA_CONFIG } from "@/lib/config";

export const EMBEDDING_DIMENSIONS = 768;

// In-memory cache to store computed embeddings and avoid redundant API requests.
// We use a Map to keep track of insertion order for a simple LRU eviction strategy.
// Caching Promises instead of resolved arrays prevents concurrent cache stampedes.
const embeddingCache = new Map<string, Promise<number[]>>();
const MAX_CACHE_SIZE = 1000;

export async function embedText(text: string): Promise<number[]> {
  const cacheKey = `${IDA_CONFIG.embeddingModel}:${text}`;

  // Return cached embedding promise if available (performance optimization)
  if (embeddingCache.has(cacheKey)) {
    const cachedPromise = embeddingCache.get(cacheKey)!;
    // To make the cache truly LRU: delete and re-insert on cache hit
    embeddingCache.delete(cacheKey);
    embeddingCache.set(cacheKey, cachedPromise);
    return cachedPromise;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  // Create the promise for embedding fetching (avoids cache stampede)
  const embeddingPromise = (async () => {
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
  })();

  // Save the promise to the cache before awaiting it to prevent concurrent stampedes.
  // If cache exceeds limit, evict the oldest item (first item in map insertion order).
  if (embeddingCache.size >= MAX_CACHE_SIZE) {
    const firstKey = embeddingCache.keys().next().value;
    if (firstKey !== undefined) {
      embeddingCache.delete(firstKey);
    }
  }
  embeddingCache.set(cacheKey, embeddingPromise);

  // If the promise fails, remove it from the cache so future requests can retry
  try {
    return await embeddingPromise;
  } catch (error) {
    embeddingCache.delete(cacheKey);
    throw error;
  }
}
