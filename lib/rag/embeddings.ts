import { IDA_CONFIG } from "@/lib/config";

export const EMBEDDING_DIMENSIONS = 768;

export async function embedText(text: string): Promise<number[]> {
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