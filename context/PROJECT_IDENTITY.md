# Project Identity — LYLA

## Name
**Lyla** — "Your Life, Your Language, Your AI."

## What Is Lyla?

Lyla is a **privacy-first system intelligence** for iOS and Android that runs entirely on the user's phone. It is NOT a chatbot with features bolted on. It is a complete system — sensors, tools, memory, and a brain (LLM) — that works together to create something neither could be alone.

Think of it as **a pocket-sized Jarvis**. The system (calendar, contacts, reminders, device APIs) is the body. The LLM is the brain. The brain makes the system smart. The system makes the brain useful.

## The Core Principle

```
Traditional AI Assistant:    User → LLM → Response
                              (brain does everything, badly)

Traditional System App:      User → Rules/APIs → Response
                              (no brain, rigid, dumb)

Lyla:                        User → System → Brain ↔ System → Response
                              (body + brain working together)
```

A 1.2B model hallucinates on its own. A calendar API is dumb on its own. But a 1.2B model that can **read your calendar, search your contacts, check your battery, remember your preferences, set reminders, and reason over all of it** — that's something neither could be separately.

## What Makes Lyla Different

1. **System Intelligence, Not Chatbot** — Lyla is a body with a brain. Tools, sensors, and APIs form the body. The LLM is the brain. Every interaction routes through the system first, the brain second.

2. **Multi-Model Architecture** — A 350M router handles 80% of interactions in <50ms (intent classification, tool calls, fact extraction). The 1.2B brain wakes up only for the 20% that actually needs deep reasoning. This makes Lyla feel instant AND smart.

3. **Auto-Memory (The Subconscious)** — Lyla automatically extracts facts from every conversation. Preferences, relationships, habits, intentions — all captured without the user explicitly saving anything. Semantic vector search (sqlite-vec) makes retrieval instant.

4. **Privacy By Architecture** — Zero telemetry. Zero analytics. Zero cloud. Everything runs on-device. The only network call is optional web search. Data is encrypted at rest via iOS Keychain / Android Keystore.

5. **Uncensored** — Ships with abliterated models. No refusals, no lectures, no "As an AI, I cannot...". The user's device, the user's rules.

6. **Works Offline** — Every core feature (chat, memory, tools, device APIs) works without internet. Web search is the only online feature and degrades gracefully when offline.

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
`/Users/pardhasaradhichukka/Desktop/Lyla/` (local development)
