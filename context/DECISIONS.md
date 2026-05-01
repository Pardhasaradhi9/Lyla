# Decisions Log — Lyla

> Every major decision we've made, why we made it, and what alternatives we rejected.
> **Read this first** before making any changes to the project.

---

## Decision 001: Primary LLM Model → Qwen3 1.7B Abliterated
- **Date:** 2026-04-21
- **Decision:** Use `Qwen3-1.7B-Abliterated` (Q4_K_M GGUF, ~1.0 GB) as the default model.
- **Why:**
  - Best tool calling / JSON structured output of any model in this size class
  - Well-tested abliteration by mlabonne on HuggingFace (minimal quality loss)
  - 119 languages including Hindi, Telugu, Tamil — critical for Indian users
  - Supports both Thinking and Non-Thinking modes natively
- **Rejected Alternatives:**
  - `LFM 2.5 1.2B` — Faster but censored, English-primary, no robust abliterated versions
  - `Gemma 3 1B` — Google's censorship is deeply embedded, harder to abliterate
  - `Qwen 2.5 1.5B` — Older generation, Qwen3 is strictly better
- **Impact:** The app's memory extraction engine depends heavily on reliable JSON output. Qwen3's superior tool calling makes the memory system more reliable.

## Decision 002: Secondary Speed Model → LFM 2.5 1.2B Thinking
- **Date:** 2026-04-21
- **Decision:** Offer `LFM2.5-1.2B-Thinking` (Q4_K_M GGUF, ~700 MB) as an optional speed model.
- **Why:**
  - 7x faster inference than Qwen3 on mobile NPUs
  - Lower battery consumption (hybrid LIV architecture)
  - Excellent "thinking" mode for complex reasoning
  - Smallest footprint (~700 MB vs 1.0 GB)
- **Note:** This is censored. Users who want uncensored + speed can import their own model.

## Decision 003: Embedding Model → snowflake-arctic-embed:33m
- **Date:** 2026-04-21
- **Decision:** Use `snowflake-arctic-embed:33m` (GGUF format) for memory vector embeddings.
- **Why:**
  - 33M params, ~384-dim vectors — tiny and fast on mobile
  - Better retrieval quality than all-MiniLM of similar size
  - Newer architecture with superior training
  - Available in GGUF format — can be loaded via llama.rn (no need for separate ONNX runtime)
- **Rejected Alternatives:**
  - `all-minilm:22m` — Industry standard but older, lower quality retrieval
  - `all-minilm:33m` — Similar but Snowflake has better training methodology
  - `snowflake-arctic-embed:22m` — Viable but 33m is only 11M params more for meaningfully better quality
  - `granite-embedding:30m` — Good but less tested in GGUF format for mobile

## Decision 004: App Framework → React Native (Expo with prebuild)
- **Date:** 2026-04-21
- **Decision:** Use React Native with Expo (using `npx expo prebuild` for native modules).
- **Why:**
  - Single codebase for iOS + Android
  - `llama.rn`, `whisper.rn` are React Native native modules
  - Expo provides excellent developer experience (hot reload, OTA updates for JS)
  - Prebuild generates native iOS/Android projects for native module linking
- **Rejected Alternatives:**
  - Tauri v2 — Great for desktop but mobile support is less mature than RN
  - Flutter — No mature llama.cpp bindings
  - Native Swift/Kotlin — Two codebases to maintain, slower development

## Decision 005: Memory Database → SQLite + sqlite-vec
- **Date:** 2026-04-21
- **Decision:** Use SQLite with the `sqlite-vec` extension for vector similarity search.
- **Why:**
  - SQLite is already embedded in every iOS/Android device
  - `sqlite-vec` is pure C, zero dependencies, pre-compiled for mobile
  - Integrates via `op-sqlite` React Native library
  - Brute-force KNN is fast enough for <100K vectors on mobile
- **Rejected Alternatives:**
  - ChromaDB — Requires Python runtime, not viable on mobile
  - Pinecone/Weaviate — Cloud services, violates our privacy principle
  - FAISS — Complex to compile for mobile, heavy dependencies

## Decision 006: Speech-to-Text → whisper.rn
- **Date:** 2026-04-21
- **Decision:** Use `whisper.rn` with `ggml-tiny.en.bin` (~75 MB) for on-device STT.
- **Why:**
  - Direct React Native binding for whisper.cpp
  - CoreML acceleration on iOS, CPU on Android
  - Supports real-time transcription + file transcription
  - Built-in Silero VAD (Voice Activity Detection)
  - 75 MB model is tiny enough to bundle or download once
- **Note:** Start with tiny.en (English). Add base multilingual model later for Hindi/Telugu support.

## Decision 007: Text-to-Speech → expo-speech (V1) → Piper (V2)
- **Date:** 2026-04-21
- **Decision:** Use `expo-speech` (OS native TTS) for V1. Upgrade to Piper TTS in V2.
- **Why:**
  - expo-speech wraps iOS AVSpeechSynthesizer and Android TextToSpeech
  - Zero model download, zero setup, works offline
  - Quality is "decent" not "premium" — acceptable for V1
  - Piper has no official React Native wrapper yet — needs custom native module (V2 effort)
- **Trade-off:** OS voices sound robotic. This is a V1 compromise for shipping speed.

## Decision 008: Web Search → DuckDuckGo HTML Scraping
- **Date:** 2026-04-21
- **Decision:** Use DuckDuckGo's HTML lite endpoint for web search grounding.
- **Why:**
  - Free, no API key required
  - Simple HTML parsing (no complex API integration)
  - Privacy-aligned (DuckDuckGo doesn't track users)
  - Lightweight enough for mobile
- **Rejected Alternatives:**
  - Brave Search API — Requires API key registration, free tier is limited
  - Google Search API — Costs money, tracks users
  - Bing API — Requires Azure account

## Decision 009: V1 Feature Scope → 6 Features
- **Date:** 2026-04-21
- **Decision:** Ship V1 with exactly 6 features:
  1. Private local LLM chat (streaming)
  2. Persistent memory (auto-extract + correct + recall)
  3. Online search grounding (DuckDuckGo when connected)
  4. Chat history (stored locally, searchable)
  5. Voice input (Whisper STT)
  6. Voice output (OS native TTS)
- **Why:** User's explicit instruction: "fewer features that work 100% rather than 10 features that break."

## Decision 010: Distribution → Open Source + APK + App Stores Later
- **Date:** 2026-04-21
- **Decision:** Build open source. Distribute Android APKs via GitHub Releases first. App Store/Play Store later.
- **Why:** Zero cost to start. Build community trust. iOS requires ₹9,603/yr developer account — defer until demand exists.

## Decision 011: Orchestration Layer → TypeScript Intent Router Before LLM
- **Date:** 2026-04-30
- **Decision:** Add a deterministic TypeScript orchestration layer between the user and the LLM. Identity questions, greetings, and real-time factual queries are intercepted and answered WITHOUT the model.
- **Why:**
  - 1.2B models hallucinate severely on identity questions ("who are you", "who made you")
  - 1.2B models fabricate URLs, statistics, and real-time data
  - Pattern matching is 100% reliable for these categories — zero hallucination risk
  - Research confirmed: scaffolding (routing, guardrails) is the force multiplier for sub-2B models, not raw model intelligence
  - LFM2.5-1.2B was trained with native tool-calling tokens — we can leverage this for Phase 3/4
- **Architecture:**
  - `intent-classifier.ts` — Regex-based, 9 intent types
  - `identity-handler.ts` — Hardcoded responses (randomized for variety)
  - `factual-guard.ts` — Detects weather/prices/news → graceful deflection
  - `response-formatter.ts` — Strips markdown/tokens from model output
  - `tool-definitions.ts` — LFM2.5 tool-calling schemas (Phase 3/4)
  - `index.ts` — Main orchestrator tying the pipeline together
- **Rejected Alternatives:**
  - Pure system prompt approach — Failed. Model ignores instructions at 1.2B scale.
  - Separate classifier model (e.g., 270M router) — Overhead not justified yet. TypeScript regex is faster and deterministic.
- **Impact:** This is the "brain" that makes Lyla's 1.2B model actually useful. The model only handles what it's good at: creative, open-ended conversation.

## Decision 012: System Prompt → Shortened for 1.2B Instruction Following
- **Date:** 2026-04-30
- **Decision:** Replaced the long system prompt with a 4-line, high-urgency instruction set.
- **Why:** Research confirmed that 1.2B models lose coherence with long system prompts. The orchestrator now handles identity/factual routing, so the model only needs minimal behavioral rules (be concise, don't guess facts, talk like a friend).
- **Previous prompt:** 5 critical rules, PrepMyRez mention, identity instructions — 800+ chars
- **New prompt:** 4 rules, 250 chars. Identity handled by orchestrator.
