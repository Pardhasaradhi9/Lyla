# Decisions Log — Lyla

> Every major decision with rationale. Read before making changes.
> Last Updated: 2026-05-03

---

## Decision 001: Primary Brain → LFM2.5-1.2B-Instruct (Abliterated)
- **Date:** 2026-04-30
- **Decision:** Use `Huihui-LFM2.5-1.2B-Instruct-abliterated` (Q6_K, 918 MB) as the primary reasoning model.
- **Why:**
  - Native tool-calling support via `<|tool_call_start|>/<|tool_call_end|>` tokens
  - Hybrid LIV architecture (attention + convolution) — fast on mobile
  - Abliterated — no refusals, follows all instructions
  - ChatML format — clean integration with llama.rn
  - Trained on 28T tokens — overtrained for quality at small size
- **Rejected:** Qwen3-1.7B (too large), Gemma-3-1B (censored, no tool calling), Phi-4-mini (2.5 GB)
- **Status:** ACTIVE — loaded as Brain model on 6GB+ devices

## Decision 002: Router Model → LFM2.5-350M (Q4_K_M)
- **Date:** 2026-05-02
- **Decision:** Use `LFM2.5-350M` (Q4_K_M, 229 MB) as the always-loaded router model.
- **Why:**
  - Same architecture family as the Brain — consistent ChatML format
  - Native tool calling support (same `<|tool_call_start|>` tokens)
  - 229 MB — fits on ALL devices including 4 GB phones
  - 188 tok/s on Snapdragon, 313 tok/s on AMD — sub-50ms for short inputs
  - IFEval 76.96 — best-in-class instruction following for sub-500M
  - Trained on 28T tokens — extreme overtraining = reliable structured output
- **Rejected:** Gemma-3-270M (no tool calling, Google-censored), Qwen3-0.6B (500 MB, too large for router), SmolLM2-360M (weaker IFEval)
- **Status:** ACTIVE — classifies all 27 intents via few-shot prompting

## Decision 003: Extraction Model → LFM2-350M-Extract (Q4_K_M)
- **Date:** 2026-05-02
- **Decision:** Use `LFM2-350M-Extract` (Q4_K_M, 229 MB) for structured fact extraction from conversations.
- **Why:**
  - Same size as Router — shares the same RAM slot (model swapping)
  - Purpose-built for converting unstructured text → structured JSON/XML/YAML
  - Directly designed for: entity extraction, fact extraction, knowledge graph population
  - ChatML format — same integration as Router
- **Note:** Router and Extractor swap in/out of the same RAM slot. Only one is loaded at a time.
- **Status:** PLANNED — model config defined, `extractFacts()` method exists in router.ts, not yet wired into auto-memory pipeline

## Decision 004: Embedding Model → Snowflake Arctic Embed S
- **Date:** 2026-04-21
- **Decision:** Use `snowflake-arctic-embed-s` (Q8_0, 35 MB) for memory vector embeddings.
- **Why:**
  - 384-dim vectors — tiny and fast
  - Better retrieval quality than all-MiniLM of similar size
  - Available in GGUF — loads via llama.rn (no separate ONNX runtime)
  - 35 MB — negligible RAM footprint, always loaded
- **Status:** ACTIVE — powers memory save/retrieval + knowledge cache

## Decision 005: App Framework → React Native (Expo Prebuild)
- **Date:** 2026-04-21
- **Decision:** React Native 0.81.5 + Expo SDK 54 with `npx expo prebuild`.
- **Why:**
  - Single codebase for iOS + Android
  - `llama.rn`, `whisper.rn` are React Native native modules
  - Expo provides OTA JS updates, excellent dev experience
  - Prebuild generates native projects for custom native modules
  - New Architecture (Fabric + TurboModules) for 60fps streaming
- **Status:** ACTIVE — all 35 dependencies installed, prebuilt for iOS

## Decision 006: Memory Database → SQLite + sqlite-vec
- **Date:** 2026-04-21
- **Decision:** expo-sqlite with sqlite-vec bundled extension for vector search.
- **Why:**
  - expo-sqlite is Expo-native, ships with SDK 54
  - sqlite-vec via `withSQLiteVecExtension: true` in app.json — zero config
  - KNN search is fast enough for <100K vectors on mobile
  - All data in one database file — simple backup/clear
- **Status:** ACTIVE — stores conversations, messages, memories, memory_vectors, knowledge_cache

## Decision 007: System Architecture → System Intelligence (Not Chatbot)
- **Date:** 2026-05-02
- **Decision:** Lyla is a system intelligence where the LLM is the brain and device tools/APIs are the body. The orchestrator routes through the system first, brain second.
- **Why:**
  - A 1.2B model is too small to handle everything via LLM alone
  - Deterministic tools (time, battery, calendar) are 100% reliable — zero hallucination
  - The LLM should only handle what it's good at: creative reasoning, synthesis, complex queries
  - This is how real systems (Jarvis, Alexa) work — the "intelligence" comes from connecting tools, not from the model alone
- **Impact:** Every new feature is a Tool in the registry, not a special case in the codebase
- **Status:** ACTIVE — 6-stage orchestrator pipeline with 27 intents

## Decision 008: Model Loading → Device-Aware + Model Swapping
- **Date:** 2026-05-02
- **Decision:** Automatically detect device RAM and load appropriate model variants. Cannot load Router + Brain simultaneously on most phones.
- **Why:**
  - RAM research: 4 GB phones have ~1.5 GB safe app budget, 6 GB phones ~2.5 GB
  - Router (229 MB) + Brain Q6 (918 MB) + RN baseline (200 MB) + embedding (35 MB) = ~1.4 GB minimum
  - Brain Q6 at 8K context uses 2.8-3.5 GB alone — exceeds budget on 4 GB devices
  - Solution: Load Router by default, swap to Brain on demand
  - 4 GB devices: Brain uses Q4_K_M at 4K context (~600 MB, fits)
  - 6 GB+ devices: Brain uses Q6_K at 8K context (full power)
  - 7 GB+ devices: Both models loaded simultaneously (no swapping)
- **Status:** ACTIVE — model-swapper.ts with `ensureBrainLoaded()`/`ensureRouterLoaded()`

## Decision 009: Voice → Whisper Tiny EN + expo-speech
- **Date:** 2026-04-21 (reaffirmed 2026-05-02)
- **Decision:** Use whisper.rn with ggml-tiny.en.bin for STT. expo-speech for TTS.
- **Why:**
  - whisper.rn: direct RN binding for whisper.cpp, CoreML acceleration on iOS
  - tiny.en: 75 MB, fast, accurate for English
  - expo-speech: zero-setup, OS-native, works offline
  - Future: upgrade to base multilingual for Hindi/Telugu support
- **Status:** TTS ACTIVE, STT PLANNED — `engines/stt.ts` is empty placeholder

## Decision 010: Knowledge Hub → 9 Free APIs (Not Web Search)
- **Date:** 2026-05-03
- **Decision:** Replace planned DuckDuckGo web search with a curated Knowledge Hub of 9 free APIs (Wikipedia, Wikidata, Open-Meteo, REST Countries, Open Library, OpenAlex, Free Dictionary, ExchangeRate, Nager.Date).
- **Why:**
  - Free, no API keys required, privacy-aligned
  - Structured data (not scraped HTML) — more reliable for Brain synthesis
  - Covers 8 knowledge domains: weather, countries, books, papers, dictionary, currency, holidays, general
  - SQLite cache with per-source TTLs — minimizes redundant API calls
  - Direct HTTP from device — no backend relay, preserves privacy
- **Rejected:** DuckDuckGo HTML (fragile scraping), Brave Search (API key), Google/Bing (cost + tracking)
- **Status:** ACTIVE — 9 API wrappers in `src/knowledge/apis/`, per-message globe toggle

## Decision 011: Identity → PrepMyRez
- **Date:** 2026-04-21
- **Decision:** Lyla is built by PrepMyRez (prepmyrez.com). This identity is baked into the system prompt.
- **Why:** Consistent branding, honest attribution
- **Status:** ACTIVE — hardcoded in identity-handler.ts

## Decision 012: Intent Classification → Model-Based (Not Regex)
- **Date:** 2026-05-03
- **Decision:** Replace regex-based intent classifier with 350M Router model classification. Regex was ~60-70% accurate; model-based classification handles edge cases and ambiguity better.
- **Why:**
  - Regex couldn't handle: currency vs math disambiguation, creator vs identity questions, capabilities questions
  - Router model with ~30 few-shot examples achieves much higher accuracy
  - n_ctx=2048 provides enough room for comprehensive examples
  - ~300-500ms on real device — acceptable latency for classification
- **Rejected:** FastText/MobileBERT (would need separate runtime, llama.rn can't run BERT)
- **Status:** ACTIVE — `router.ts` handles all 27 intents, legacy `intent-classifier.ts` unused

## Decision 013: Math → mathjs (Not Lightweight Parser)
- **Date:** 2026-05-03
- **Decision:** Use `mathjs` (200KB bundle) instead of a lightweight custom expression parser.
- **Why:**
  - Full-featured: arithmetic, trigonometry, percentages, unit conversions
  - Hermes-compatible (pure JavaScript, no Node.js APIs)
  - Built-in expression sanitization and security
  - Handles edge cases: `sqrt(144)`, `2^10`, `sin(pi/4)`, `15% of 2400`
- **Rejected:** Custom parser (fragile, incomplete), `expr-eval` (limited features)
- **Status:** ACTIVE — `math-handler.ts` with currency code detection guard

## Decision 014: Knowledge Queries → Always Through Brain
- **Date:** 2026-05-03
- **Decision:** All Knowledge Hub results ALWAYS go through the Brain for synthesis, never shown raw to the user.
- **Why:**
  - Raw API data is unstructured and hard to read
  - Brain synthesizes information into coherent, cited responses
  - User chose quality over speed
  - Graceful degradation: if Brain unavailable, falls back to formatted raw results
- **Status:** ACTIVE — `handleKnowledge()` in orchestrator always calls Brain

## Decision 015: Fact Extraction → Regex First, LLM Fallback
- **Date:** 2026-05-03
- **Decision:** Auto-extract facts from conversations using 12 regex patterns first, falling back to 350M Extractor model only when regex fails.
- **Why:**
  - Regex is instant (0ms) — covers common patterns like "my name is X", "I work at Y"
  - LLM extraction adds 300-500ms latency — only use when needed
  - Error messages filtered via 13 ERROR_PATTERNS to prevent saving garbage
- **Status:** ACTIVE — `fact-extractor.ts` with regex, LLM fallback wired but Extractor model not yet active

## Decision 016: Unified Download → Single Button
- **Date:** 2026-05-03
- **Decision:** Single "Download Everything (~1.2GB)" button that downloads Router → Brain → Embedding sequentially.
- **Why:**
  - Simpler UX — user doesn't need to understand model roles
  - Sequential download avoids conflicts
  - Progress tracking per phase: router → brain → embedding → loading → done
- **Status:** ACTIVE — `downloadingPhase` state in app-store

## Decision 017: File Understanding → RAG Pipeline (Future)
- **Date:** 2026-05-02
- **Decision:** Future feature: users can import files (PDFs, receipts, notes) and query them. Implementation: file picker → parse → chunk → embed → store in sqlite-vec → query with semantic search.
- **Why:** Arctic Embed already supports this. Just needs file picker + PDF parser.
- **Timeline:** V2 (after core system is stable)
- **Status:** PLANNED

## Decision 018: Router Context → 2048 (Not 1024)
- **Date:** 2026-05-03
- **Decision:** Increase Router n_ctx from 1024 to 2048 tokens.
- **Why:**
  - With ~50 few-shot examples, the prompt exceeded 1024 tokens
  - Router was producing truncated/garbled output due to context overflow
  - Trimmed to ~30 examples, fits comfortably in 2048
- **Impact:** All classification is now reliable; no more garbled JSON output
- **Status:** ACTIVE — `ROUTER_CONFIG.n_ctx = 2048`
