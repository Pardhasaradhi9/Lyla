# Errors & Solutions Log — Lyla

> Every error, bug, and fix. Read before debugging to avoid repeating mistakes.
> Last Updated: 2026-05-02

---

## Template
```
### ERROR-XXX: [Short Title]
- **Date:** YYYY-MM-DD
- **Phase:** [Setup / Chat / Memory / Tools / Voice / UI]
- **Severity:** [Critical / High / Medium / Low]
- **Symptom:** What happened
- **Root Cause:** Why it happened
- **Fix:** What we did
- **Prevention:** How to avoid it
```

---

### ERROR-001: sqlite-vec Extension Not Loading
- **Date:** 2026-04-30
- **Phase:** Memory (Phase 3)
- **Severity:** Critical
- **Symptom:** `[MemoryRepo] Search failed. no such table: memory_vectors`. All memory save/search operations return 0 results silently.
- **Root Cause:** `db.loadExtensionAsync('sqlite-vec')` was called with a bare string. In expo-sqlite SDK 54, bundled extensions must use `SQLite.bundledExtensions['sqlite-vec']` which provides `libPath` and `entryPoint`.
- **Fix:** Changed to use `SQLite.bundledExtensions['sqlite-vec']` API. Added `isVecAvailable()` flag. Made `saveMemory` resilient — fact always saved; vector insert is best-effort.
- **Prevention:** Always use `SQLite.bundledExtensions` API for bundled extensions in expo-sqlite SDK 54+.

---

### ERROR-002: memory_query Never Actually Queries the Database
- **Date:** 2026-04-30
- **Phase:** Memory (Phase 3)
- **Severity:** Critical
- **Symptom:** "What do you remember about me?" returns hardcoded "I don't have any memories" even when memories exist.
- **Root Cause:** Orchestrator's `memory_query` handler called `getIdentityResponse(intent)` instead of `memoryEngine.getAllMemories()`.
- **Fix:** Connected to actual memory engine. `memory_query` → `getAllMemories()`. `memory_forget` → `findSimilar()` + `deleteMemory()`.
- **Prevention:** Always wire intent handlers to actual engines — never leave hardcoded placeholders.

---

### ERROR-003: Model Saves Minimal Facts Without Context
- **Date:** 2026-04-30
- **Phase:** Memory (Phase 3)
- **Severity:** Medium
- **Symptom:** "My fav actress is Emma Watson" saves just "Emma Watson" as fact. Later search for "favorite actress" finds nothing.
- **Root Cause:** Long-press saves raw message content. No fact extraction step. Embedding for "Emma Watson" is semantically distant from "who is my fav actress".
- **Fix:** Added 200-char limit on long-press. Full fix pending: auto-fact extraction with regex patterns + 350M Extractor model.
- **Prevention:** Memory should save structured facts ("user's favorite actress is Emma Watson"), not raw text.

---

### ERROR-004: App Reopens with Last Chat Instead of Fresh
- **Date:** 2026-05-02
- **Phase:** Chat UI
- **Severity:** Medium
- **Symptom:** Closing and reopening Lyla loads the last conversation. User expects a fresh start.
- **Root Cause:** `app/index.tsx` has `loadLastConversation` useEffect that runs on mount and loads the most recent conversation from SQLite.
- **Fix:** PENDING — Remove auto-load on mount. Start fresh. History accessible via History button.
- **Prevention:** Consider adding a "Continue last chat?" prompt, or make it a setting.

---

### ERROR-005: Context Overflow Crash After Long Conversation
- **Date:** 2026-05-02
- **Phase:** Chat / LLM
- **Severity:** High
- **Symptom:** After 20+ messages, app becomes slow then crashes or silently starts a new chat. Context grows until it exceeds the 8192 token window.
- **Root Cause:** `MAX_CONTEXT_CHARS = 12000` (~3000 tokens) is too generous. With system prompt + memory context + history + new message, the total exceeds 8192 tokens. llama.rn may crash or silently fail.
- **Fix:** PENDING — Lower `MAX_CONTEXT_CHARS` to 6000. Add try-catch in `llm.ts:complete()`. Catch OOM/context overflow and return graceful error.
- **Prevention:** Always estimate token count (chars/4) and stay well under model's n_ctx.

---

### ERROR-006: Memory Query Dumps All Memories Instead of Semantic Search
- **Date:** 2026-05-02
- **Phase:** Memory
- **Severity:** Medium
- **Symptom:** "What do you remember about me?" dumps ALL memories as raw text. No semantic relevance filtering. The embedding model (Arctic Embed) is loaded but not used for this query.
- **Root Cause:** `memory_query` intent calls `getAllMemories()` which does a raw SQL dump. Should use `findSimilar()` with the user's query embedded.
- **Fix:** PENDING — Change to `findSimilar(userMessage, 10)` which embeds the query and returns top-K relevant memories.
- **Prevention:** Memory retrieval should always be semantic, not lexical.

---

### ERROR-007: Memory Saves Raw Text Without Structured Extraction
- **Date:** 2026-05-02
- **Phase:** Memory
- **Severity:** Medium
- **Symptom:** Long-press saves the entire message as-is. No entity extraction, no categorization, no fact structure. "My mom's name is Sarah and she lives in London" saves as one monolithic fact.
- **Root Cause:** No fact extraction step. `memoryEngine.addMemory(content)` saves raw content.
- **Fix:** PENDING — Add regex-based fact extractor. Future: 350M Extractor model for structured JSON extraction.
- **Prevention:** Always extract structured facts before saving to memory.

---

## Common Pitfalls (Lessons Learned)

1. **1.2B models hallucinate on identity questions** — Never let the LLM handle "who are you" or "who made you". Use hardcoded responses.
2. **expo-sqlite SDK 54 uses `bundledExtensions` API** — Never pass bare extension names.
3. **Context window is the bottleneck** — Always estimate tokens, always trim aggressively.
4. **sqlite-vec MATCH syntax is specific** — Use `WHERE v.embedding MATCH ? AND k = ?`, not `vec_distance_L2()`.
5. **Memory extraction needs structure** — Raw text saves are useless for semantic retrieval.
6. **iOS Simulator has no Metal GPU** — LLM inference is 10x slower on simulator. Always test on real hardware for performance.
7. **expo-localization, expo-battery, expo-device are JS-only** — No native rebuild needed for these packages.
8. **TextInputUI warnings** — Suppress with `LogBox.ignoreLogs(['TextInputState'])`.
