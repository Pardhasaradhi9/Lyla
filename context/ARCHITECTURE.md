# Lyla System Architecture

> **READ THIS FIRST.** This is the most important file in the context folder.
> It defines what Lyla IS — not a chatbot, a system intelligence.
> Last Updated: 2026-05-03

---

## The Core Idea

Lyla is **not** an LLM chatbot with features bolted on. Lyla is a **system intelligence** — a body (tools, sensors, memory, APIs) that has been given a brain (LLM). The brain makes the system smart. The system makes the brain useful. Neither works alone.

```
Traditional Chatbot:     User → LLM → Response
Traditional System:      User → Rules/APIs → Response
Lyla:                    User → System → Brain ↔ System → Response
```

A 1.2B model is "dumb" by itself. But a 1.2B model that can read your calendar, search your contacts, query your battery, remember your preferences, set reminders, read your clipboard, convert currencies, look up definitions, check the weather, solve math, and reason over all of it — that's a **system intelligence**.

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                       USER INPUT                         │
│                    (text / voice)                         │
└──────────────────────────┬──────────────────────────────┘
                           ▼
                  ┌───────────────────┐
                  │   ORCHESTRATOR    │  The decision engine
                  │                   │
                  │  1. Classify      │  350M Router: ~300-500ms on device
                  │  2. Direct Handle │  6 zero-LLP handlers
                  │  3. Tool Execute  │  10+ native tools
                  │  4. Knowledge Hub │  9 free APIs → Brain synthesis
                  │  5. Brain Reason  │  1.2B synthesis + citations
                  │  6. Learn         │  Auto-extract facts
                  └────────┬──────────┘
                           │
              ┌────────────┼────────────────────┐
              ▼            ▼                    ▼
       ┌────────────┐ ┌──────────────┐ ┌──────────────┐
       │ TOOL LAYER  │ │    BRAIN     │ │ MEMORY LAYER │
       │             │ │   (LLM(s))   │ │              │
       │ Calendar    │ │              │ │ Facts DB     │
       │ Contacts    │ │ 350M Router  │ │ Vector DB    │
       │ Battery     │ │ 350M Extract │ │ Auto-extract │
       │ Clipboard   │ │ 1.2B Brain   │ │ Semantic     │
       │ Network     │ │              │ │ search       │
       │ Time/Date   │ │ Arctic Embed │ │ (sqlite-vec) │
       │ Reminders   │ │ (384-dim)    │ │              │
       │ TTS / STT   │ │              │ │              │
       │ Biometrics  │ │              │ │              │
       │ Math (mathjs)│ │             │ │              │
       └──────┬──────┘ └──────┬───────┘ └──────┬───────┘
              │               │                │
              ▼               ▼                ▼
       ┌─────────────────────────────────────────────┐
       │              SYSTEM STATE                    │
       │  What Lyla KNOWS right now:                  │
       │                                              │
       │  • Current time + timezone                   │
       │  • Battery level + charging state            │
       │  • Device model, OS, name                    │
       │  • Network status (online/offline)           │
       │  • Today's calendar events                   │
       │  • Contact list (indexed, searchable)        │
       │  • All memories (semantically searchable)    │
       │  • Recent clipboard content                  │
       │  • Active reminders                          │
       │  • Conversation context                      │
       └─────────────────────────────────────────────┘

       ┌─────────────────────────────────────────────┐
       │           KNOWLEDGE HUB (9 APIs)             │
       │  Per-message globe toggle (🌐)               │
       │                                              │
       │  • Wikipedia    — general knowledge          │
       │  • Wikidata     — structured facts           │
       │  • Open-Meteo   — weather + geocoding        │
       │  • REST Countries — country info             │
       │  • Open Library — books                      │
       │  • OpenAlex     — research papers            │
       │  • Free Dictionary — word definitions        │
       │  • ExchangeRate — currency conversion        │
       │  • Nager.Date   — public holidays            │
       │                                              │
       │  SQLite cache with per-source TTLs           │
       │  Always through Brain for synthesis          │
       └─────────────────────────────────────────────┘
```

---

## Multi-Model Strategy (RAM-Constrained)

Phones have limited RAM. We cannot load all models simultaneously.

### Device Profiles

| Device | Safe App Budget | Strategy |
|---|---|---|
| **4 GB** (iPhone 12/13) | ~1.5 GB | 350M Router (default) + 1.2B Q4 @ 4K ctx (swap in) |
| **6 GB** (iPhone 15/16) | ~2.5 GB | 350M Router (default) + 1.2B Q6 @ 8K ctx (swap in) |
| **7 GB+** (iPad Pro) | ~3.5 GB | 350M Router + 1.2B Brain both loaded simultaneously |

### Model Roles

| Role | Model | Quant | Size | Context | Always Loaded? |
|---|---|---|---|---|---|
| **Router** | LFM2.5-350M | Q4_K_M | 229 MB | 2048 | Yes (on all devices) |
| **Extractor** | LFM2-350M-Extract | Q4_K_M | 229 MB | 2048 | Swaps with Router |
| **Brain (4GB)** | LFM2.5-1.2B-Instruct (abliterated) | Q4_K_M | ~600 MB | 4096 | No — swap in on demand |
| **Brain (6GB+)** | LFM2.5-1.2B-Instruct (abliterated) | Q6_K | 918 MB | 8192 | No — swap in on demand |
| **Embedding** | Arctic Embed S | Q8_0 | 35 MB | 512 | Yes |
| **STT** | Whisper Tiny EN | — | 75 MB | — | Load on demand |

### Model Swapper Logic (model-swapper.ts)

```typescript
interface DeviceProfile {
  totalMemoryMB: number;
  brainQuant: 'Q4_K_M' | 'Q6_K';
  canLoadBoth: boolean;   // >= 7168 MB
}

swapToBrain():
  if !canLoadBoth → release Router
  load Brain → setActiveModel('brain')

swapToRouter():
  if !canLoadBoth → release Brain
  load Router → setActiveModel('router')
```

### Unified Download Flow

Single "Download Everything (~1.2GB)" button in chat screen:
1. Download Router (229MB) → update progress
2. Download Brain (918MB) → update progress
3. Download Embedding (35MB) → update progress
4. Load all models → ready

State tracked via `downloadingPhase`: `idle | router | brain | embedding | loading | done`

---

## Orchestrator Loop (The Nervous System)

This is the heart of Lyla. Every user message goes through this 6-stage pipeline:

```
User Message
     │
     ▼
┌──────────────┐
│  1. CLASSIFY  │  350M Router model (n_ctx=2048, ~30 few-shot examples)
│  (~300-500ms) │  Returns: { intent, needs_brain }
└──────┬───────┘  Validated against VALID_INTENTS set (27 intents)
       │
       ├── 2. DIRECT HANDLERS (zero LLM, instant response)
       │     ├── time_query        → device-handlers.ts
       │     ├── battery_query     → device-handlers.ts
       │     ├── device_query      → device-handlers.ts
       │     ├── identity_query    → identity-handler.ts (keyword matching for creator/model subtypes)
       │     ├── limitations_query → identity-handler.ts
       │     └── math_query        → math-handler.ts (mathjs + currency detection → redirect)
       │
       ├── 3. FACTUAL GUARD
       │     └── factual_realtime intent
       │           ├── Online → Brain with "you don't have real-time data" honesty prompt
       │           └── Offline → Brain with "you're offline" context
       │
       ├── 4. KNOWLEDGE HUB (when globe 🌐 toggle active)
       │     ├── queryKnowledge(intent, message) → 9 API sources
       │     ├── Results found → formatForBrain() → Brain synthesis with citations
       │     └── No results → log warning, fall back to Brain alone
       │
       ├── 5. TOOL CALLS
       │     ├── calendar_query / calendar_create  → expo-calendar
       │     ├── contact_lookup                     → expo-contacts
       │     ├── reminder_create / reminder_list    → expo-notifications
       │     ├── memory_query / memory_forget       → memory engine
       │     ├── clipboard_read / clipboard_write   → expo-clipboard
       │     └── tts_speak                          → expo-speech
       │
       └── 6. BRAIN (complex reasoning / open chat)
             ├── ensureBrainLoaded() (model swap if needed)
             ├── Memory lookup: embed query → findSimilar() top-K
             ├── Build messages: system prompt + memories + history + query
             ├── Stream completion via llama.rn
             ├── Post-process: format response, add citations if knowledge
             └── Auto-extract facts from conversation → save to memory
```

### Routing Summary (27 Intents)

| Category | Intents | Handler | LLM Needed? |
|---|---|---|---|
| **Direct (6)** | time, battery, device, identity, limitations, math | Device/Identity/Math handlers | No |
| **Knowledge (8)** | weather, country, book, paper, dictionary, currency, holiday, general | Knowledge Hub → Brain | Yes (synthesis) |
| **Tools (10)** | calendar (2), contacts, reminder (2), memory (2), clipboard (2), tts | Tool registry | Varies |
| **Guard (1)** | factual_realtime | Factual guard → Brain | Yes (honesty) |
| **Chat (1)** | chat | Brain | Yes |

---

## Knowledge Hub Architecture

```
User message + globe toggle ON
     │
     ▼
┌──────────────────────┐
│   Knowledge Hub       │  hub.ts — dispatches by intent
│                       │
│  1. Check SQLite cache│  Per-source TTLs:
│     - weather: 1hr    │    Wikipedia/Wikidata: 30d
│     - currency: 1d    │    Countries/Books/Dict: forever
│     - papers: 7d      │    Holidays: 30d
│     - holidays: 30d   │    Weather: 1hr, Currency: 1d
│                       │    Papers: 7d
│  2. Cache miss?       │
│     → HTTP fetch      │
│     → Cache result    │
│                       │
│  3. Format for Brain  │  formatter.ts
│     [KNOWLEDGE]       │  → formatForBrain()
│     [1] Title: ...    │  → postProcessCitations()
│     Source: URL       │  → Brain synthesizes with [1] markers
│     [/KNOWLEDGE]      │
└──────────────────────┘
```

All knowledge queries ALWAYS go through the Brain for synthesis. Raw API dumps are never shown to the user. If Brain is unavailable, a graceful fallback to formatted raw results occurs.

### Cache TTLs

| Source | TTL | Rationale |
|---|---|---|
| Wikipedia / Wikidata | 30 days | Stable encyclopedic content |
| REST Countries / Open Library / Dictionary | Forever | Immutable factual data |
| Open-Meteo (weather) | 1 hour | Changes frequently |
| ExchangeRate (currency) | 1 day | Rates update daily |
| OpenAlex (papers) | 7 days | New papers published weekly |
| Nager.Date (holidays) | 30 days | Yearly calendar data |

---

## Memory System (The Subconscious)

### Auto-Extraction Pipeline

Every conversation automatically extracts facts via regex patterns (12 patterns in `fact-extractor.ts`):

```
After each exchange:
  1. extractFacts(userMessage) — regex pattern matching
     Patterns: "my X is Y", "I work at X", "I live in X",
               "I love/hate X", "X is my Y", "my birthday is X"
     Returns: { fact, entity, category }[]

  2. If regex fails + llmExtractor available:
     → 350M Extractor model (structured JSON extraction)

  3. For each extracted fact (max 3):
     → Embed via Arctic Embed (384-dim)
     → Save to memories table + memory_vectors (sqlite-vec)
```

### Long-Press Manual Save

User can long-press any assistant message to save to memory:
- `extractFactOrRaw()` tries regex patterns first
- Falls back to raw text ONLY if it passes ERROR_PATTERNS filter (13 patterns)
- Error messages / system responses are filtered out
- 200-char limit on manual saves

### Memory Retrieval (for LLM Context)

Before every Brain call:
1. Embed the user's query via Arctic Embed
2. Semantic search against memory_vectors (top-K, threshold 0.85)
3. Inject matched memories into the system prompt
4. The Brain sees these as "[MEMORY] ... [/MEMORY]" context

---

## Math Handler

```
User: "What's 15% of 2400?"
  │
  ▼
┌──────────────────────┐
│  Currency Detection   │  CURRENCY_CODES regex (50+ codes + words)
│  USD, EUR, INR, etc.  │
└──────┬───────────────┘
       │
       ├── Currency detected → redirect:
       │   "Try asking with the globe 🌐 icon turned on"
       │
       └── No currency → mathjs evaluation:
             1. extractExpression() — parse natural language
             2. Sanitize — reject dangerous functions
             3. mathjs.evaluate() — pure JS math engine
             4. Format result
```

---

## Privacy Architecture

```
┌─────────────────────────────────────┐
│            LYLA APP                  │
│                                      │
│  ┌──────────────────────────────┐   │
│  │     ALL DATA STAYS HERE      │   │
│  │                              │   │
│  │  SQLite (lyla.db)            │   │
│  │  ├─ conversations           │   │
│  │  ├─ messages                │   │
│  │  ├─ memories                │   │
│  │  ├─ memory_vectors          │   │
│  │  └─ knowledge_cache         │   │
│  │                              │   │
│  │  FileSystem                  │   │
│  │  ├─ models/*.gguf           │   │
│  │  └─ (no cache uploads)      │   │
│  │                              │   │
│  │  SecureStore (Keychain)      │   │
│  │  └─ API keys, preferences   │   │
│  └──────────────────────────────┘   │
│                                      │
│  Network: Knowledge Hub APIs only    │
│  (user-initiated via globe toggle)   │
│  Everything else: 100% local         │
└─────────────────────────────────────┘
```

**Zero telemetry. Zero analytics. Zero cloud.**
The only network calls are to the 9 free Knowledge Hub APIs (user-initiated, per-message globe toggle). All API calls go directly from device to API — no backend relay.

---

## Navigation & Screens

```
┌─────────────────────────────────────────────┐
│                 App Layout                   │
│  (_layout.tsx — biometric lock gate)         │
│                                              │
│  Stack:                                      │
│  ├── index.tsx    (Home Dashboard)           │
│  │   • Greeting (time-aware)                 │
│  │   • Feature cards (6 capabilities)        │
│  │   • Recent conversations                  │
│  │   • "New Chat" button                     │
│  │                                           │
│  ├── chat.tsx     (Chat Screen)              │
│  │   • Back button → Home                    │
│  │   • Globe toggle 🌐 (per-message)         │
│  │   • Message bubbles with markdown         │
│  │   • TTS speaker icon (always visible)     │
│  │   • Unified download button               │
│  │   • Long-press → save to memory           │
│  │                                           │
│  ├── settings.tsx (Settings Modal)           │
│  │   • Dual model display (Router + Brain)   │
│  │   • Knowledge Hub sources list            │
│  │   • Performance table                     │
│  │   • Legal disclaimer (4 sections)         │
│  │   • TTS rate control                      │
│  │   • Memory clear                          │
│  │   • Biometric lock toggle                 │
│  │                                           │
│  └── history.tsx  (Chat History)             │
│      • All past conversations                │
│      • Tap to resume                         │
└─────────────────────────────────────────────┘
```

---

## Key Files (Current Implementation)

```
app/
├── app/
│   ├── _layout.tsx              # Root layout, biometric lock, DB init, network listener
│   ├── index.tsx                # Home dashboard — greeting, feature cards, recent chats
│   ├── chat.tsx                 # Chat screen — orchestrator wired, globe toggle, TTS
│   ├── settings.tsx             # Settings — dual models, knowledge info, legal disclaimer
│   └── history.tsx              # Chat history list
├── src/
│   ├── orchestrator/
│   │   ├── index.ts             # Main orchestrator (6-stage pipeline, 491 lines)
│   │   ├── device-handlers.ts   # Time, battery, device queries
│   │   ├── identity-handler.ts  # Identity + limitations + keyword subtypes (creator/model)
│   │   ├── math-handler.ts      # mathjs-based math with currency code detection
│   │   ├── factual-guard.ts     # Real-time question honesty handling
│   │   ├── response-formatter.ts# Strips leaked tokens, preserves markdown
│   │   ├── fact-extractor.ts    # 12 regex patterns + ERROR_PATTERNS (13 patterns) filter
│   │   ├── router-guardrails.ts # validateClassification(), intent type guards
│   │   ├── intent-classifier.ts # Legacy regex classifier (unused, replaced by Router)
│   │   ├── tool-definitions.ts  # LFM2.5 tool-calling schemas
│   │   ├── tool-registry.ts     # Self-describing tools with schemas
│   │   └── system-state.ts      # Aggregated device state for LLM context
│   ├── engines/
│   │   ├── llm.ts               # Brain model, llama.rn wrapper, streaming
│   │   ├── router.ts            # 350M Router — classify(), extractFacts(), ChatML (193 lines)
│   │   ├── model-swapper.ts     # RAM detection, swapToBrain/Router, device profiles (107 lines)
│   │   ├── memory.ts            # Memory engine (coordination layer)
│   │   ├── embeddings.ts        # Arctic Embed via llama.rn (384-dim vectors)
│   │   ├── tts.ts               # expo-speech with onDone/onStopped callbacks
│   │   ├── search.ts            # Placeholder (empty)
│   │   └── stt.ts               # Placeholder (empty)
│   ├── knowledge/
│   │   ├── types.ts             # KnowledgeResult, KnowledgeResponse interfaces
│   │   ├── hub.ts               # Central router — dispatches to 9 APIs by intent
│   │   ├── cache.ts             # SQLite cache with per-source TTLs
│   │   ├── formatter.ts         # formatForBrain(), postProcessCitations()
│   │   └── apis/
│   │       ├── wikipedia.ts     # Wikipedia search + extract
│   │       ├── wikidata.ts      # Structured entity data
│   │       ├── open-meteo.ts    # Weather + geocoding (no hardcoded coords)
│   │       ├── rest-countries.ts# Country facts
│   │       ├── openlibrary.ts   # Book search
│   │       ├── openalex.ts      # Research papers
│   │       ├── dictionary.ts    # Word definitions
│   │       ├── currency.ts      # Exchange rate conversion
│   │       └── holidays.ts      # Public holidays
│   ├── prompts/
│   │   ├── router-prompt.ts     # 27-intent classifier, ~30 few-shot examples (88 lines)
│   │   ├── extractor-prompt.ts  # Fact extraction prompt for 350M Extractor
│   │   ├── memory-extract.ts    # Memory extraction prompt
│   │   ├── search-query.ts      # Search query extraction prompt
│   │   └── system.ts            # Brain system prompt
│   ├── db/
│   │   ├── database.ts          # SQLite init + sqlite-vec + WAL mode
│   │   ├── chat-repository.ts   # Chat CRUD (conversations + messages)
│   │   └── memory-repository.ts # Memory CRUD + vector search
│   ├── stores/
│   │   ├── app-store.ts         # ModelStatus, download phase, active model, network, swapping
│   │   ├── chat-store.ts        # Messages, conversation ID, streaming state
│   │   └── settings-store.ts    # Knowledge, memory, haptics, biometric, TTS settings
│   ├── tools/
│   │   ├── biometric-lock.ts    # FaceID/TouchID authentication
│   │   ├── calendar-tool.ts     # Calendar read/write via expo-calendar
│   │   ├── contacts-tool.ts     # Contact lookup via expo-contacts
│   │   └── reminder-tool.ts     # Local notifications via expo-notifications
│   ├── utils/
│   │   ├── constants.ts         # MODELS (5), ROUTER_CONFIG, LLM_CONFIG, MEMORY, APP
│   │   ├── system-prompt.ts     # Lyla's system prompt builder
│   │   ├── model-manager.ts     # GGUF download, cache, verify in document/models/
│   │   ├── network.ts           # Online/offline detection
│   │   ├── haptics.ts           # Haptic feedback helpers
│   │   └── tool-call-test.ts    # Tool calling test utility
│   └── theme/
│       ├── colors.ts            # OLED dark palette
│       ├── typography.ts        # Platform-aware type scale
│       ├── spacing.ts           # 4px grid system
│       └── index.ts             # Theme barrel export
├── assets/
│   ├── icon.png                 # Custom app icon (1024x1024)
│   ├── adaptive-icon.png        # Android adaptive icon
│   ├── splash-icon.png          # Splash screen
│   └── favicon.png              # Web favicon
├── app.json                     # Expo config (plugins: sqlite-vec, biometric, calendar, contacts, notifications)
├── tsconfig.json                # Strict mode, path aliases (@/*)
└── package.json                 # 35 dependencies, 2 devDependencies
```

---

## Critical Implementation Notes

1. **Router n_ctx = 2048** — was 1024 initially, caused context overflow with ~50 examples. Trimmed to ~30 examples, fits in 2048.
2. **Knowledge queries ALWAYS through Brain** — user chose quality over speed. Raw API dumps never shown. Graceful degradation to raw only if Brain unavailable.
3. **Globe toggle is per-message** — auto-resets after each message. Not persistent across messages.
4. **`penalty_repeat`** (not `repeat_penalty`) is the correct llama.rn CompletionParams property.
5. **`llmEngine.complete()`** accepts optional `systemPrompt` parameter.
6. **Direct handlers bypass Brain** — time, battery, device, identity, limitations, math get no conversation history.
7. **TTS speaker icon always visible** on assistant messages — positioned outside the bubble, not hidden behind tap overlay.
8. **Fact extractor filters errors** — 13 ERROR_PATTERNS prevent saving error/system messages as memories.
9. **Math handler detects currency** — 50+ currency codes/names redirect to Knowledge Hub.
10. **Identity handler uses keyword matching** — "built/created/made" → creator response, "model/engine" → model info response.
11. **Brain DOES get conversation history** when invoked via `handleBrain()` or `handleKnowledge()`.
12. **Knowledge Hub is stateless** — each query is independent, doesn't use conversation history.
13. **Model swapping via `ensureBrainLoaded()`/`ensureRouterLoaded()`** — on <7GB RAM devices, models swap in/out.
14. **Citations done programmatically** — Brain outputs `[1]` markers, TypeScript `postProcessCitations()` converts to source footnotes.
15. **Response formatter preserves markdown** — `**bold**`, `## headings` kept since UI uses `<Markdown>` renderer.
