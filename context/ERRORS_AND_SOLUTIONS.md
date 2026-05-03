# Errors & Solutions Log — Lyla

> Every error, bug, and fix. Read before debugging to avoid repeating mistakes.
> Last Updated: 2026-05-03

---

## Template
```
### ERROR-XXX: [Short Title]
- **Date:** YYYY-MM-DD
- **Phase:** [Setup / Chat / Memory / Tools / Voice / UI / Knowledge / Router]
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
- **Fix:** Changed to use `SQLite.bundledExtensions` API. Added `isVecAvailable()` flag. Made `saveMemory` resilient — fact always saved; vector insert is best-effort.
- **Prevention:** Always use `SQLite.bundledExtensions` API for bundled extensions in expo-sqlite SDK 54+.
- **Status:** FIXED

---

### ERROR-002: memory_query Never Actually Queries the Database
- **Date:** 2026-04-30
- **Phase:** Memory (Phase 3)
- **Severity:** Critical
- **Symptom:** "What do you remember about me?" returns hardcoded "I don't have any memories" even when memories exist.
- **Root Cause:** Orchestrator's `memory_query` handler called `getIdentityResponse(intent)` instead of `memoryEngine.getAllMemories()`.
- **Fix:** Connected to actual memory engine. `memory_query` → `getAllMemories()`. `memory_forget` → `findSimilar()` + `deleteMemory()`.
- **Prevention:** Always wire intent handlers to actual engines — never leave hardcoded placeholders.
- **Status:** FIXED

---

### ERROR-003: Model Saves Minimal Facts Without Context
- **Date:** 2026-04-30
- **Phase:** Memory (Phase 3)
- **Severity:** Medium
- **Symptom:** "My fav actress is Emma Watson" saves just "Emma Watson" as fact. Later search for "favorite actress" finds nothing.
- **Root Cause:** Long-press saves raw message content. No fact extraction step. Embedding for "Emma Watson" is semantically distant from "who is my fav actress".
- **Fix:** Added 200-char limit on long-press. Added regex-based fact extractor with 12 patterns (`fact-extractor.ts`). Patterns like "my X is Y" extract structured facts ("user's favorite actress is Emma Watson").
- **Prevention:** Memory should save structured facts, not raw text.
- **Status:** FIXED

---

### ERROR-004: App Reopens with Last Chat Instead of Fresh
- **Date:** 2026-05-02
- **Phase:** Chat UI
- **Severity:** Medium
- **Symptom:** Closing and reopening Lyla loads the last conversation. User expects a fresh start.
- **Root Cause:** `app/index.tsx` has `loadLastConversation` useEffect that runs on mount and loads the most recent conversation from SQLite.
- **Fix:** Removed auto-load on mount. Start fresh. History accessible via History button on Home dashboard.
- **Prevention:** Default to fresh session; history is explicit navigation.
- **Status:** FIXED

---

### ERROR-005: Context Overflow Crash After Long Conversation
- **Date:** 2026-05-02
- **Phase:** Chat / LLM
- **Severity:** High
- **Symptom:** After 20+ messages, app becomes slow then crashes or silently starts a new chat. Context grows until it exceeds the 8192 token window.
- **Root Cause:** `MAX_CONTEXT_CHARS = 12000` (~3000 tokens) is too generous. With system prompt + memory context + history + new message, the total exceeds 8192 tokens.
- **Fix:** Lowered `MAX_CONTEXT_CHARS` to 6000. Added try-catch in orchestrator. Catch OOM/context overflow and return graceful error.
- **Prevention:** Always estimate token count (chars/4) and stay well under model's n_ctx.
- **Status:** FIXED

---

### ERROR-006: Memory Query Dumps All Memories Instead of Semantic Search
- **Date:** 2026-05-02
- **Phase:** Memory
- **Severity:** Medium
- **Symptom:** "What do you remember about me?" dumps ALL memories as raw text. No semantic relevance filtering.
- **Root Cause:** `memory_query` intent calls `getAllMemories()` which does a raw SQL dump. Should use `findSimilar()` with the user's query embedded.
- **Fix:** Changed to use `findSimilar()` which embeds the query and returns top-K relevant memories.
- **Prevention:** Memory retrieval should always be semantic, not lexical.
- **Status:** FIXED

---

### ERROR-007: Memory Saves Raw Text Without Structured Extraction
- **Date:** 2026-05-02
- **Phase:** Memory
- **Severity:** Medium
- **Symptom:** Long-press saves the entire message as-is. No entity extraction, no categorization.
- **Root Cause:** No fact extraction step. `memoryEngine.addMemory(content)` saves raw content.
- **Fix:** Added `fact-extractor.ts` with 12 regex patterns. Auto-extraction happens after every exchange. Long-press uses `extractFactOrRaw()`.
- **Prevention:** Always extract structured facts before saving to memory.
- **Status:** FIXED

---

### ERROR-008: Router Context Overflow (n_ctx=1024 Too Small)
- **Date:** 2026-05-03
- **Phase:** Router (Phase 2d)
- **Severity:** Critical
- **Symptom:** Router produces garbled/truncated JSON output. Classification accuracy drops significantly. Sometimes returns empty strings or partial JSON.
- **Root Cause:** Router `n_ctx` was set to 1024. With ~50 few-shot examples in the router prompt, the total prompt + output exceeded 1024 tokens. llama.rn silently truncates or produces garbage when context overflows.
- **Fix:** Increased `n_ctx` from 1024 to 2048. Trimmed prompt from ~50 examples to ~30 examples.
- **Prevention:** Always estimate total token count (system prompt + examples + user message + expected output) and set n_ctx with 30% headroom.
- **Status:** FIXED (commit `1b586c3`)

---

### ERROR-009: Router Misclassifies Currency as math_query
- **Date:** 2026-05-03
- **Phase:** Router / Math
- **Severity:** High
- **Symptom:** "Convert 100 USD to INR" gets classified as `math_query` instead of `knowledge_currency`. Math handler tries to evaluate "100 USD to INR" and fails or gives nonsensical results.
- **Root Cause:** Router prompt didn't have explicit disambiguation examples for currency vs math. The word "convert" triggered math classification.
- **Fix:** Added 5+ currency-specific examples to router prompt. Added CRITICAL DISTINCTIONS section. Added currency code detection in math-handler.ts as a safety net (redirects to Knowledge Hub).
- **Prevention:** When two intents overlap, add explicit disambiguation examples and a safety net in the handler.
- **Status:** FIXED (commit `64a5fc0`)

---

### ERROR-010: Router Misclassifies "What Can You Do?" as chat
- **Date:** 2026-05-03
- **Phase:** Router
- **Severity:** Medium
- **Symptom:** "What can you do?" gets classified as `chat` instead of `limitations_query`. Response is a generic Brain-generated answer instead of the curated capabilities list.
- **Root Cause:** Router prompt lacked examples for capabilities/limitations questions. `limitations_query` intent existed but had no few-shot coverage.
- **Fix:** Added examples: "What can you do?" → `limitations_query`, "What are your capabilities?" → `limitations_query`. Made `identity_query` and `limitations_query` always `needs_brain: false`.
- **Prevention:** Ensure every intent has at least 2-3 few-shot examples in the router prompt.
- **Status:** FIXED (commit `64a5fc0`)

---

### ERROR-011: "Who Built You?" Gives Generic Identity Response
- **Date:** 2026-05-03
- **Phase:** Identity Handler
- **Severity:** Medium
- **Symptom:** "Who built you?" / "Who created you?" / "Who made you?" returns the generic "I'm Lyla..." intro instead of the creator-specific response.
- **Root Cause:** Router correctly classifies as `identity_query`, but the identity handler only had a switch statement for `identity_query` → generic response. No keyword matching for creator/model subtypes.
- **Fix:** Added keyword matching in `getIdentityResponse()`: if userMessage contains "built/created/made" → creator response; if contains "model/engine" → model info response.
- **Prevention:** For multi-faceted intents, use keyword matching on the original message to select the appropriate response variant.
- **Status:** FIXED (commit `64a5fc0`)

---

### ERROR-012: TTS Speaker Icon Hidden Behind Tap Overlay
- **Date:** 2026-05-03
- **Phase:** Chat UI
- **Severity:** High
- **Symptom:** Users can't find the TTS/speak button because it's hidden inside a tap-overlay that only appears when you tap the message bubble.
- **Root Cause:** Speaker icon was inside the `showCopy` conditional overlay — only visible after tapping. No visual affordance that TTS exists.
- **Fix:** Moved speaker icon outside the message bubble, always visible on assistant messages as a standalone button. Changed icon from `volume-high-outline` (14px, inside bubble) to standalone 18px icon with active state coloring.
- **Prevention:** Critical interactive elements should always be visible, not hidden behind gestures.
- **Status:** FIXED (commit `64a5fc0`)

---

### ERROR-013: Memory Saves Error Messages as Facts
- **Date:** 2026-05-03
- **Phase:** Memory
- **Severity:** Medium
- **Symptom:** Error messages like "I couldn't find a math expression..." get saved as memories via long-press. These pollute the memory database with useless system messages.
- **Root Cause:** `extractFactOrRaw()` falls back to saving raw text when no regex pattern matches. No filter for error/system messages.
- **Fix:** Added 13 ERROR_PATTERNS to `extractFactOrRaw()`: "couldn't find", "sorry", "error", "failed to", "unavailable", etc. Returns `null` instead of saving. Updated chat.tsx to show "Too long" feedback when null returned.
- **Prevention:** Always validate content before saving to memory. Filter out error messages, system responses, and low-value content.
- **Status:** FIXED (commit `64a5fc0`)

---

### ERROR-014: Invalid Ionicons Names
- **Date:** 2026-05-03
- **Phase:** UI
- **Severity:** Low
- **Symptom:** Icons silently fail to render. `phone-vibrate` and `sparkles-outline` are not valid Ionicons names.
- **Root Cause:** Using icon names that don't exist in the Ionicons library. Ionicons uses different naming conventions.
- **Fix:** `phone-vibrate` → `hardware-chip-outline` (haptic feedback), `sparkles-outline` → `sparkles` (memory).
- **Prevention:** Verify icon names against the Ionicons catalog before use.
- **Status:** FIXED (commit `64a5fc0`)

---

### ERROR-015: Knowledge Hub Falls to Brain Silently on Empty Results
- **Date:** 2026-05-03
- **Phase:** Knowledge
- **Severity:** Medium
- **Symptom:** Knowledge queries return Brain-generated answers without any external data. No indication of why Knowledge Hub failed.
- **Root Cause:** When Knowledge Hub returns 0 results, orchestrator silently falls back to Brain. No logging of the failure reason.
- **Fix:** Added `console.warn()` with intent + query when results are empty: `[Orchestrator] Knowledge Hub returned 0 results for intent=X query="Y"`.
- **Prevention:** Always log why fallback paths are triggered for debugging.
- **Status:** FIXED (commit `64a5fc0`)

---

### ERROR-016: Simulator OOM Crash After Extended Use
- **Date:** 2026-05-03
- **Phase:** Runtime
- **Severity:** High
- **Symptom:** App crashes on iOS Simulator after extended use with both models loaded + knowledge processing.
- **Root Cause:** iOS Simulator has no Metal GPU — all LLM inference runs on CPU, which is 10x slower and uses more RAM. Both models (Router 229MB + Brain 918MB) + embedding (35MB) + React Native baseline (200MB) exceeds simulator RAM budget.
- **Fix:** This is a known simulator limitation. Model swapping helps on real devices. No fix needed for simulator — test on real hardware for accurate performance/RAM behavior.
- **Prevention:** Always test RAM-intensive operations on physical hardware. Simulator is only for UI/logic testing.
- **Status:** KNOWN LIMITATION (not fixable)

---

## Common Pitfalls (Lessons Learned)

1. **1.2B models hallucinate on identity questions** — Never let the LLM handle "who are you" or "who made you". Use hardcoded responses with keyword matching.
2. **expo-sqlite SDK 54 uses `bundledExtensions` API** — Never pass bare extension names.
3. **Context window is the bottleneck** — Always estimate tokens, always trim aggressively. Router: 2048 n_ctx with ~30 examples. Brain: 8192 n_ctx with 6000 char limit.
4. **sqlite-vec MATCH syntax is specific** — Use `WHERE v.embedding MATCH ? AND k = ?`, not `vec_distance_L2()`.
5. **Memory extraction needs structure + filtering** — Raw text saves are useless for semantic retrieval. Error messages must be filtered out.
6. **iOS Simulator has no Metal GPU** — LLM inference is 10x slower on simulator. Always test on real hardware for performance.
7. **expo-localization, expo-battery, expo-device are JS-only** — No native rebuild needed for these packages.
8. **TextInputUI warnings** — Suppress with `LogBox.ignoreLogs(['TextInputState'])`.
9. **`penalty_repeat` not `repeat_penalty`** — llama.rn uses `penalty_repeat` in CompletionParams.
10. **Currency vs Math disambiguation** — Always check for currency codes BEFORE evaluating as math expression.
11. **Router examples need coverage** — Every intent must have 2-3 few-shot examples. Missing examples = misclassification.
12. **Model swapping is transparent** — Orchestrator calls `ensureBrainLoaded()`/`ensureRouterLoaded()` and doesn't care about swap mechanics.
13. **Knowledge Hub is stateless** — Each query is independent. No conversation history is sent to APIs.
14. **Brain DOES get conversation history** — But only when invoked via `handleBrain()` or `handleKnowledge()`, not for direct handlers.
15. **Ionicons naming** — Not all `*-outline` variants exist. Verify against the catalog.
