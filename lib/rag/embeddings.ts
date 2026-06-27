import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

import { IDA_CONFIG } from "@/lib/config";

export const EMBEDDING_DIMENSIONS = 768;

let embeddingsModel: GoogleGenerativeAIEmbeddings | null = null;

function getEmbeddingsModel(): GoogleGenerativeAIEmbeddings {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  if (!embeddingsModel) {
    embeddingsModel = new GoogleGenerativeAIEmbeddings({
      apiKey,
      model: IDA_CONFIG.embeddingModel,
    });
  }

  return embeddingsModel;
}

export async function embedText(text: string): Promise<number[]> {
  const values = await getEmbeddingsModel().embedQuery(text);

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