import { GoogleGenerativeAI } from "@google/generative-ai";

import { IDA_CONFIG } from "@/lib/config";

export const EMBEDDING_DIMENSIONS = 768;

let genAiClient: GoogleGenerativeAI | null = null;

function getGenAiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  if (!genAiClient) {
    genAiClient = new GoogleGenerativeAI(apiKey);
  }

  return genAiClient;
}

export async function embedText(text: string): Promise<number[]> {
  const model = getGenAiClient().getGenerativeModel({
    model: IDA_CONFIG.embeddingModel,
  });

  const result = await model.embedContent({
    content: { role: "user", parts: [{ text }] },
    outputDimensionality: EMBEDDING_DIMENSIONS,
  });

  const values = result.embedding.values;

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