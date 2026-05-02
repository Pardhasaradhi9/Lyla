# Decisions Log — Lyla

> Every major decision with rationale. Read before making changes.
> Last Updated: 2026-05-02

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

## Decision 003: Extraction Model → LFM2-350M-Extract (Q4_K_M)
- **Date:** 2026-05-02
- **Decision:** Use `LFM2-350M-Extract` (Q4_K_M, 229 MB) for structured fact extraction from conversations.
- **Why:**
  - Same size as Router — shares the same RAM slot (model swapping)
  - Purpose-built for converting unstructured text → structured JSON/XML/YAML
  - Directly designed for: entity extraction, fact extraction, knowledge graph population
  - ChatML format — same integration as Router
- **Note:** Router and Extractor swap in/out of the same RAM slot. Only one is loaded at a time.

## Decision 004: Embedding Model → Snowflake Arctic Embed S
- **Date:** 2026-04-21
- **Decision:** Use `snowflake-arctic-embed-s` (Q8_0, 35 MB) for memory vector embeddings.
- **Why:**
  - 384-dim vectors — tiny and fast
  - Better retrieval quality than all-MiniLM of similar size
  - Available in GGUF — loads via llama.rn (no separate ONNX runtime)
  - 35 MB — negligible RAM footprint, always loaded

## Decision 005: App Framework → React Native (Expo Prebuild)
- **Date:** 2026-04-21
- **Decision:** React Native 0.81.5 + Expo SDK 54 with `npx expo prebuild`.
- **Why:**
  - Single codebase for iOS + Android
  - `llama.rn`, `whisper.rn` are React Native native modules
  - Expo provides OTA JS updates, excellent dev experience
  - Prebuild generates native projects for custom native modules
  - New Architecture (Fabric + TurboModules) for 60fps streaming

## Decision 006: Memory Database → SQLite + sqlite-vec
- **Date:** 2026-04-21
- **Decision:** expo-sqlite with sqlite-vec bundled extension for vector search.
- **Why:**
  - expo-sqlite is Expo-native, ships with SDK 54
  - sqlite-vec via `withSQLiteVecExtension: true` in app.json — zero config
  - KNN search is fast enough for <100K vectors on mobile
  - All data in one database file — simple backup/clear

## Decision 007: System Architecture → System Intelligence (Not Chatbot)
- **Date:** 2026-05-02
- **Decision:** Lyla is a system intelligence where the LLM is the brain and device tools/APIs are the body. The orchestrator routes through the system first, brain second.
- **Why:**
  - A 1.2B model is too small to handle everything via LLM alone
  - Deterministic tools (time, battery, calendar) are 100% reliable — zero hallucination
  - The LLM should only handle what it's good at: creative reasoning, synthesis, complex queries
  - This is how real systems (Jarvis, Alexa) work — the "intelligence" comes from connecting tools, not from the model alone
- **Impact:** Every new feature is a Tool in the registry, not a special case in the codebase

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
- **Impact:** Model manager must detect device RAM at startup and download appropriate quantization

## Decision 009: Voice → Whisper Tiny EN + expo-speech
- **Date:** 2026-04-21 (reaffirmed 2026-05-02)
- **Decision:** Use whisper.rn with ggml-tiny.en.bin for STT. expo-speech for TTS.
- **Why:**
  - whisper.rn: direct RN binding for whisper.cpp, CoreML acceleration on iOS
  - tiny.en: 75 MB, fast, accurate for English
  - expo-speech: zero-setup, OS-native, works offline
  - Future: upgrade to base multilingual for Hindi/Telugu support

## Decision 010: Web Search → DuckDuckGo HTML
- **Date:** 2026-04-21 (reaffirmed 2026-05-02)
- **Decision:** DuckDuckGo HTML lite endpoint, parsed with cheerio.
- **Why:** Free, no API key, privacy-aligned, simple HTML parsing
- **Rejected:** Brave Search (API key required), Google/Bing (cost + tracking)

## Decision 011: Identity → PrepMyRez
- **Date:** 2026-04-21
- **Decision:** Lyla is built by PrepMyRez (prepmyrez.com). This identity is baked into the system prompt.
- **Why:** Consistent branding, honest attribution

## Decision 012: STT → whisper.rn
- **Date:** 2026-04-21
- **Decision:** Use whisper.rn with ggml-tiny.en.bin for on-device speech-to-text.
- **Why:** Direct RN binding, CoreML on iOS, real-time transcription, 75 MB model

## Decision 013: File Understanding → RAG Pipeline (Future)
- **Date:** 2026-05-02
- **Decision:** Future feature: users can import files (PDFs, receipts, notes) and query them. Implementation: file picker → parse → chunk → embed → store in sqlite-vec → query with semantic search.
- **Why:** Arctic Embed already supports this. Just needs file picker + PDF parser.
- **Timeline:** V2 (after core system is stable)
