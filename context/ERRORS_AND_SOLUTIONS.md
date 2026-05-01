# Errors & Solutions Log — Lyla

> Document every error, bug, or unexpected behavior encountered during development.
> Include: what happened, why it happened, and how it was fixed.
> This prevents the same mistake from being made twice.

---

## Template
```
### ERROR-XXX: [Short Title]
- **Date:** YYYY-MM-DD
- **Phase:** [Setup / Chat / Memory / Search / Voice / UI]
- **Severity:** [Critical / High / Medium / Low]
- **Symptom:** What happened / what error message appeared
- **Root Cause:** Why it happened
- **Fix:** What we did to solve it
- **Prevention:** How to avoid this in the future
```

---

## Errors (None Yet — Project in Planning Phase)

*This file will be populated as development begins.*

---

### ERROR-001: sqlite-vec Extension Not Loading — memory_vectors Table Missing
- **Date:** 2026-04-30
- **Phase:** Memory (Phase 3)
- **Severity:** Critical
- **Symptom:** `[MemoryRepo] Search failed. Is sqlite-vec loaded? → Error code 1: no such table: memory_vectors`. All memory save/search operations return 0 results silently.
- **Root Cause:** `db.loadExtensionAsync('sqlite-vec')` was called with a bare string name. In expo-sqlite SDK 54, bundled extensions must be loaded using `SQLite.bundledExtensions['sqlite-vec']` which provides the correct `libPath` and `entryPoint` values. The bare string doesn't resolve to any file.
- **Fix:**
  1. Changed `loadExtensionAsync('sqlite-vec')` to use `SQLite.bundledExtensions['sqlite-vec']` with `extension.libPath` and `extension.entryPoint`
  2. Added `isVecAvailable()` flag to track extension status
  3. Fixed `memory-repository.ts` KNN query — was using invalid `vec_distance_L2()` mixed with `MATCH`/`k` syntax. Corrected to `WHERE v.embedding MATCH ? AND k = ?` with auto-provided `v.distance` column
  4. Made `saveMemory` resilient — fact always saved to `memories` table; vector insert is best-effort
  5. `searchMemories` returns `[]` immediately if vec not available (no crash)
- **Prevention:** Always use `SQLite.bundledExtensions` API for loading bundled extensions in expo-sqlite SDK 54+. Never pass a bare extension name string.

---

### ERROR-002: memory_query and memory_forget Never Actually Query the Database
- **Date:** 2026-04-30
- **Phase:** Memory (Phase 3)
- **Severity:** Critical
- **Symptom:** User asks "what do you remember about me?" → gets hardcoded "I don't have any memories" even when memories exist. User says "forget that" → gets "coming soon" placeholder.
- **Root Cause:** The orchestrator's `memory_query` handler (Step 3) called `getIdentityResponse(intent)` which returned a hardcoded fallback string — it never called `memoryEngine.getAllMemories()`. Same for `memory_forget` — returned a placeholder instead of actually deleting.
- **Fix:**
  1. `memory_query` now calls `memoryEngine.getAllMemories()` and formats actual results. Falls back to "no memories" only when DB is empty.
  2. `memory_forget` now calls `memoryEngine.findSimilar(userMessage)` to find the matching memory, then `memoryEngine.deleteMemory()` to remove it.
- **Prevention:** When wiring up new intent handlers, always connect them to the actual engine — never leave hardcoded placeholders that pretend to work.

### ERROR-003: Model Saves Minimal Facts Without Context
- **Date:** 2026-04-30
- **Phase:** Memory (Phase 3)
- **Severity:** Medium
- **Symptom:** User says "my fav actress is Emma Watson" → model saves `{"fact": "Emma Watson"}` (just a name). Later, searching for "who is my fav actress" finds 0 results because the embedding for "Emma Watson" is semantically distant from "who is my fav actress".
- **Root Cause:** The `save_memory` tool definition's `fact` parameter description was too vague: `"The fact to remember (e.g., \"User's dog is named Max\")"`. The 1.2B model took a shortcut and saved just the name.
- **Fix:** Updated the `fact` parameter description to explicitly require complete descriptive sentences: `"A complete descriptive sentence about the user. Examples: \"User's favorite actress is Emma Watson\". Do NOT save bare names or single words — always include context."`
- **Prevention:** When writing tool descriptions for sub-2B models, be extremely explicit about output format with multiple examples and negative constraints ("Do NOT...").
