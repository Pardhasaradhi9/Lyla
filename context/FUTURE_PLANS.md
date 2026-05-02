# Future Plans & Roadmap — Lyla

> Long-term vision for system intelligence evolution.
> Last Updated: 2026-05-02

---

## V2 Features (After Phase 2 Ships)

### V2.1: File Intelligence (RAG Pipeline)
- Users import PDFs, receipts, notes, documents
- Parse → chunk → embed (Arctic Embed) → store in sqlite-vec
- Query: "What did that receipt from Target say?" → semantic search → answer
- Privacy: files never leave the device
- Dependencies: expo-file-system + PDF parser + chunking logic

### V2.2: Morning Briefing (Proactive Intelligence)
- Scheduled background task runs daily (expo-background-fetch)
- Reads calendar, checks reminders, summarizes memories
- Push notification: "Good morning! You have 3 meetings today and a reminder to call Sarah"
- Challenge: iOS limits background to ~30s — keep it lightweight
- Android: WorkManager for reliable scheduling

### V2.3: Persona System
- Let users customize Lyla's personality via system prompt templates
- Presets: Professional, Friendly, Sarcastic, Mentor, Companion
- Custom: User writes their own system prompt
- Store in SQLite alongside preferences

### V2.4: Multilingual STT
- Upgrade from Whisper tiny.en (English only) to Whisper base (multilingual)
- Adds Hindi, Telugu, Tamil, and 95+ languages
- Model size: 75 MB → ~142 MB
- User selects preferred language in settings

### V2.5: Model Marketplace
- In-app model browser (fetches from HuggingFace)
- Download progress indicator
- Model compatibility check before download
- Easy model switching in settings
- Users can swap the Brain for any GGUF model (Qwen, Llama, etc.)
- Lyla automatically adapts system prompt to model's chat format

---

## V3 Features (Long-Term Vision)

### V3.1: Smart Home Integration
- Home Assistant REST API (local network only)
- "Turn off the living room lights" → API call to local HA instance
- Discovery via mDNS on local network
- No cloud — purely local network communication

### V3.2: Multi-Device Sync
- Peer-to-peer sync over local Wi-Fi (no cloud)
- End-to-end encrypted (libsodium)
- Sync: chat history, memories, preferences, calendar data
- Protocol: mDNS discovery + direct P2P

### V3.3: Proactive Intelligence
- Lyla notices patterns and proactively suggests actions
- "You usually call your mom on Sundays — want me to remind you?"
- "This meeting overlaps with your dentist appointment"
- Based on memory patterns + calendar analysis
- Requires strong memory system (auto-extraction must be reliable first)

### V3.4: Vision Intelligence
- Camera input → describe scenes, read text, identify objects
- Requires a vision model (MobileVLM, LLaVA) — probably 1-2 GB
- "What's in this receipt?" → extract items, prices, date
- "Read this sign for me" → OCR + translation

---

## Research Areas (Things to Explore)

### Better Small Models
- LFM2.5-1.2B is good but the field moves fast
- Monitor: Qwen3-1.5B, Gemma-3-1B, new Liquid AI releases
- Key criteria: tool calling support, abliterated availability, GGUF format

### Fine-Tuning for Tool Calling
- Distill Labs achieved 96-98% tool-call accuracy by fine-tuning LFM2.5-350M
- Could we fine-tune our own model for Lyla-specific tools?
- Requires: training data collection + fine-tuning infrastructure
- Consider: ONNX fine-tuning on device (future research)

### On-Device Knowledge Graph
- Beyond flat facts — build a graph of relationships
- "Sarah" → {type: person, relation: mother, phone: ..., birthday: ...}
- Enable queries like "Who in my family has a birthday this month?"
- Depends on reliable fact extraction first

### Adaptive Context Management
- Dynamically adjust context window based on device capabilities
- Summarize older messages instead of truncating
- Use 350M model to generate conversation summaries
- Trade compute for context length

---

## Cut List (Not Feasible with Current Models)

- Real-time video/multimodal companion (needs vision model — V3.4)
- Complex multi-step agentic workflows (1.2B loses track after 2-3 tool calls)
- Code generation/IDE integration (needs 7B+ model)
- On-device fine-tuning (mobile hardware can't; memory engine IS our learning)
- Voice cloning (massive model overhead, not core)

---

## The North Star

Every feature decision answers one question:

> **"Does this make Lyla more like a system intelligence or more like a chatbot?"**

If it's a system feature (tool, sensor, memory, proactive action) → build it.
If it's a chatbot feature (more model params, longer context, better generation) → defer until the system layer is solid.

The system makes the brain useful. The brain makes the system smart. Build the system first.
