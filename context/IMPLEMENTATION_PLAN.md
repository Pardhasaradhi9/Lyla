# Lyla — Master Implementation Plan

> **Read context/ folder files FIRST before starting any phase.**
> See: PROJECT_IDENTITY.md, DECISIONS.md, TECH_STACK.md, PROGRESS.md

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    LYLA APP (React Native)            │
├─────────────────────────────────────────────────────┤
│  UI Layer (Expo Router + Reanimated + Zustand)       │
├─────────────────────────────────────────────────────┤
│  Orchestrator (TypeScript)                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Chat     │ │ Memory   │ │ Search   │ │ Voice  │ │
│  │ Engine   │ │ Engine   │ │ Router   │ │ Engine │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘ │
├───────┼────────────┼────────────┼────────────┼──────┤
│  Native Layer                                        │
│  ┌────┴─────┐ ┌────┴─────┐ ┌────┴─────┐ ┌───┴────┐ │
│  │ llama.rn │ │ op-sqlite│ │  fetch   │ │whisper │ │
│  │ (LLM)    │ │+sqlite-vec│ │(DDG)    │ │.rn+TTS │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
├─────────────────────────────────────────────────────┤
│  On-Device Storage                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Models/  │ │ lyla.db  │ │ prefs    │            │
│  │ *.gguf   │ │ (SQLite) │ │ (async)  │            │
│  └──────────┘ └──────────┘ └──────────┘            │
└─────────────────────────────────────────────────────┘
```

## Folder Structure (Target)

```
Lyla/
├── context/                          # Project docs (already created)
├── research/                         # User research (already exists)
└── app/                              # React Native project root
    ├── app/                          # Expo Router screens
    │   ├── _layout.tsx               # Root layout (navigation)
    │   ├── index.tsx                 # Home / Chat screen
    │   ├── settings.tsx              # Settings screen
    │   ├── history.tsx               # Chat history list
    │   └── onboarding.tsx            # First-launch onboarding
    ├── src/
    │   ├── engines/
    │   │   ├── llm.ts                # llama.rn wrapper (init, complete, stream)
    │   │   ├── memory.ts             # Memory extraction, storage, retrieval
    │   │   ├── embeddings.ts         # Embedding model wrapper
    │   │   ├── search.ts             # DuckDuckGo search + HTML parsing
    │   │   ├── stt.ts                # whisper.rn wrapper
    │   │   └── tts.ts                # expo-speech wrapper
    │   ├── db/
    │   │   ├── database.ts           # SQLite init, migrations
    │   │   ├── chat-repository.ts    # Chat CRUD operations
    │   │   └── memory-repository.ts  # Memory CRUD + vector search
    │   ├── stores/
    │   │   ├── chat-store.ts         # Zustand: active chat state
    │   │   ├── app-store.ts          # Zustand: app-wide state (model loaded, online, etc.)
    │   │   └── settings-store.ts     # Zustand: user preferences
    │   ├── components/
    │   │   ├── ChatBubble.tsx         # Message bubble (user/assistant)
    │   │   ├── ChatInput.tsx          # Text input + mic + send button
    │   │   ├── ModelLoader.tsx        # Model download/loading progress
    │   │   ├── MemoryPanel.tsx        # View/edit/delete memories
    │   │   ├── ThinkingIndicator.tsx  # "Thinking..." animation
    │   │   └── VoiceButton.tsx        # Push-to-talk mic button
    │   ├── prompts/
    │   │   ├── system.ts             # Main system prompt
    │   │   ├── memory-extract.ts     # Prompt to extract facts as JSON
    │   │   └── search-query.ts       # Prompt to generate search queries
    │   ├── utils/
    │   │   ├── network.ts            # Online/offline detection
    │   │   ├── model-manager.ts      # Download, cache, switch models
    │   │   └── constants.ts          # App-wide constants
    │   └── theme/
    │       ├── colors.ts             # Color palette
    │       ├── typography.ts         # Font definitions
    │       └── spacing.ts            # Spacing scale
    ├── assets/                       # Static assets (icons, fonts)
    ├── app.json                      # Expo config
    ├── tsconfig.json
    └── package.json
```

---

## Phase 1: Project Setup (Week 1)

### Step 1.1: Initialize React Native Project
```bash
cd /Users/pardhasaradhichukka/Desktop/Lyla
npx create-expo-app@latest app --template blank-typescript
cd app
```

### Step 1.2: Enable New Architecture
Edit `app.json`:
```json
{
  "expo": {
    "newArchEnabled": true,
    "plugins": ["expo-router"]
  }
}
```

### Step 1.3: Install Core Dependencies
```bash
# Navigation
npx expo install expo-router expo-linking expo-constants expo-status-bar

# AI/ML
npm install llama.rn whisper.rn

# Database
npm install @op-engineering/op-sqlite

# UI
npx expo install expo-speech expo-haptics expo-blur expo-file-system
npm install react-native-reanimated react-native-gesture-handler react-native-safe-area-context
npm install zustand

# Networking
npm install @react-native-community/netinfo cheerio

# Dev
npm install -D @types/react @types/react-native
```

### Step 1.4: Generate Native Projects
```bash
npx expo prebuild
```

### Step 1.5: Verify Build
```bash
npx expo run:ios    # Test on your iPhone
npx expo run:android # Test on Android emulator
```

**✅ Checkpoint:** App launches with blank screen on both platforms.

---

## Phase 2: Core Chat Engine (Weeks 2-3)

### Step 2.1: Model Manager (`src/utils/model-manager.ts`)
- Check if model GGUF file exists in app's document directory
- If not, show download screen with progress bar
- Download from HuggingFace CDN URL
- Store in `FileSystem.documentDirectory + '/models/'`
- Track download progress via `FileSystem.createDownloadResumable()`

### Step 2.2: LLM Engine (`src/engines/llm.ts`)
```typescript
// Key functions to implement:
export async function initLLM(modelPath: string): Promise<LlamaContext>
export async function streamCompletion(
  context: LlamaContext,
  messages: Message[],
  onToken: (token: string) => void
): Promise<string>
export async function releaseContext(): Promise<void>
```
- Use `initLlama()` from llama.rn with params from TECH_STACK.md
- Use `context.completion()` with streaming callback for token-by-token display
- Implement `response_format: { type: 'json_schema', ... }` for memory extraction

### Step 2.3: System Prompt (`src/prompts/system.ts`)
```typescript
export function buildSystemPrompt(memories: Memory[], isOnline: boolean): string {
  return `You are Lyla, a private AI assistant running entirely on the user's device.
You are direct, helpful, and never add disclaimers about being an AI.
You remember things about the user from past conversations.

${memories.length > 0 ? `## What you remember about the user:\n${memories.map(m => `- ${m.fact}`).join('\n')}` : ''}

${isOnline ? 'You have access to web search results which will be provided when relevant.' : 'You are currently offline. Rely on your knowledge and memories.'}

Current date: ${new Date().toLocaleDateString()}
Respond naturally and concisely.`
}
```

### Step 2.4: Chat Store (`src/stores/chat-store.ts`)
- Zustand store for: messages[], isGenerating, currentConversationId
- Actions: addMessage, updateLastMessage (for streaming), clearChat, loadConversation

### Step 2.5: Chat UI (`app/index.tsx`)
- FlatList of ChatBubble components (inverted for chat feel)
- ChatInput at bottom with TextInput + Send button + Mic button
- ThinkingIndicator shows while model generates
- Auto-scroll to latest message

**✅ Checkpoint:** Can type a message and receive a streamed response from local LLM.

---

## Phase 3: Memory Engine (Weeks 4-5)

### Step 3.1: Database Schema (`src/db/database.ts`)
```sql
-- Conversations
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  title TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

-- Messages
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES conversations(id),
  role TEXT CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT,
  created_at INTEGER
);

-- Memories (facts about the user)
CREATE TABLE memories (
  id TEXT PRIMARY KEY,
  fact TEXT NOT NULL,
  entity TEXT,
  category TEXT,
  source_message_id TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

-- Memory vectors (sqlite-vec virtual table)
CREATE VIRTUAL TABLE memory_vectors USING vec0(
  memory_id TEXT PRIMARY KEY,
  embedding FLOAT[384]
);
```

### Step 3.2: Embedding Engine (`src/engines/embeddings.ts`)
- Initialize a SECOND llama.rn context with the snowflake-arctic-embed model
- Use `context.embedding()` to generate 384-dim vectors from text
- Batch embed on memory write, single embed on query

### Step 3.3: Memory Extraction (`src/engines/memory.ts`)
After EACH assistant response, run a background extraction:
```typescript
const extractionPrompt = `Extract factual information about the user from this conversation.
Output ONLY a JSON array of facts. If no new facts, output [].

Example output: [{"fact": "User's dog is named Max", "entity": "Max", "category": "pets"}]

Conversation:
User: ${userMessage}
Assistant: ${assistantResponse}

JSON output:`
```
- Use `response_format: { type: 'json_schema' }` to FORCE valid JSON
- Parse the JSON array
- For each fact: embed it → check if similar fact exists (cosine similarity > 0.85) → update or insert
- This runs in background, doesn't block the chat UI

### Step 3.4: Memory Retrieval
Before each LLM call:
1. Embed the user's message
2. Query sqlite-vec: `SELECT * FROM memory_vectors WHERE embedding MATCH ? ORDER BY distance LIMIT 10`
3. Fetch the corresponding fact text from `memories` table
4. Inject into system prompt

### Step 3.5: Memory Correction
Parse user messages for correction intents:
- "Forget that..." → Delete matching memory
- "Actually, my name is..." → Update matching memory
- "What do you remember about me?" → List all memories

**✅ Checkpoint:** Tell the assistant your name. Start a new conversation. Ask "What's my name?" — it remembers.

---

## Phase 4: Online Search (Week 6)

### Step 4.1: Network Detection (`src/utils/network.ts`)
```typescript
import NetInfo from '@react-native-community/netinfo';
export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected === true;
}
```

### Step 4.2: Search Query Generation (`src/engines/search.ts`)
If online, ask the LLM: "Generate a concise DuckDuckGo search query for this question: [user message]"
- Use JSON schema to force output: `{"needs_search": true/false, "query": "..."}`
- If `needs_search` is false, skip search entirely

### Step 4.3: DuckDuckGo Fetch
```typescript
const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
const html = await fetch(url).then(r => r.text());
// Parse with cheerio: extract top 3-5 result snippets
// Inject into prompt as: "## Web Search Results:\n..."
```

### Step 4.4: Online/Offline Router
```typescript
async function buildPrompt(userMessage, memories) {
  const online = await isOnline();
  let searchResults = '';
  if (online) {
    const { needs_search, query } = await classifyIntent(userMessage);
    if (needs_search) {
      searchResults = await searchDuckDuckGo(query);
    }
  }
  return buildSystemPrompt(memories, online) + searchContext + userMessage;
}
```

**✅ Checkpoint:** Ask "What's the weather in Hyderabad today?" — gets a real answer when online, and a graceful "I'm offline" response when not.

---

## Phase 5: Voice I/O (Week 7)

### Step 5.1: STT Setup (`src/engines/stt.ts`)
- Download `ggml-tiny.en.bin` on first use (same model-manager pattern)
- Initialize whisper.rn context
- Implement push-to-talk: user holds mic button → record → transcribe → send to LLM

### Step 5.2: TTS Setup (`src/engines/tts.ts`)
```typescript
import * as Speech from 'expo-speech';
export function speak(text: string) {
  Speech.speak(text, { language: 'en-US', pitch: 1.0, rate: 0.9 });
}
export function stopSpeaking() { Speech.stop(); }
```

### Step 5.3: Voice Button UI
- Mic icon in ChatInput
- Press-and-hold → start recording (show animated waveform)
- Release → stop recording → transcribe → auto-send
- Assistant response auto-plays via TTS (toggle in settings)

**✅ Checkpoint:** Hold mic, speak a question, hear the answer spoken back.

---

## Phase 6: UI/UX Polish (Weeks 8-9)

### Design System
- **Colors:** Deep purple/indigo dark theme (#0D0B1A background, #7C3AED accent)
- **Font:** Inter (Google Fonts) — clean, modern, readable
- **Corners:** 16px border radius on cards, 24px on bubbles
- **Animations:** Reanimated for message entrance, thinking pulse, voice waveform
- **Glassmorphism:** Blur overlays on modals and panels

### Screens
1. **Onboarding** — 3 slides: Privacy promise → Model download → Start chatting
2. **Chat** (Home) — Messages + Input bar + Mic button
3. **History** — List of past conversations, swipe to delete
4. **Settings** — Model selection, voice toggle, memory viewer, theme
5. **Memory Panel** — Slide-up panel showing all extracted facts, tap to edit/delete

### Key UX Decisions
- Messages stream in token-by-token (typewriter effect)
- "Thinking..." indicator with pulsing dot animation
- Privacy badge in header: 🔒 "Everything stays on your device"
- Online/offline indicator: green dot (online) / gray dot (offline)
- Haptic feedback on send and voice activation

**✅ Checkpoint:** App looks and feels premium. Smooth animations. No jank.

---

## Phase 7: Testing & Beta (Weeks 10-11)

### Testing Checklist
- [ ] Fresh install flow (model download → onboarding → first chat)
- [ ] Memory extraction works across conversations
- [ ] Memory correction ("Forget X", "My name is actually Y")
- [ ] Online search returns relevant, current results
- [ ] Offline mode works fully (no crashes, graceful fallback)
- [ ] Voice input transcribes accurately
- [ ] Voice output speaks responses
- [ ] App doesn't crash when switching between apps (memory management)
- [ ] Battery usage is acceptable (no excessive drain)
- [ ] Works on older devices (iPhone 12 / Snapdragon 695)

### Devices
- iPhone (your device) — primary iOS testing
- Android Emulator — primary Android testing
- Request beta testers via r/LocalLLaMA when ready

---

## Critical Implementation Rules

1. **NEVER call the LLM on the main thread.** Always use async/background processing.
2. **ALWAYS release LLM context** when app goes to background (iOS will kill the app otherwise).
3. **Re-initialize LLM context** when app returns to foreground.
4. **Memory extraction runs AFTER the response is displayed**, not before. Never block the user.
5. **All database writes are transactional.** Use SQLite transactions for consistency.
6. **Model files go in documentDirectory, NOT bundled in the app.** App size must stay small.
7. **Error boundaries around every native module call.** llama.rn, whisper.rn can crash — catch and recover gracefully.
8. **Show clear loading states.** Model loading, thinking, transcribing — always tell the user what's happening.
