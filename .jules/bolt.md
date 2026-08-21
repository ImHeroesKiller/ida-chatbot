# Bolt's Journal

Critical performance learnings and optimization records.

## 2026-08-21 - Map Indexing ESL Snapshots in Reality Adapter
**Learning:** Constructing view models from normalized entity snapshot arrays (`snapshot.organizations`, `snapshot.communications`, `snapshot.artifacts`, `snapshot.persons`) using nested `.find()` and `.filter()` calls scales at O(N^2) time complexity. Pre-indexing snapshot entities into O(1) `Map` lookups reduces time complexity to O(N) while preserving non-mutating shallow copies during sorting operations.
**Action:** Always build pre-indexed `Map` collections when constructing UI view models from multi-entity snapshots in `lib/enterprise/reality-adapter.ts` or `packages/query/engine.ts`.
