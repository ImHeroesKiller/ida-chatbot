# Bolt's Journal - Critical Learnings

## 2025-05-18 - Promise-based LRU Cache for Embeddings
**Learning:** Network calls to Gemini embedding API (`embedText`) take 200–800ms per request. Identical queries or concurrent requests for the same text can cause duplicate network roundtrips and cache stampedes.
**Action:** Cache the returning `Promise<number[]>` directly in an in-memory Map LRU cache (limit 1000). On failure, delete from cache so retries can occur.
