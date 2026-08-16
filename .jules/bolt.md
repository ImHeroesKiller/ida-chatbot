## 2026-08-16 - Map Lookups in Query Engine Aggregations
**Learning:** `QueryEngine.overview()` and `QueryEngine.attentionItems()` performed nested array searches (`.find()` and `.filter()`) across organizations, communications, and artifacts, causing quadratic execution time O(N * M) as data scales.
**Action:** Replace nested array filtering in domain query aggregations with pre-indexed `Map` lookups to maintain O(N) single-pass runtime complexity.
