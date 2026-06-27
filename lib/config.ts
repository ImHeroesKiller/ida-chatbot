export const IDA_CONFIG = {
  name: "IDA",
  model: "gemini-3.1-flash-lite",
  embeddingModel: "gemini-embedding-001",
  maxMessages: 40,
  maxMessageLength: 4000,
  chunkSize: 800,
  chunkOverlap: 150,
  retrievalTopK: 6,
  retrievalThreshold: 0.35,
  ragConfidenceThreshold: 0.75,
  memoryWindowK: 10,
  rateLimitPoints: 10,
  rateLimitDurationSec: 60,
  maxUploadBytes: 10 * 1024 * 1024,
  maxUploadPreviewDimension: 320,
  sttModel: "whisper-large-v3",
  sttFallbackModel: "whisper-large-v3-turbo",
} as const;

export const LOCALES = ["id", "en", "zh"] as const;
export type Locale = (typeof LOCALES)[number];