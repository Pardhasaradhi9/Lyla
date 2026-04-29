**Top 10 features and novel ideas users are actively requesting for private, local on-device AI assistants** (Siri- or Gemini-like experiences, but fully private and running on mobile/desktop hardware).

I did deep research across Reddit (especially r/LocalLLaMA and r/ollama), Hacker News, and X. The consensus is clear: users want **more than a basic chatbot**. They want a hybrid of a **reliable personal assistant** (task automation, tool use) **and a daily companion/chatter** (persistent memory, personality, proactive help). Privacy is non-negotiable—everything stays on-device with no cloud leaks. On-device models (via Ollama, LM Studio, Apple’s Foundation Models/CoreML, etc.) are seen as the path to low-latency, always-available experiences.

Here are the **top 10 most-discussed ideas**, ranked roughly by frequency and excitement in the communities:

1. **Persistent Long-Term Memory with User Corrections & Knowledge Graphs**  
   Users want the assistant to *actually remember* facts about them (preferences, life details, past conversations) across days/weeks, stored in a knowledge graph or vector DB (e.g., Chroma/Neo4j + RAG). It should auto-save important info, accept corrections (“my name is now…” or “update my job”), and retrieve it contextually without reloading full history. This turns it from a forgetful chatbot into a true “personal” companion. Many call this “table stakes” for usefulness.

2. **Safe, Auditable Agentic Tool Use & Sandboxed Actions**  
   Tool calling is huge—web search/fetch, code execution in a sandbox (Docker/Linux container), file ops, email/calendar actions—but it must be transparent, auditable, and user-confirmed to avoid hallucinations or privacy risks. Users want multi-step workflows (e.g., “research X, summarize, add to calendar”) that feel like a real agent, not just chat. Sandboxing (e.g., virtual machines) is repeatedly requested for safety.

3. **Offline Voice Interaction + Always-On / 24/7 Presence**  
   Two-way voice (STT/TTS) that works fully locally, with always-listening mode (room mics + speakers) or mobile remote access. Users envision a “Jarvis in the room” or pocket companion that handles casual chatter, reminders, or commands without waking the device aggressively. Low-latency on-device models make this feel magical vs. cloud lag.

4. **Deep Personal Data RAG & Proactive Context Awareness**  
   “Chat with your entire life”—RAG over personal files, Obsidian notes, emails, photos, browsing history, or even Google Drive exports. The assistant proactively surfaces relevant info (e.g., overnight email categorization, “here’s what you might need for today’s meeting”). Users want it to build a rich personal index automatically.

5. **Multi-Modal On-Device Processing (Docs, Images, Audio, Screen)**  
   Local handling of PDFs → clean markdown, OCR on screenshots/images, audio transcription/summarization, video understanding, and even screen awareness (for browser or app control). Novel request: teach the assistant new actions via screen recordings or step-by-step visual demos. iOS prototypes already demo this successfully.

6. **Companion Personality for Daily Chatter & Emotional Engagement**  
   Not just tasks—users explicitly want a “daily chatter” or sassy/friendly companion that learns your writing style, MBTI, or social media data for personalized, engaging responses. It should handle casual “how’s your day?” talk, give emotionally resonant replies (“I’m proud of you”), and feel like a persistent friend rather than a tool. This is a big differentiator from cloud assistants.

7. **OS-Level Control & Browser/ App Integration**  
   On desktop/mobile: open/close/switch apps, manage files/workspaces, control smart home (lights, cameras, reminders), and maintain context across browser tabs. Users want prompt-driven actions (“pull notes from last week’s call and queue my playlist”) with no menus. Browser-native assistants with local web-page processing are a hot emerging request.

8. **Scheduled/Proactive Workflows & Multi-Channel Notifications**  
   “Set it and forget it”: daily email summaries, news digests, reminders via existing channels (email/IM/Slack), or overnight processing. Users love the idea of waking up to a categorized inbox or task list. This makes the assistant feel indispensable for daily life rather than on-demand only.

9. **Efficient Multi-Agent Swarms on Low-Resource Hardware**  
   Novel architecture request: small specialized models (memory agent, vision/OCR agent, tool-caller) orchestrated by a larger one—all fitting in 8–16 GB VRAM or even mobile NPUs. This enables “agentic swarms” that feel powerful without needing a beefy GPU. Perfect for mobile/desktop users who want responsiveness without high power draw.

10. **Full Privacy-First Offline Operation with Easy Customization**  
    Everything local by default (no data ever leaves the device), with optional safe hybrid extensions. Users want dead-simple model swapping (Ollama/LM Studio), custom system prompts, and fine-tuning on their own data. Bonus requests: low-footprint models for older hardware and clear “what stays private” transparency. This is the #1 reason people are excited about on-device vs. Gemini/Siri.

**Overall vibe from the communities**: Most users aren’t chasing sci-fi super-intelligence yet—they want something *reliable, private, and sticky* that blends task help with casual companionship. Memory + tool use + voice is the current “minimum viable personal assistant,” while proactive workflows and personality make it feel like a daily companion. Projects like open-source knowledge-graph companions, iOS on-device agents, and sandboxed tools (Computron, etc.) are already prototyping these and getting strong feedback.

These ideas are directly pulled from active discussions—many builders are already shipping prototypes. If you’re developing something in this space, memory + agentic tools + voice would be the fastest path to “this actually feels better than Siri/Gemini for daily use.” Let me know if you want deeper dives into any specific idea or links to the projects mentioned!