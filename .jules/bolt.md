## 2026-08-20 - Index ESL Snapshot Queries with Map Lookups

**Learning:** `QueryEngine` methods (`attentionItems` and `overview`) performed nested O(N) `Array.prototype.find()` and `filter()` calls across communications and organizations for every artifact, leading to O(Artifacts * Comms) quadratic slowdowns during query operations and snapshot overview generation. Pre-building Map indexes (`Map<id, Item>` and `Map<orgId, Comm[]>`) and caching sorting keys reduced execution time from ~2.36s to ~0.18s (~12x speedup).

**Action:** When querying or aggregating across snapshot array collections in ESL/graph services, index array entities into Map lookups or grouped Maps up front before mapping/sorting to avoid O(N²) quadratic loops.
