# Future Plans & Roadmap — Lyla

> Features planned for V2, V3, and beyond.
> Ordered by user demand signal strength from research.

---

## V2 Features (After V1 Ships)

### V2.1: Premium Voice (Piper TTS)
- Replace expo-speech with Piper TTS neural voices
- Requires building a custom React Native native module wrapping Piper's C API
- Target: natural, human-like voice output (~15-30 MB per voice model)
- Consider Kokoro-82M as alternative (higher quality, slightly larger)

### V2.2: Morning Briefing (Proactive Notifications)
- Scheduled background task that runs daily
- Reads local calendar (if permission granted), summarizes pending tasks
- Pushes a notification: "Good morning! Here's what's ahead today..."
- Challenge: iOS restricts background execution heavily — needs BackgroundTasks framework
- Android: WorkManager for reliable scheduling

### V2.3: Persona / Personality System
- Let users customize the assistant's personality via system prompt templates
- Presets: Professional, Friendly, Sarcastic, Mentor, Companion
- Custom: User writes their own system prompt
- Store persona preference in SQLite alongside user preferences

### V2.4: Multilingual Whisper
- Upgrade from whisper tiny.en to whisper base (multilingual)
- Adds Hindi, Telugu, Tamil, and 95+ other languages for voice input
- Model size increases from 75 MB to ~142 MB
- User selects preferred language in settings

## V3 Features (Long-Term)

### V3.1: Local RAG Over Files (PDFs, Notes)
- File picker to select local documents
- PDF parsing (pdf.js or similar)
- Chunk → Embed → Store in sqlite-vec
- Query: "What did that research paper say about X?"
- Privacy: Files never leave the device

### V3.2: OS-Level Tool Use
- iOS: Shortcuts integration, Apple Reminders API, Calendar API
- Android: Intents for calendar, reminders, alarms
- Sandboxed execution with user confirmation before any action
- "Set a reminder to call Mom at 5 PM" → Creates actual system reminder

### V3.3: Smart Home Integration
- Home Assistant REST API (local network only)
- Matter protocol support (future)
- "Turn off the living room lights" → API call to local HA instance

### V3.4: Multi-Device Sync
- Peer-to-peer sync over local Wi-Fi (no cloud)
- End-to-end encrypted
- Sync: chat history, memories, preferences
- Protocol: mDNS discovery + libsodium encryption

### V3.5: Custom Model Import UI
- In-app model browser (fetches from HuggingFace)
- Download progress indicator
- Model compatibility check before download
- Easy model switching in settings

## Cut List (Not Feasible with 1.2-1.7B Models)
- ❌ Real-time video/multimodal companion (needs vision model)
- ❌ Complex multi-step agentic workflows (hallucination risk too high)
- ❌ Code generation/IDE integration (needs 7B+ model)
- ❌ Hardware system optimization (desktop only, model too small)
- ❌ Voice cloning (massive model overhead, not core)
- ❌ On-device fine-tuning (mobile hardware can't fine-tune; memory engine IS our learning mechanism)
