# Project Identity — LYLA

## Name
**Lyla** — "Your Life, Your Language, Your AI."

## What Is Lyla?

Lyla is a **privacy-first system intelligence** for iOS and Android that runs entirely on the user's phone. It is NOT a chatbot with features bolted on. It is a complete system — sensors, tools, memory, knowledge, and a brain (LLM) — that works together to create something neither could be alone.

Think of it as **a pocket-sized Jarvis**. The system (calendar, contacts, reminders, device APIs, knowledge APIs) is the body. The LLM is the brain. The brain makes the system smart. The system makes the brain useful.

## The Core Principle

```
Traditional AI Assistant:    User → LLM → Response
                               (brain does everything, badly)

Traditional System App:      User → Rules/APIs → Response
                               (no brain, rigid, dumb)

Lyla:                        User → System → Brain ↔ System → Response
                               (body + brain working together)
```

A 1.2B model hallucinates on its own. A calendar API is dumb on its own. But a 1.2B model that can **read your calendar, search your contacts, check your battery, remember your preferences, set reminders, convert currencies, look up definitions, check the weather, solve math, query 9 knowledge APIs, and reason over all of it** — that's something neither could be separately.

## What Makes Lyla Different

1. **System Intelligence, Not Chatbot** — Lyla is a body with a brain. Tools, sensors, APIs, and memory form the body. The LLM is the brain. Every interaction routes through the system first, the brain second. 6 direct handlers bypass the LLM entirely for zero-hallucination responses.

2. **Multi-Model Architecture** — A 350M router handles 80% of interactions in <500ms (27-intent classification, tool dispatch). The 1.2B brain wakes up only for the 20% that actually needs deep reasoning (knowledge synthesis, creative tasks, complex queries). This makes Lyla feel instant AND smart.

3. **Knowledge Hub** — 9 free, privacy-aligned APIs (Wikipedia, Wikidata, weather, countries, books, papers, dictionary, currency, holidays) with SQLite caching and Brain-powered synthesis. Per-message globe toggle gives users control over when knowledge queries fire.

4. **Auto-Memory (The Subconscious)** — Lyla automatically extracts facts from every conversation via 12 regex patterns + optional 350M Extractor model. Preferences, relationships, habits, intentions — all captured without the user explicitly saving anything. Semantic vector search (sqlite-vec, 384-dim) makes retrieval instant.

5. **Privacy By Architecture** — Zero telemetry. Zero analytics. Zero cloud. Everything runs on-device. The only network calls are to 9 free Knowledge Hub APIs (user-initiated, per-message toggle). Data is encrypted at rest via iOS Keychain / Android Keystore.

6. **Uncensored** — Ships with abliterated models. No refusals, no lectures, no "As an AI, I cannot...". The user's device, the user's rules.

7. **Works Offline** — Every core feature (chat, memory, tools, device APIs, math) works without internet. Knowledge Hub is the only online feature and degrades gracefully when offline.

8. **Math Engine** — mathjs-powered calculator handles arithmetic, trig, percentages, and unit conversions. Currency detection guard prevents misrouting to math when user wants currency conversion.

9. **Biometric Lock** — FaceID/TouchID gate on app open. Conversations stay private even if someone picks up your phone.

## Current Capabilities (Phase 2g Complete)

| Capability | How It Works | LLM Needed? |
|---|---|---|
| Time / Date | Direct device API | No |
| Battery Level | Direct device API | No |
| Device Info | Direct device API | No |
| Identity ("Who are you?") | Hardcoded responses with keyword matching | No |
| Capabilities ("What can you do?") | Hardcoded response | No |
| Math / Calculator | mathjs engine with sanitization | No |
| Calendar (read/write) | expo-calendar native tool | No |
| Contacts (lookup) | expo-contacts native tool | No |
| Reminders (create/list) | expo-notifications native tool | No |
| Clipboard (read/write) | expo-clipboard native tool | No |
| Text-to-Speech | expo-speech native TTS | No |
| Memory (save/recall/forget) | sqlite-vec vector search + Arctic Embed | No |
| Weather | Open-Meteo API → Brain synthesis | Yes |
| Countries | REST Countries API → Brain synthesis | Yes |
| Books | Open Library API → Brain synthesis | Yes |
| Research Papers | OpenAlex API → Brain synthesis | Yes |
| Dictionary | Free Dictionary API → Brain synthesis | Yes |
| Currency Conversion | ExchangeRate API → Brain synthesis | Yes |
| Public Holidays | Nager.Date API → Brain synthesis | Yes |
| General Knowledge | Wikipedia + Wikidata → Brain synthesis | Yes |
| Chat / Creative | Brain model (1.2B) | Yes |
| Real-time Questions | Factual guard → Brain honesty prompt | Yes |

## Mission

To give every person a truly private, intelligent system that lives on their device, understands their life, and never sends a byte of their data to anyone.

## Vision

Build the world's first **pocket-sized system intelligence** — a local, private, proactive AI that replaces the need for cloud AI subscriptions while providing superior personalization through deep device integration.

## Built By
**PrepMyRez** (prepmyrez.com) — by Pardha Saradhi Chukka

## Target Audience
**Everyone.** Not just developers or privacy enthusiasts. Lyla is for:
- Anyone who wants a smart assistant without monthly subscriptions
- Anyone who values their privacy and doesn't trust cloud AI with personal data
- Anyone in regions with unreliable internet who needs AI that works offline
- Anyone who wants their AI to actually know them and their life

## Platforms
- **iOS**: iPhone 12+ (iOS 16+), optimized for iPhone 13+
- **Android**: 4+ GB RAM, Android 10+

## License
Open Source (MIT or Apache 2.0 — TBD)

## Repository
- **Local:** `/Users/pardhasaradhichukka/Desktop/Lyla/`
- **Remote:** https://github.com/Pardhasaradhi9/Lyla.git
- **Branch:** main
