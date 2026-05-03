# Implementation Plan — Lyla

> **Read context/ folder FIRST.** Start with ARCHITECTURE.md.
> Last Updated: 2026-05-03

---

## Completed Phases

### Phase 1: Foundation — COMPLETE (`d704d5f`, `7f8f7a1`)
- Expo SDK 54 project init, all dependencies, folder structure
- OLED dark theme, Zustand stores, Expo Router, engine stubs
- Database schema, model manager, streaming LLM chat, custom app icon

### Phase 2a: Bug Fixes + Orchestrator Rearch — COMPLETE (`9b3cc36`)
- Fixed 5 bugs (context overflow, memory query, fact extraction, fresh start)
- 6-stage orchestrator pipeline, system state, tool registry, router guardrails

### Phase 2b: Native Packages — COMPLETE (`0014364`)
- 8 native packages installed (biometric, calendar, contacts, notifications, etc.)
- 4 native tools implemented (biometric lock, calendar, contacts, reminders)
- 5 new intents added

### Phase 2c: JS-Only Features — COMPLETE (`369a366`)
- Haptic feedback, clipboard tools, TTS, network-aware routing

### Phase 2d: 350M Router Model — COMPLETE (`77ddc8d`)
- Router engine (193 lines), model swapper (107 lines), triple-layer guardrails
- Unified download button (Router → Brain → Embedding)

### Phase 2f: Knowledge Hub — COMPLETE (`01c513f`)
- 9 free API wrappers, SQLite cache with TTLs, formatter with citations
- Per-message globe toggle, 27 intents (added knowledge_currency)
- Router n_ctx fix (`1b586c3`), unified download (`3af54c4`)

### Phase 2g: Home Dashboard + Math + Bug Fixes — COMPLETE (`e2847c7`, `64a5fc0`)
- Home dashboard, chat screen with back button, math handler (mathjs)
- Knowledge always through Brain, model swap wiring, Settings rewrite
- 13 bugs fixed total across two commits

---

## Current Phase: Phase 2e — Voice Pipeline

### Step 1: Install whisper.rn

```bash
cd app
npm install whisper.rn
npx expo prebuild --clean
```

### Step 2: Download Whisper Model

- `ggml-tiny.en.bin` (75 MB) — English only
- Use same download pattern as LLM models (model-manager.ts)
- Download on first use, cache in `document/models/`

### Step 3: Implement STT Engine

- File: `src/engines/stt.ts` (currently empty placeholder)
- Use `whisper.rn` with CoreML acceleration on iOS
- Transcribe audio buffer → text
- Return transcription with timing/confidence

### Step 4: Push-to-Talk UI

- File: Update `app/chat.tsx`
- Hold mic button → start recording (expo-av or react-native-audio-recorder)
- Release → stop recording → transcribe → send to orchestrator
- Show animated waveform during recording
- Mic button in input bar (next to send button)

### Step 5: Voice-to-Voice Loop

- STT: Whisper transcribes audio → text
- Text → Orchestrator → Response
- TTS: expo-speech reads response aloud (existing `handleSpeak`)
- Setting: toggle auto-speak after voice input
- Setting: toggle voice input mode (always-on mic vs push-to-talk)

### Step 6: Test on Device
- Push-to-talk works on real iPhone
- Transcription accuracy (English)
- Voice-to-voice latency acceptable
- Auto-speak toggles correctly

---

## Next Phase: Phase 3 — Extractor Model Integration

### Step 1: Download LFM2-350M-Extract (229 MB)

- Already defined in `MODELS.EXTRACT_LLM` in constants.ts
- Model swaps with Router (same RAM slot)

### Step 2: Wire extractFacts() into Auto-Memory

- `router.ts` already has `extractFacts()` method
- Wire into `autoExtractFacts()` in orchestrator as LLM fallback
- After regex extraction fails, swap to Extractor, run extraction, swap back

### Step 3: Test Extraction Quality

- Compare regex-only vs regex+Extractor extraction
- Measure: precision, recall, entity coverage
- Decision: is the Extractor worth the 300-500ms latency?

---

## Future Phase: Phase 4 — Quality & Polish

### FastText Classifier
- Train FastText on labeled intent data collected from usage
- Replace Router model for classification (faster, lighter)
- Would need separate runtime (llama.rn can't run BERT/FastText)

### Adaptive Context Management
- Summarize older messages instead of truncating
- Use 350M model to generate conversation summaries
- Trade compute for context length

### On-Device Knowledge Graph
- Beyond flat facts — build relationship graph
- "Sarah" → {type: person, relation: mother, phone: ..., birthday: ...}
- Enable complex queries: "Who in my family has a birthday this month?"

---

## Execution Priority

```
Phase 2e (voice)        → NEXT — independent, high user value
Phase 3 (extractor)     → AFTER VOICE — improves memory quality
Phase 4 (quality)       → ONGOING — incremental improvements
```

All infrastructure phases (2a-2g) are complete. The system is fully functional.
