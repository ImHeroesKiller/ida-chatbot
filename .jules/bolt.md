## 2025-05-18 - Pre-indexing Snapshot Collections & Cached Intl.DateTimeFormat in View Adapter

**Learning:** `buildRealityViewModel` in `lib/enterprise/reality-adapter.ts` previously executed quadratic $O(N^2)$ array `.find()` and `.filter()` scans across snapshot entities, combined with calling `Date.prototype.toLocaleString(locale, options)` inside iteration loops. In V8, `toLocaleString` with locale options repeatedly resolves ICU locale metadata on every invocation. Replacing array scans with pre-indexed `Map` lookups and reusing module-scoped `Intl.DateTimeFormat` instances reduced execution time for 500 iterations over 500 communications / 200 artifacts from ~59.4s down to ~2.1s (~27x speedup).

**Action:** Whenever transforming or aggregating snapshot models or lists, pre-index lookups into `Map` or `Set` instances and instantiate static `Intl.DateTimeFormat` formatters outside the render or view-building loops.
