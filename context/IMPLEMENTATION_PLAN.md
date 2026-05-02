# Implementation Plan — Lyla Phase 2

> **Read context/ folder FIRST.** Start with ARCHITECTURE.md.
> Last Updated: 2026-05-02

---

## Phase 2a: Bug Fixes + Orchestrator Rearchitecture (JS-only)

**No native rebuild required.** All changes are TypeScript.

### Step 1: Fix Known Bugs

**BUG-004: App reopens with last chat**
- File: `app/index.tsx`
- Fix: Remove `loadLastConversation` useEffect on mount. Start fresh every time.
- Keep: History screen still shows all past conversations.

**BUG-005: Context overflow crash**
- Files: `app/index.tsx`, `src/engines/llm.ts`
- Fix: Lower `MAX_CONTEXT_CHARS` from 12000 → 6000. Add try-catch in `llm.ts:complete()`. Catch OOM/context overflow and return graceful error.

**BUG-006: Memory query dumps raw messages**
- File: `src/orchestrator/index.ts`
- Fix: Change `memory_query` intent to use `findSimilar()` instead of `getAllMemories()`. Embed the user's query, return top-K relevant memories.

**BUG-007: Memory saves raw text**
- File: New `src/orchestrator/fact-extractor.ts`
- Fix: Add regex-based fact extractor before saving. Extract entity, category from patterns like "my X is Y", "I love X", "X is my Y". Save structured facts, not raw text.

**BUG-008: Slowdown after long conversation**
- Already fixed by BUG-005 (lower context). Add context usage logging.

### Step 2: Rearchitect Orchestrator

**Create System State Object**
- File: New `src/orchestrator/system-state.ts`
- Aggregate: time, battery, device, network, memories, calendar (when available)
- Refresh on every message
- Available to both Router and Brain

**Create Tool Registry**
- File: New `src/orchestrator/tool-registry.ts`
- Each tool: `{ name, description, parameters, execute, requiresPermission }`
- Start with existing tools: time_query, battery_query, device_query, memory_save, memory_query, memory_forget
- Tools are self-describing — Router/Brain read descriptions to decide when to use them

**Rewrite Orchestrator Loop**
- File: `src/orchestrator/index.ts`
- New flow: Classify → Route → Execute → Reason → Respond → Learn
- Simple intents: handle directly (no LLM)
- Tool calls: execute tool, format result
- Complex: send to Brain with full system state
- Always: auto-extract facts after each exchange

### Step 3: Test on Device
- All bug fixes verified
- Orchestrator routes correctly
- Memory saves structured facts
- Context overflow handled gracefully

---

## Phase 2b: Batch Native Package Install (One Rebuild)

**Install all native packages at once, rebuild once.**

### Step 1: Install Packages

```bash
cd app
npx expo install expo-local-authentication expo-calendar expo-contacts expo-secure-store expo-notifications expo-task-manager expo-background-fetch expo-crypto
```

### Step 2: Configure app.json Plugins

Add permission strings for each package:
- `expo-local-authentication`: NSFaceIDUsageDescription
- `expo-calendar`: NSCalendarsUsageDescription
- `expo-contacts`: NSContactsUsageDescription

### Step 3: Rebuild

```bash
npx expo prebuild --clean
npx expo run:ios --configuration Release --device
```

### Step 4: Implement New Tools

**App Lock (expo-local-authentication)**
- New file: `src/tools/biometric-lock.ts`
- FaceID/TouchID on app open
- Setting to enable/disable

**Calendar Tool (expo-calendar)**
- New file: `src/tools/calendar-tool.ts`
- `calendar_query`: Read today's events
- `calendar_create`: Create event with title, date, duration

**Contacts Tool (expo-contacts)**
- New file: `src/tools/contacts-tool.ts`
- `contact_lookup`: Search by name, return phone/email/birthday

**Reminders Tool (expo-notifications + expo-task-manager)**
- New file: `src/tools/reminder-tool.ts`
- `reminder_create`: Schedule local notification at specific time
- `reminder_list`: Show active reminders

### Step 5: Add New Intents

- `calendar_query`: "What's on my schedule today?"
- `calendar_create`: "Add a meeting with Sarah tomorrow at 3pm"
- `contact_lookup`: "What's Sarah's phone number?"
- `reminder_create`: "Remind me to call mom at 5pm"
- `app_lock`: Biometric authentication on app open

### Step 6: Test on Device
- App lock works with FaceID
- Calendar read/write works
- Contacts lookup works
- Reminders fire at correct time

---

## Phase 2c: JS-Only Features (No Rebuild)

**Haptic Feedback (expo-haptics — already installed)**
- Subtle haptic on: message send, memory save, tool execution, error
- File: Update `app/index.tsx` event handlers

**Clipboard Tool (expo-clipboard — already installed)**
- New file: `src/tools/clipboard-tool.ts`
- `clipboard_read`: "Summarize what I copied"
- `clipboard_write`: "Copy that to clipboard"

**Text-to-Speech (expo-speech — already installed)**
- New file: `src/tools/tts-tool.ts`
- `tts_speak`: "Read that back to me"
- Setting: auto-speak responses (toggle)

**Network-Aware Routing**
- Use `@react-native-community/netinfo` (already installed)
- Disable web search when offline
- Show online/offline indicator
- Graceful fallback messages

---

## Phase 2d: 350M Router Model Integration

### Step 1: Download Models

```bash
# Router model
curl -L -o models/LFM2.5-350M-Q4_K_M.gguf <huggingface-url>

# Extractor model
curl -L -o models/LFM2-350M-Extract-Q4_K_M.gguf <huggingface-url>
```

### Step 2: Implement Model Manager v2

- File: `src/utils/model-manager.ts`
- Device RAM detection at startup
- Select appropriate Brain quant (Q4 for 4GB, Q6 for 6GB+)
- Model swapping logic (release Router → load Brain → release Brain → load Router)

### Step 3: Wire Router into Orchestrator

- Replace regex-based intent classifier with 350M Router for complex cases
- Keep regex as fast-path for known patterns (time, battery, device)
- Router handles: ambiguous intents, tool parameter extraction, fact extraction

### Step 4: Wire Extractor into Auto-Memory

- After each conversation exchange, swap in Extractor
- Feed: user message + assistant response
- Extract: structured facts with entity, category, sentiment
- Save to memory DB with embeddings
- Swap back to Router

### Step 5: Test on Device
- Router classification accuracy vs regex
- Model swap speed (how long to switch contexts)
- Auto-memory extraction quality
- RAM usage on 4GB vs 6GB devices

---

## Phase 2e: Voice Pipeline

### Step 1: Install whisper.rn

```bash
npm install whisper.rn
```

### Step 2: Download Whisper Model

- ggml-tiny.en.bin (75 MB)
- Download on first use, same pattern as LLM models

### Step 3: Push-to-Talk UI

- Hold mic button → start recording
- Release → stop recording → transcribe → send to orchestrator
- Show animated waveform during recording

### Step 4: Voice-to-Voice Loop

- STT: Whisper transcribes audio → text
- Text → Orchestrator → Response
- TTS: expo-speech reads response aloud
- Setting: toggle auto-speak

---

## Phase 2f: Web Search

### Step 1: Search Engine

- File: `src/engines/search.ts`
- DuckDuckGo HTML endpoint
- Parse with cheerio: extract top 3-5 result titles + snippets

### Step 2: Integration

- New intent: `web_search` — triggered for factual/realtime questions
- Online: search → inject results into Brain context → synthesize answer
- Offline: factual guard deflection ("I'm offline, can't search right now")

### Step 3: Test
- "What's the weather in Hyderabad?"
- "Latest news on AI"
- Offline behavior

---

## Execution Priority

```
Phase 2a (bugs + rearch)     → MUST DO FIRST
Phase 2b (native packages)   → SECOND (one rebuild)
Phase 2c (JS-only features)  → THIRD (can parallel with 2b testing)
Phase 2d (350M router)       → FOURTH (depends on 2a rearch)
Phase 2e (voice)             → FIFTH (independent)
Phase 2f (web search)        → SIXTH (independent)
```

Phases 2d, 2e, 2f are independent of each other and can be done in any order after 2a+2b.
