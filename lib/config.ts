export const IDA_CONFIG = {
  name: "IDA",
  model: "gemini-3.1-flash-lite",
  embeddingModel: "gemini-embedding-001",
  maxMessages: 40,
  maxMessageLength: 4000,
  retrievalTopK: 6,
  retrievalThreshold: 0.35,
  memoryWindowK: 10,
  rateLimitPoints: 10,
  rateLimitDurationSec: 60,
} as const;

export const LOCALES = ["id", "en", "zh"] as const;
export type Locale = (typeof LOCALES)[number];