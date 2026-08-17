## 2025-05-18 - Preserve Exact .find() First-Match Semantics When Converting to Map Lookup
**Learning:** Converting `array.find(x => x.key === target)` to `Map.set(key, item)` in a loop overwrites earlier matches with the last match if keys are not unique.
**Action:** Always check `if (!map.has(key)) map.set(key, item)` to preserve first-match semantics identical to `Array.prototype.find()`.
