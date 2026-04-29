# Project Identity — LYLA

## Name
**Lyla** — "Your Life, Your Language, Your AI."

## What Is Lyla?
Lyla is a **private, on-device AI assistant** for iOS and Android that runs entirely on the user's phone — no cloud, no subscriptions, no data leaving the device. It is powered by open-source small language models (Qwen3 1.7B Abliterated + LFM 2.5 1.2B Thinking) and features persistent memory, voice interaction, and real-time web search grounding.

## Mission
To give every person a truly private, intelligent assistant that lives on their device, remembers their life, and never sends a byte of their data to anyone.

## Vision
To build the world's first **proactive, memory-aware, fully local AI companion** that replaces the need for cloud AI subscriptions while providing superior privacy and personalization.

## Core Novelty (What Makes Lyla Different)
1. **Mutable Memory Engine** — Unlike every other local AI app that is just a chat wrapper, Lyla actively extracts facts about the user from conversations, stores them in a local vector database (SQLite + sqlite-vec), and injects them into future conversations. Memory is correctable ("Forget X", "Actually my name is Y").
2. **Uncensored by Default** — Ships with Qwen3 1.7B Abliterated. No refusals, no lectures, no "As an AI, I cannot...". It's the user's device and the user's rules.
3. **Hybrid Online/Offline Intelligence** — When online, Lyla searches DuckDuckGo to ground answers in real-time data. When offline, it transparently falls back to its local knowledge + memory graph.
4. **Voice-First Design** — Full local STT (Whisper) and TTS (OS native) for hands-free interaction.
5. **Model-Agnostic** — Users can swap in ANY .gguf model. Total freedom.

## Target Audience
- Privacy-conscious users who don't trust cloud AI
- Users in regions with unreliable internet
- Developers and tinkerers who want full control
- Anyone tired of AI subscriptions (ChatGPT Plus, Gemini Advanced, etc.)

## Platforms
- **iOS** (iPhone 13+ recommended, iOS 16+)
- **Android** (4+ GB RAM, Android 10+)

## License
Open Source (to be determined — likely MIT or Apache 2.0)

## Repository
`/Users/pardhasaradhichukka/Desktop/Lyla/` (local development)
GitHub: TBD (will publish after V1 is complete)
