# Lyla System Architecture

> **READ THIS FIRST.** This is the most important file in the context folder.
> It defines what Lyla IS — not a chatbot, a system intelligence.

---

## The Core Idea

Lyla is **not** an LLM chatbot with features bolted on. Lyla is a **system intelligence** — a body (tools, sensors, memory, APIs) that has been given a brain (LLM). The brain makes the system smart. The system makes the brain useful. Neither works alone.

```
Traditional Chatbot:     User → LLM → Response
Traditional System:      User → Rules/APIs → Response
Lyla:                    User → System → Brain ↔ System → Response
```

A 1.2B model is "dumb" by itself. But a 1.2B model that can read your calendar, search your contacts, query your battery, remember your preferences, set reminders, read your clipboard, and reason over all of it — that's a **system intelligence**.

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
                  │  1. Classify      │  350M Router: <50ms
                  │  2. Plan          │  Decide: handle directly?
                  │  3. Execute       │  Or: call tool(s)?
                  │  4. Reason        │  Or: escalate to 1.2B?
                  │  5. Respond       │
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
       │ Time/Date   │ │              │ │              │
       │ Reminders   │ │              │ │              │
       │ TTS / STT   │ │              │ │              │
       │ Files/RAG   │ │              │ │              │
       │ Web Search  │ │              │ │              │
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
```

---

## Multi-Model Strategy (RAM-Constrained)

Phones have limited RAM. We cannot load all models simultaneously.

### Device Profiles

| Device | Safe App Budget | Strategy |
|---|---|---|
| **4 GB** (iPhone 12/13) | ~1.5 GB | 350M Router (default) + 1.2B Q4 @ 4K ctx (swap in) |
| **6 GB** (iPhone 15/16) | ~2.5 GB | 350M Router (default) + 1.2B Q6 @ 8K ctx (swap in) |
| **8 GB+** (iPad Pro) | ~3.5 GB | 350M Router + 1.2B Brain both loaded simultaneously |

### Model Roles

| Role | Model | Quant | Size | Context | Always Loaded? |
|---|---|---|---|---|---|
| **Router** | LFM2.5-350M | Q4_K_M | 229 MB | 1024 | Yes (on all devices) |
| **Extractor** | LFM2-350M-Extract | Q4_K_M | 229 MB | 1024 | Swaps with Router |
| **Brain (4GB)** | LFM2.5-1.2B-Instruct (abliterated) | Q4_K_M | ~600 MB | 4096 | No — swap in on demand |
| **Brain (6GB+)** | LFM2.5-1.2B-Instruct (abliterated) | Q6_K | 918 MB | 8192 | No — swap in on demand |
| **Embedding** | Arctic Embed S | Q8_0 | 35 MB | 512 | Yes |
| **STT** | Whisper Tiny EN | — | 75 MB | — | Load on demand |

### Model Manager Logic

```
App Startup:
1. Detect device RAM (expo-device)
2. Select appropriate Brain quant (Q4 for 4GB, Q6 for 6GB+)
3. Load Router (350M) — always first, always ready
4. Load Embedding (35 MB) — always ready
5. Brain downloads in background if not cached
6. Brain loads on-demand when first complex query arrives

Model Swapping:
- Router handles: intent classification, tool calls, fact extraction
- When Router says "this needs the Brain":
  1. Release Router context (free ~300 MB)
  2. Load Brain context (~600-918 MB)
  3. Process query with full system state
  4. Release Brain context
  5. Reload Router context
```

---

## Orchestrator Loop (The Nervous System)

This is the heart of Lyla. Every user message goes through this loop:

```
User Message
     │
     ▼
┌──────────────┐
│  CLASSIFY     │  350M Router or regex pre-filter
│  (50ms)       │  → What does the user want?
└──────┬───────┘
       │
       ├── Simple intent? (time, battery, identity, device info)
       │     └── Execute directly via tool → Return response (0ms LLM)
       │
       ├── Need tool? (calendar, contacts, reminder, clipboard)
       │     ├── Execute tool → Get structured result
       │     ├── Simple enough to format without LLM?
       │     │     └── Format and return (0ms LLM)
       │     └── Needs reasoning over result?
       │           └── Send tool result + query to Brain → Return
       │
       ├── Need memory extraction?
       │     └── 350M Extractor → Structured facts → Save to DB
       │
       └── Complex reasoning / open chat?
             ├── Build System State (aggregate all context)
             ├── Load Brain (if not loaded)
             ├── Send: system prompt + system state + memories + history + query
             ├── Brain may call tools mid-response
             ├── Brain synthesizes final answer
             └── Auto-extract facts from conversation → Save to memory
```

### System State Object

Always available, always fresh. The Brain can access any of this at any time:

```typescript
interface SystemState {
  time: {
    now: Date
    timezone: string
    locale: string
  }
  battery: {
    level: number        // 0-100
    charging: boolean
    lowPower: boolean
  }
  network: {
    online: boolean
    type: string         // wifi, cellular, none
  }
  device: {
    model: string        // "iPhone 15"
    os: string           // "iOS 18.4"
    name: string         // "Pardha's iPhone"
    ramGB: number        // for model selection
  }
  calendar: {
    todayEvents: CalendarEvent[]
    upcomingEvents: CalendarEvent[]  // next 7 days
  }
  contacts: {
    recentlyUsed: Contact[]          // last 20 interacted
  }
  memories: {
    relevant: Memory[]               // semantic search results
    totalCount: number
  }
  clipboard: {
    hasContent: boolean
    preview: string                  // first 100 chars
  }
  reminders: {
    active: Reminder[]
  }
}
```

---

## Tool Registry (The Body)

Each tool has a schema that the Router/Brain can read to decide when and how to use it:

```typescript
interface Tool {
  name: string                      // "calendar_query"
  description: string               // "Read today's calendar events"
  parameters: ParameterSchema[]     // What inputs it needs
  execute: (params) => Promise<any> // The actual function
  requiresPermission?: boolean      // Needs user consent?
  category: 'system' | 'personal' | 'network'
}
```

### Tool Inventory (Planned)

| Tool | Package | Category | Permission Required |
|---|---|---|---|
| `time_query` | expo-localization | system | No |
| `battery_query` | expo-battery | system | No |
| `device_query` | expo-device | system | No |
| `network_query` | @react-native-community/netinfo | system | No |
| `clipboard_read` | expo-clipboard | system | No |
| `clipboard_write` | expo-clipboard | system | No |
| `tts_speak` | expo-speech | system | No |
| `calendar_query` | expo-calendar | personal | Yes |
| `calendar_create` | expo-calendar | personal | Yes |
| `contact_lookup` | expo-contacts | personal | Yes |
| `reminder_create` | expo-notifications + expo-task-manager | personal | Yes |
| `notification_send` | expo-notifications | personal | Yes |
| `memory_save` | sqlite-vec + Arctic Embed | personal | No |
| `memory_query` | sqlite-vec + Arctic Embed | personal | No |
| `memory_forget` | sqlite-vec + Arctic Embed | personal | No |
| `web_search` | fetch + cheerio | network | No (online only) |
| `stt_transcribe` | whisper.rn | system | Microphone |
| `file_read` | expo-file-system + PDF parser | personal | Yes |

---

## Memory System (The Subconscious)

### Auto-Extraction Pipeline

Every conversation automatically extracts facts. The user never has to explicitly "save" anything:

```
Conversation ends (or after each exchange)
     │
     ▼
┌──────────────────┐
│  350M Extractor   │  Parse: user messages + assistant response
│  (few-shot JSON)  │  Output: structured facts
└────────┬─────────┘
         │
         ▼
   Extracted Facts:
   • {fact: "works at Google", category: "work", entity: null}
   • {fact: "mom's name is Sarah", category: "family", entity: "Sarah"}
   • {fact: "likes spicy food", category: "food_preference", entity: null}
         │
         ▼
┌──────────────────┐
│  Embedding Engine │  Embed each fact → 384-dim vector
│  (Arctic Embed)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Duplicate Check  │  Compare with existing memories
│  (cosine sim)     │  Similarity > 0.85 → update, not insert
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Save to DB       │  memories table + memory_vectors (sqlite-vec)
└──────────────────┘
```

### Memory Retrieval (for LLM Context)

Before every LLM call:
1. Embed the user's query
2. Semantic search against memory_vectors (top-K, threshold 0.85)
3. Inject matched memories into the system prompt
4. The Brain sees these as "[MEMORY] ... [/MEMORY]" context

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
│  │  └─ memory_vectors          │   │
│  │                              │   │
│  │  FileSystem                  │   │
│  │  ├─ models/*.gguf           │   │
│  │  └─ (no cache uploads)      │   │
│  │                              │   │
│  │  SecureStore (Keychain)      │   │
│  │  └─ API keys, preferences   │   │
│  └──────────────────────────────┘   │
│                                      │
│  Network: ONLY web search (opt-in)   │
│  Everything else: 100% local         │
└─────────────────────────────────────┘
```

**Zero telemetry. Zero analytics. Zero cloud.**
The only network call is web search (user-initiated, online-only).

---

## Key Files (Current Implementation)

```
app/
├── app/
│   ├── _layout.tsx              # Root layout, dark theme, LogBox
│   ├── index.tsx                # Chat screen (orchestrator wired)
│   ├── settings.tsx             # Settings + Clear All Memories
│   └── history.tsx              # Chat history list
├── src/
│   ├── orchestrator/
│   │   ├── index.ts             # Main orchestrator (Classify→Route→Execute→Reason→Respond→Learn)
│   │   ├── intent-classifier.ts # Pattern-based intent detection (9 intents)
│   │   ├── identity-handler.ts  # Hardcoded identity responses
│   │   ├── factual-guard.ts     # Real-time question deflection
│   │   ├── response-formatter.ts# Strips tokens from model output
│   │   ├── tool-definitions.ts  # LFM2.5 tool-calling schemas (future)
│   │   ├── device-handlers.ts   # Time, battery, device queries
│   │   ├── tool-registry.ts     # Self-describing tools with schemas
│   │   ├── system-state.ts      # Aggregated device state for LLM context
│   │   └── fact-extractor.ts    # Regex-based fact extraction
│   ├── engines/
│   │   ├── llm.ts               # llama.rn wrapper (streaming)
│   │   ├── memory.ts            # Memory engine (coordination layer)
│   │   ├── embeddings.ts        # Arctic Embed via llama.rn
│   │   ├── search.ts            # Placeholder (web search)
│   │   ├── stt.ts               # Placeholder (Whisper)
│   │   └── tts.ts               # expo-speech wrapper
│   ├── db/
│   │   ├── database.ts          # SQLite init + sqlite-vec
│   │   ├── chat-repository.ts   # Chat CRUD
│   │   └── memory-repository.ts # Memory CRUD + vector search
│   ├── stores/
│   │   ├── app-store.ts         # Model status, online state
│   │   ├── chat-store.ts        # Messages, conversation ID
│   │   └── settings-store.ts    # User preferences
│   ├── utils/
│   │   ├── constants.ts         # Models, LLM params, memory config
│   │   ├── system-prompt.ts     # Lyla's system prompt
│   │   ├── model-manager.ts     # Download, cache, verify models
│   │   └── network.ts           # Online/offline detection
│   └── theme/
│       ├── colors.ts            # OLED dark palette
│       ├── typography.ts        # Platform-aware type scale
│       └── spacing.ts           # 4px grid system
├── assets/
│   ├── icon.png                 # Custom app icon (1024x1024)
│   ├── adaptive-icon.png        # Android adaptive icon
│   ├── splash-icon.png          # Splash screen
│   └── favicon.png              # Web favicon
├── app.json                     # Expo config
├── tsconfig.json
└── package.json
```
