# Progress Tracker — Lyla

> **STATUS: Phase 1 Complete — Phase 2 Starting**
> Last Updated: 2026-05-02

---

## Current State

Lyla is a **working on-device AI assistant** running on physical iPhone hardware. It has:
- Streaming LLM chat with the 1.2B model
- Deterministic intent routing (9 intents)
- Native device APIs (time, battery, device info)
- Vector memory (semantic save/search)
- Chat persistence (SQLite)
- Custom app icon
- Dark theme UI

**What it lacks**: Multi-model routing, tool calling, auto-memory extraction, calendar/contacts integration, voice, web search. It currently works as a smart chatbot — it needs to become a system intelligence.

---

## Phase 1: Foundation (COMPLETE)

- [x] Expo project initialized (SDK 54, New Architecture)
- [x] All core dependencies installed
- [x] Folder structure created (engines/, db/, stores/, orchestrator/, theme/, utils/)
- [x] OLED dark theme (colors, typography, spacing)
- [x] Zustand stores (app-store, chat-store, settings-store)
- [x] Expo Router configured (chat, settings, history)
- [x] Engine stubs with interfaces
- [x] Database schema (conversations, messages, memories, memory_vectors)
- [x] Model manager (download, cache via expo-file-system)

## Phase 2.5: Orchestration Layer (COMPLETE)

- [x] Intent classifier (pattern-based, 9 intents)
- [x] Identity handler (hardcoded zero-hallucination responses)
- [x] Factual guard (intercepts real-time questions)
- [x] Response formatter (strips tokens, extracts thinking traces)
- [x] Main orchestrator (ties intent → handler → LLM pipeline)
- [x] System prompt (shortened for 1.2B instruction-following)

## Phase 3: Memory Engine (COMPLETE)

- [x] SQLite database initialization (expo-sqlite)
- [x] sqlite-vec extension loaded via bundled extensions
- [x] Chat Repository (CRUD for conversations + messages)
- [x] Memory Repository (CRUD + vector search)
- [x] Embedding engine (Arctic Embed via llama.rn)
- [x] Memory engine (coordinates embedding + repository)
- [x] Orchestrator auto-injects retrieved memories into LLM context
- [x] Long-press to save memory
- [x] "Clear All Memories" in settings

## Phase 3.5: Native Device Tools (COMPLETE)

- [x] Device handlers: timezone-aware time, battery, device info
- [x] 4 new intents: identity_query, limitations_query, battery_query, device_query
- [x] Updated identity handler with accurate responses
- [x] 200-char limit on long-press memory saves
- [x] Custom iOS app icon (all sizes generated from 1024x1024 master)
- [x] Suppressed TextInputUI warnings with LogBox.ignoreLogs

## iOS Device Testing (COMPLETE)

- [x] App running on physical iPhone
- [x] Model downloading and loading successfully
- [x] All native intents work (time, battery, device, identity, limitations)
- [x] LLM streaming responses working
- [x] Memory save/recall working
- [x] Performance: superfast on real hardware (Metal GPU acceleration)

## Bugs Found During Testing (FIXED)

- [x] **BUG-004**: App reopens with last chat instead of fresh chat
- [x] **BUG-005**: Context overflow crash after long conversations
- [x] **BUG-006**: Memory query dumps raw messages instead of semantic results
- [x] **BUG-007**: Memory saves raw text, not structured facts
- [x] **BUG-008**: Slowdown after long conversation (context grows too large)

---

## What's Next: Phase 2 — System Rearchitecture

### Phase 2a: Bug Fixes + Orchestrator Rearch (JS-only, no rebuild) — COMPLETE
- [x] Fix BUG-004: Start fresh on app open
- [x] Fix BUG-005: Context overflow protection
- [x] Fix BUG-006: Semantic memory query
- [x] Fix BUG-007: Fact extraction (regex-based, no LLM)
- [x] Fix BUG-008: Lower MAX_CONTEXT_CHARS
- [x] Rearchitect orchestrator with tool loop
- [x] Create system state object
- [x] Create tool registry with schemas

### Phase 2b: Batch Native Package Install (one rebuild)
- [ ] Install: expo-local-authentication, expo-calendar, expo-contacts, expo-secure-store, expo-notifications, expo-task-manager, expo-background-fetch, expo-crypto
- [ ] Run `npx expo prebuild --clean`
- [ ] Rebuild iOS + Android
- [ ] Test on device

### Phase 2c: JS-Only Features (no rebuild)
- [ ] Haptic feedback (expo-haptics — already installed)
- [ ] Clipboard tool (expo-clipboard — already installed)
- [ ] Text-to-speech (expo-speech — already installed)
- [ ] Network-aware routing

### Phase 2d: 350M Router Model Integration
- [ ] Download and test LFM2.5-350M Q4_K_M
- [ ] Download and test LFM2-350M-Extract Q4_K_M
- [ ] Implement model manager with device-aware model selection
- [ ] Implement model swapping (Router ↔ Brain)
- [ ] Wire Router into orchestrator for fast intent classification
- [ ] Wire Extractor into auto-memory pipeline

### Phase 2e: Voice Pipeline
- [ ] Install whisper.rn
- [ ] Download ggml-tiny.en.bin
- [ ] Implement push-to-talk UI
- [ ] Wire STT → orchestrator → TTS loop

### Phase 2f: Web Search
- [ ] Implement DuckDuckGo HTML search
- [ ] Parse results with cheerio
- [ ] Inject search results into LLM context
- [ ] Graceful offline fallback

---

## Git Status

- **Last commit**: d704d5f "feat: Phase 1 complete - native device tools + bug fixes"
- **Branch**: main
- **Remote**: pushed

---

## File Structure (Current)

```
/Users/pardhasaradhichukka/Desktop/Lyla/
├── context/                    # THIS FOLDER — read first
├── research/                   # User research documents
│   └── new research/           # Model selection + RAM budget research
├── ios_icons/                  # iOS icon set (source)
├── App_icon.png                # Master app icon (1024x1024)
└── app/                        # React Native project root
    ├── app/                    # Expo Router screens
    │   ├── _layout.tsx
    │   ├── index.tsx           # Chat screen
    │   ├── settings.tsx
    │   └── history.tsx
    ├── src/
    │   ├── orchestrator/       # Message routing + device handlers
    │   ├── engines/            # LLM, memory, embeddings, TTS
    │   ├── db/                 # SQLite + sqlite-vec
    │   ├── stores/             # Zustand state
    │   ├── utils/              # Constants, prompts, model manager
    │   └── theme/              # Colors, typography, spacing
    ├── ios/                    # Native iOS project (prebuilt)
    ├── android/                # Native Android project (prebuilt)
    └── assets/                 # Icons, splash, favicon
```

---

## Agent Handoff Instructions

> **If you are a new agent picking up this project:**
> 1. Read ALL files in `/context/` folder — start with ARCHITECTURE.md
> 2. Read PROJECT_IDENTITY.md to understand the VISION (system intelligence, not chatbot)
> 3. Read TECH_STACK.md for exact versions and configurations
> 4. Read this PROGRESS.md for current status
> 5. Read DECISIONS.md to understand WHY things were decided
> 6. Read IMPLEMENTATION_PLAN.md for what to build next
> 7. Read ERRORS_AND_SOLUTIONS.md to avoid repeating mistakes
> 8. Continue from Phase 2a
