# Tiny (<2B) Mobile Language Models and Ecosystem Patterns for On-Device Assistants (2025–2026)

## Executive Summary

Sub‑2B parameter language models are now practical for offline‑first mobile assistants when treated as components inside a larger system: compiled runtimes (ExecuTorch, MLC‑LLM, LiteRT, ONNX Runtime Mobile), vector stores (sqlite‑vec/sqlite‑vss), tool‑calling layers (MCP, TinyAgent‑style datasets, SLIM/Function‑calling SLMs), and simple agent state machines. With careful quantization and NPU/GPU offload, 0.5–1.7B models can deliver usable latency and battery behavior on 4–8GB devices, especially when specialized for narrow tasks such as extraction, intent detection, and function calling.[1][2][3][4][5][6][7][8][9][10]

From 2025–2026, the strongest real‑world pattern is: a small chat backbone (TinyLlama 1.1B, SmolLM2‑1.7B, Qwen2.5‑0.5B/1.5B) orchestrates tools and RAG while most “intelligence” comes from the surrounding stack and user data, not from the raw model itself. Production deployments are still early, but open‑source demos like TinyAgent (1.1B function‑calling agent), PocketPal AI (SLM‑based offline assistant for Android/iOS), and multiple fully on‑device assistants using Llama‑3.2‑1B + Whisper‑tiny + TTS show that this approach is viable for constrained personal assistant workflows.[11][12][13][14][15][16][17][18][19]

***

## 1. Real‑World Builds Using Sub‑2B Models on Mobile

### Notable apps and demos

| Project | Model scale | Platform | Use case | Notes |
|--------|-------------|----------|----------|-------|
| MLC Chat | Up to 3B (includes 1–2B class) | iOS/Android | General chat, translation, multimodal | Runs models fully on‑device; supports Llama 3.2 and Phi/Gemma; NPU optimized.[20][21][22] |
| ExecuTorch Llama Android Demo | Llama 3.2 1B quantized | Android | Chat assistant demo | Official PyTorch demo; supports 1B quantized via XNNPACK/QNN; shows integration and UI patterns.[8][9] |
| TinyAgent‑1.1B | TinyLlama 1.1B | Mac (edge) | Local Siri‑like function‑calling assistant | 1.1B edge agent that can match/surpass GPT‑4 Turbo at function calling on curated tasks.[11][23][12] |
| PocketPal AI | Multiple SLMs (sub‑2B options) | Android/iOS | Offline personal assistant | All processing on‑device; supports multiple small models; focus on privacy and offline use.[16] |
| ONNX Runtime "MobileTransformers" | Qwen2‑0.5B, TinyLlama‑1.1B | Android (Pixel 6) | End‑to‑end on‑device training, RAG & inference | Demonstrates full on‑device PEFT/LoRA training and RAG with 500M–1B models.[24] |
| Llama‑3.2 1B Voice Assistant (community) | Llama‑3.2‑1B + Whisper tiny + Kokoro TTS | Android (ONNX Runtime) | Fully offline voice assistant | ASR→LLM→TTS all on‑device; privacy‑first assistant example.[18] |

Several desktop‑class "edge" projects (TinyAgent, MobileLLM) are not strictly mobile but demonstrate patterns directly applicable to phones: deep‑thin architectures, grouped‑query attention, aggressive 4‑bit quantization, and task‑specific fine‑tuning.[2][25][23][11]

### Reported UX: latency, accuracy, battery

Empirical numbers vary by SoC, quantization, and runtime, but several consistent ranges emerge:

- TinyLlama‑1.1B (4‑bit) on iPhone 15 Pro Max can reach ≈0.48 s time‑to‑first‑token and ~2.14 s total latency in a health‑event prediction application (not pure chat) with ~4.31GB RAM usage.[10]
- Llama‑3.2‑3B Q4 via MLC‑LLM on iPhone 14 Pro reaches 16–22 tokens/s, while llama.cpp on the same model gets 10–14 t/s, illustrating the benefit of AOT compilation and Metal‑specific kernels.[26]
- Snapdragon 8 Gen 3 and Apple M‑series NPUs can deliver 30–70 tokens/s for 3B models (Phi‑3 Mini Q4 at 60–100 t/s, Llama‑3.1‑8B at 15–25 t/s) with NPU offload. Sub‑2B quantized models generally exceed these speeds.[27]
- Consumer reports on Snapdragon 8 Gen 2 phones show ≈3 t/s on S20FE (3B model) vs ≈9 t/s on S23, indicating that sub‑2B Q4 models can run at comfortable chat speeds on mid‑range devices.[21][28]

Battery and thermals: case studies (Llama‑3.2 on mobile with ExecuTorch, MobileLLM) warn about 5–30 s responses and noticeable power draw for 3B+ models, recommending short context windows and Q4/Q5 quantization for acceptable thermals. Sub‑2B Q4 models tend to stay within reasonable thermal envelopes for intermittent use on 4–8GB phones.[29][30][2]

Failures/limitations observed:

- Many demo apps restrict context length (e.g., 256–512 tokens) to avoid out‑of‑memory and slow prefill, limiting long‑dialog memory.[8][30]
- High‑quality reasoning and open‑domain dialogue remain inferior to 30–70B models; users often report hallucinations and weak long‑horizon planning unless the system heavily relies on tools/RAG.[31][2]
- Some ExecuTorch users report export failures for certain 1B–1.5B variants (Llama 3.2 1B, Qwen2.5‑1.5B) on newer toolchain versions, showing ecosystem maturity issues.[32]

***

## 2. Specialization and Fine‑Tuning for Tiny Models

### Function calling and structured output

Several specialized small models and frameworks directly target function calling and structured extraction:

- **TinyAgent‑1.1B**: fine‑tunes TinyLlama‑1.1B on ≈80k synthetic function‑calling examples generated via LLMCompiler to produce accurate tool plans and arguments, with a novel tool retrieval module that selects only relevant tools to keep prompts short.[23][12][11]
- **SLIM‑EXTRACT‑TINY / SLIM‑EXTRACT‑TINY‑TOOL**: a function‑calling SLM series where slim‑extract‑tiny is fine‑tuned on TinyLlama‑1B for structured extraction and slim‑extract‑tiny‑tool is a Q4_K_M quantized GGUF optimized for fast, multi‑model deployment; the model outputs Python dicts based on custom keys via a lightweight function schema.[3][4]
- **NuExtract‑tiny**: a Qwen1.5‑0.5B‑based model fine‑tuned for JSON extraction; users provide an input text and a JSON template, and the model fills the template reliably.[33]
- **Callama / other function‑calling fine‑tunes**: community projects fine‑tune Llama 3.x and TinyLlama for function‑calling using synthetic data and frameworks like Instructor, enabling robust JSON tool arguments even on small models.[34][35]

Patterns that work for <2B models:

- **Constrained decoding + templates**: models are prompted with explicit XML/JSON templates (`<function>...</function>`) and decoded with regex/JSON validators, dramatically reducing invalid outputs.[4][3][34]
- **Schema‑aware few‑shot**: 2–3 in‑prompt examples of tool calls with different argument shapes greatly improve accuracy for small models, more so than for 7B+ models.[11][34]
- **Tool retrieval before generation**: TinyAgent retrieves a subset of available tools based on a retrieval model or keyword matching, then only exposes those functions to the SLM, reducing confusion and context length.[12][23]

### Intent classification and slot filling

Although the literature is thinner here, several patterns emerge from SLIM/SLM work:

- Use tiny encoder models for classification (e.g., all‑MiniLM‑L6‑v2 exported to ONNX) while the decoder‑style SLM handles generation and planning.[6][36]
- For assistants, a 0.5B–1B model (Qwen2.5‑0.5B, TinyLlama‑1.1B) is sufficient to classify intents and slots when combined with few‑shot prompt templates and domain‑specific vocabularies.[14][37][10]

### Fine‑tuning and distillation techniques viable on mobile


- **LoRA/PEFT on‑device**: MobileTransformers demonstrates on‑device LoRA for 500M–1B ONNX models (Qwen2‑0.5B, TinyLlama‑1.1B) on a Pixel 6, including training, merging, and inference directly on the handset.[24]
- **Deep‑thin and weight‑sharing architectures**: MobileLLM uses deep‑thin transformers, SwiGLU, embedding sharing, and grouped‑query attention to achieve significant accuracy gains for ≤1B models without increasing parameters, showing that architecture choices can outperform naive scaling.[25][29][2]
- **RL and data‑centric overtraining**: SmolLM2‑1.7B is trained on ≈11T tokens with multi‑stage data curation (FineMath, Stack‑Edu, SmolTalk) and alignment techniques like DPO, yielding performance competitive with larger opaque small models (Qwen2.5‑1.5B, Llama3.2‑1B).[13][15][38][39]

Practical training constraints:

- On‑device fine‑tuning is currently limited to low‑rank adapters and small datasets (tens to hundreds of MB) due to thermal and memory limits, making it better suited for personalization than foundation training.[24]
- Most production‑grade small models (SmolLM2, Qwen2.5, TinyLlama chat variants) are trained in the cloud and only adapted or quantized for on‑device usage.[15][17][19][13]

***

## 3. Inference Runtimes and Hardware Utilization

### Mobile runtimes with good sub‑2B support

| Runtime | Platforms | Notable features for tiny LMs |
|--------|-----------|-------------------------------|
| ExecuTorch | Android/iOS | Official Meta path for Llama 3.2 1B/3B; XNNPACK (CPU), QNN (Qualcomm NPU), MediaTek delegates; supports 4‑bit groupwise quantization and quantized Llama 3.2 1B.[8][9][40] |
| MLC‑LLM | Android/iOS/desktop | AOT compilation to Metal (iOS) and Vulkan (Android); model‑specific shaders; higher t/s vs llama.cpp for same model/quantization.[26][41] |
| LiteRT (ex‑TFLite) | Android/iOS/desktop | New CompiledModel API, MLDrift GPU engine, Qualcomm and MediaTek NPU delegates; up to 25× faster and 5× lower power vs CPU; rebranded in Feb 2026.[42][43][44][45] |
| ONNX Runtime Mobile | Android/iOS | Full on‑device workflow; supports training + inference + RAG on 500M–1B models; used for Phi‑3 Mini and MobileTransformers.[46][47][24] |
| Core ML / MLX | iOS/macOS | Strong Apple‑only path; used in TinyAgent Mac assistant and in iOS local LLM demos; integrates well with Apple Neural Engine.[11][23][21] |

### NPU, GPU, and CPU utilization

Research and vendor docs emphasize offloading as much as possible to NPUs or mobile GPUs:

- Qualcomm Snapdragon 8 Gen 3 Hexagon NPU (≈45 TOPS) and Apple M‑series/Neural Engine can generate tens of tokens per second for 3B+ models, meaning sub‑2B Q4 models can achieve smooth chat rates even on mid‑tier phones.[48][49][27]
- LiteRT NeuroPilot Accelerator and Google’s NPU integration streamline NPU deployment and hide vendor differences, making NPU acceleration practical at scale.[42][45][44]
- Academic frameworks like llm.npu and sd.npu show that combining speculative decoding with NPU‑coordinated execution significantly reduces prefill latency and energy for mobile‑sized models.[50][51]

Quantization patterns:

- 4‑bit groupwise quantization (Q4_K_M and variants) is the consensus sweet spot for mobile: fits 1–1.7B models in ≲1GB, preserves most quality, and is supported by ExecuTorch, MLC‑LLM, and GGUF engines.[52][9][4]
- For extremely constrained devices, 2‑bit and mixed‑precision (Q2_K + higher precision layers for attention/output) are being explored but often incur noticeable quality loss except on narrow tasks.[29][2]

***

## 4. Ecosystem Scaffolding: RAG, Memory, Tools, and Orchestration

### Lightweight on‑device RAG

The dominant pattern is to pair a small decoder model with an encoder and a vector store built on SQLite:

- **sqlite‑vss/sqlite‑vec**: vector search extensions to SQLite designed to run “anywhere” (including Android/iOS) with minimal footprint (<200KB for sqlite‑vec mobile builds), offering IVF‑based approximate nearest neighbor search and tight integration with existing app databases.[53][7][54]
- A 2026 mobile RAG guide demonstrates a full offline pipeline using ONNX Runtime Mobile + sqlite‑vss + Kotlin Multiplatform (KMP) with ~38MB total footprint and ~140ms p95 latency on a Pixel 7a for a 10k‑document corpus.[36][6]
- Tutorials on RAG with SQLite show “single‑stack” designs where both RAG and app state live in a single SQLite database, simplifying sync and versioning.[55][56]

Typical architecture:

- A small encoder (all‑MiniLM‑L6‑v2 INT8 via ONNX) produces embeddings.[6][36]
- Vectors are stored in sqlite‑vec/vss within the app’s existing SQLite DB.[7][53]
- The tiny decoder (TinyLlama/SmolLM2/Qwen2.5‑0.5B/1.5B) receives top‑k chunks concatenated into the prompt.[17][19][13]

### Memory systems

Although few public projects explicitly implement “Hermes‑style” long‑term memory on mobile, several building blocks exist:

- Long‑context small models (e.g., Qwen2.5‑1.5B/3B with up to 128K context; SmolLM2 with extended context to 8K) can keep session history or summarized memories on‑device, especially when combined with RAG over a local DB.[57][15][17]
- SQLite‑backed memory stores using vector tables allow storing user summaries, preference records, and task histories for retrieval into prompts.
- Community patterns recommend periodic summarization: compress past turns into short summaries via the same tiny model, then store embedding + summary record and drop raw turns.

### Tool abstraction and agent orchestration

- **MCP (Model Context Protocol)** is emerging as a standard tool schema for both local and remote tools. Local stdio MCP servers expose filesystems, SQLite DBs, or device‑specific actions; assistants treat them as tools discoverable via a JSON schema.[58][59][60][61]
- Offline MCP mode: local servers expose tools and resources fully offline, caching any external data in advance and keeping all tool I/O on device.[60]
- On desktop, TinyAgent shows how a 1.1B SLM can reliably call local tools by being fine‑tuned on high‑quality tool‑calling data and prompted with schemas and past examples.[23][12][11]
- For mobile, emerging frameworks like Foundry Local explore on‑device MCP‑based agents that call local tools via a local runtime.[62]

Orchestration patterns for tiny models:

- Simple finite‑state machines or small LangGraph‑like graphs with 2–3 reasoning steps (intent → plan → act) are favored over deep recursive agents.[5][11]
- Tool routing is often performed by heuristics or lightweight classifiers rather than the tiny model itself, to avoid mis‑routing and long prompts.
- Graceful degradation: when small models fail to parse tool outputs or produce invalid JSON, systems fall back to default behaviors ("show options", "ask user to confirm") or escalate to a cloud model.

***

## 5. Mixture of Tiny Agents on a Single Device

Direct literature on multi‑SLM ensembles on phones is sparse, but several adjacent patterns exist:

- Voice assistants that chain ASR (Whisper tiny), a 1B planner, and a small TTS model already embody a 3‑model pipeline on mobile; community projects running Llama‑3.2‑1B + Whisper tiny + Kokoro TTS on ONNX Runtime are explicit about this composition.[18]
- The TinyAgent framework conceptually separates a planner (SLM) from tool executors and retrieval modules, though it runs a single 1.1B model for planning/function calling.[11][23]
- Slim‑extract‑tiny and similar function‑calling SLMs are designed to be embedded alongside a larger chat model, enabling multi‑model pipelines where a tiny extractor performs structured output while a somewhat larger model handles open‑ended dialogue.[3][4]

Research on speculative decoding for mobile (sd.npu, llm.npu) shows architectures where a tiny draft model and a larger target model run jointly, but these are more about decoding speed than specialization.[51][50]

Empirically, multi‑model ensembles on a single 4–8GB device are constrained by RAM and storage; thus the primary pattern is to use one decoder model plus several smaller encoders (embeddings, ASR) rather than several full chat models.

***

## 6. On‑Device MCP and Local Tool Protocols

### MCP state (2025–2026)


- MCP is widely adopted as a standard for connecting assistants to tools, with support for both local stdio servers and remote HTTP servers.[59][58]
- Offline MCP mode is highlighted by vendors and guides as a way to keep tools local while remaining protocol‑compatible; local servers can expose filesystem operations, SQLite queries, or device actions without network access.[59][60]
- Embedded platforms like ESP‑IDF now ship a "Tools local MCP server" that exposes build/flash commands as tools via stdio, demonstrating that MCP servers can run on constrained devices.[61]

For mobile, there is no unified “on‑device MCP for Android/iOS” yet, but patterns are emerging:

- Run MCP servers in a background process or service on the device (Node, Python, Rust), exposing local tools such as file read/write, local HTTP endpoints, or app‑specific actions.[60][59]
- Use small models with strong function‑calling (TinyAgent‑1.1B, SLIM‑EXTRACT‑TINY) as the MCP client, mapping tool schemas to model prompts and parsing structured responses.[4][3][11]

Security and permissions:

- MCP guides emphasize OS‑level permissions and sandboxing: keep servers local via stdio, isolate file access to app sandboxes, and prompt the user for explicit consent before enabling sensitive tools.[59][60]
- ESP‑IDF’s local MCP server omits authentication but relies on local development context, showing that production mobile assistants will need additional auth layers for device‑wide tools.[61]

***

## 7. Hybrid Architectures (Local + Cloud)

Hybrid architectures where a local tiny model routes to cloud LLMs are widely discussed but sparsely open‑sourced:

- Industry blogs argue that Apple’s Foundation Models, ExecuTorch, and LiteRT enable local‑first workflows for privacy‑sensitive, low‑latency tasks (e.g., autocomplete, short replies) while cloud models still handle complex reasoning and long‑context tasks.[43][44][31]
- Several open‑source assistant projects (e.g., YourOwnAI, Maid) let users configure both local GGUF models and remote APIs, typically with heuristic routing based on model names or manual toggles rather than dynamic confidence.[63]

Common escalation triggers:

- Heuristics on prompt length, task type (e.g., code generation, open‑domain research), or user‑selected “quality vs privacy” modes.
- Basic confidence proxies: low logit margins or repeated tool call failures can trigger escalation to a cloud model.

Context syncing patterns:

- Store all user history in an on‑device SQLite DB; when escalating, send only the minimal relevant context or a summarized version, reducing privacy leakage.
- Use on‑device RAG to select the k most relevant chunks and attach them to the cloud prompt rather than streaming raw logs.

There are no widely cited, fully open‑source reference implementations of these handoff patterns purpose‑built for mobile yet; most are emerging inside proprietary stacks.

***

## 8. Benchmarks and Task Completion for Tiny‑Plus‑Scaffolding Systems

Most public benchmarks still emphasize academic metrics (MMLU, GSM8K), but several works and blogs focus on real tasks:

- **MobileLLM**: shows sub‑1B models approaching LLaMA‑v2‑7B on chat benchmarks and achieving similar correctness to LLaMA‑v2‑7B on API‑calling tasks, suggesting that optimizing architecture and post‑training for tool use substantially narrows the gap to larger models.[2][29]
- **TinyAgent**: demonstrates that TinyAgent‑1.1B can match or surpass GPT‑4‑Turbo on function‑calling accuracy for a curated tool‑calling benchmark, while running fully on edge hardware.[12][23][11]
- **TinyLlama‑1.1B health prediction**: benchmarks on real health events show that a 4‑bit TinyLlama model can achieve top SLM performance with good latency and memory on iPhone hardware.[10]

However, there is no comprehensive, public benchmark specifically comparing "tiny model + RAG + tools" vs monolithic 30–70B models on rich assistant workflows like scheduling or multi‑app automation. Evaluations tend to be task‑specific and vendor‑run.

***

## 9. Key Players and Resources

### Model and framework providers

- **Hugging Face / SmolLM2**: publishes SmolLM2‑1.7B and datasets, with transparent training recipes for small models and strong benchmarks.[38][13][15]
- **Alibaba / Qwen**: Qwen2.5 series with 0.5B and 1.5B models optimized for multilingual and structured outputs, explicitly marketed for edge deployment.[37][14][17]
- **TinyLlama project**: 1.1B Llama‑2‑compatible model trained on 3T tokens, widely used as a base for edge‑optimized SLMs.[64][19][10]
- **Meta / ExecuTorch**: official on‑device runtime for Llama 3.2 1B/3B with hardware delegates for Qualcomm and MediaTek; recommended path for Llama on mobile.[9][40][8]
- **TVM / MLC‑LLM**: ahead‑of‑time compiled models for iOS/Android with strong performance, plus MLC Chat reference app.[22][41][26]
- **Microsoft / ONNX Runtime + Phi‑3**: blogs and tutorials on running Phi‑3 Mini and other models on mobile and web with 4‑bit quantization.[47][24]
- **Google / LiteRT (ex‑TFLite)**: cross‑platform on‑device inference with NPU/GPU acceleration and LLM support.[45][44][42]

### Tooling, RAG, and MCP ecosystem

- **sqlite‑vec/sqlite‑vss**: core libraries for on‑device vector search, including mobile builds and Kotlin/React Native bindings.[54][53][7]
- **MCP community**: guides and blogs on local MCP deployments, security, and hybrid tool setups.[58][60][61][59]
- **Phone GUI Agent survey (PhoneLLM)**: taxonomy of LLM‑powered phone GUI agents, many using local or edge models for UI automation.[65]

### Starter kits and guides

- MLC‑LLM Android/iOS docs and MLC Chat app provide end‑to‑end examples of downloading models, running them locally, and integrating into apps.[20][41]
- ExecuTorch Llama Android demo and docs show how to export, quantize, and deploy Llama‑3.2‑1B in a Kotlin app with hardware delegates.[8][9]
- ONNX Runtime Mobile tutorials and the MobileTransformers discussion show complete pipelines (training + inference + RAG) on Android.[46][24]
- Mobile RAG with sqlite‑vss on KMP offers a strong reference for building cross‑platform offline RAG in a shared codebase.[36][6]

***

## 10. Gaps, Pain Points, and Unsolved Problems

### Developer experience

- Export and tooling fragility: users report broken exports for newer models and ExecuTorch versions (e.g., Llama‑3.2 1B, Qwen2.5‑1.5B), requiring manual patches or tooling downgrades.[32]
- Debugging on‑device LLMs is still primitive: logs are often just stdout; profiling NPU/GPU usage requires vendor tools; stack traces through multiple layers (PyTorch→Export→Runtime) are hard to interpret.

### Data and fine‑tuning pipeline

- On‑device training remains niche; most personalization is done via in‑context learning or tiny adapters due to thermal limits and app store concerns about background compute.[24]
- Collecting high‑quality, privacy‑preserving fine‑tuning data on device is unsolved at scale—most systems either keep all data local (no aggregation) or rely on optional telemetry.

### Distribution and updates

- Shipping large model binaries (hundreds of MB) pushes app size limits and store policies; many apps must download models after install, complicating offline‑first guarantees.[30][21][20]
- Keeping models and vector indexes up‑to‑date without violating privacy or blowing up data usage is an open product challenge.

### Evaluation of holistic systems

- There is no commonly accepted benchmark suite for "assistant + tools + RAG" under mobile constraints; most evaluation uses synthetic tool‑calling benchmarks or subjective UX reports.[2][23][11]

### Likely 6‑month breakthroughs

- Better NPU‑aware runtimes (ExecuTorch, LiteRT, ONNX Runtime) with first‑class support for small LMs and multimodal models on Android/iOS NPUs.[40][44][45]
- More open, small function‑calling and tool‑use models (TinyAgent‑like) explicitly targeting edge deployment and MCP integration.[5][11]
- Reference architectures and SDKs from major vendors bundling local models, RAG, tool schemas, and hybrid routing out of the box.

***

## Actionable Outputs

### A. Starter Stack for a Mid‑Tier Android Phone (4–8GB RAM)

**Goal:** Offline‑first personal assistant focusing on notes, reminders, and basic automation.

Recommended stack:

- **Model (decoder):** TinyLlama‑1.1B‑Chat or Qwen2.5‑0.5B‑Instruct in Q4_K_M quantization (GGUF or runtime‑native format) for general assistant behavior.[19][66][14][17]
- **Runtime:** ONNX Runtime Mobile (if you prefer ONNX‑based models) or ExecuTorch for Llama‑family models.
  - ONNX Runtime is already proven for 500M–1B models and integrates well with Android; ExecuTorch is the canonical path for Llama‑3.2‑1B and will benefit from Meta’s optimizations.[9][46][8][24]
- **RAG/Memory:** sqlite‑vec or sqlite‑vss inside your existing SQLite DB for:
  - Note and document retrieval.
  - Long‑term memory via summaries stored as embeddings + metadata.[53][7][6][36]
- **Tools (local MCP‑like layer):**
  - Define a small set of JSON‑schema tools (create_reminder, list_events, append_note) and implement them as local Kotlin functions.
  - Optionally expose them via a local stdio or gRPC server that follows MCP tool semantics for future compatibility.[60][59]

Memory pattern:

- Keep a short rolling context (last 10–20 turns) in the prompt.
- After each conversation, have the tiny model generate a 2–3 sentence summary of new facts/preferences and store that summary plus an embedding in SQLite.
- On each new query, retrieve k=3–5 summaries via sqlite‑vec/vss and prepend them as "memory" context.

On a Snapdragon 7/8‑series device, this stack should remain under ≈1GB RAM for the model plus ≲100MB for embeddings and indexes and achieve interactive latency at Q4 precision.[28][27][10]

### B. Decision Tree: Architecture by Use Case


- **If your primary use case is structured extraction (forms, invoices, logs):**
  - Use SLIM‑EXTRACT‑TINY‑TOOL or NuExtract‑tiny as the main model, with sqlite‑vec storing extracted records.
  - Runtime: any GGUF‑capable engine (llama.cpp mobile port, MLC‑LLM) or ONNX Runtime if you re‑export.[33][3][4]

- **If your use case is voice assistant with offline operation:**
  - ASR: Whisper‑tiny or equivalent ONNX model.
  - LM: TinyLlama‑1.1B‑Chat or Qwen2.5‑0.5B, quantized.
  - TTS: small neural TTS (e.g., Kokoro or similar) on ONNX.
  - Runtime: ONNX Runtime Mobile for all three; orchestrate in a single Android service.[47][18]

- **If your use case is app/GUI automation on the phone:**
  - Use a slightly larger model (1–1.5B) if possible (TinyLlama‑1.1B, Qwen2.5‑1.5B) with strong tool‑calling fine‑tuning.
  - Represent UI actions as tools (tap, scroll, enter_text) and drive them via an Appium‑like bridge (CogniSim, PhoneLLM patterns).[67][65]

- **If your use case is code assistant or developer helper on device:**
  - Use Qwen2.5‑Coder‑1.5B‑Instruct with Q4 quantization if hardware allows; otherwise consider a 0.5B coder.[68]
  - Add on‑device RAG over the project (sqlite‑vec + embeddings) and a local MCP server exposing git, build/test commands.[7][59]

- **If you must support both Android and iOS with one core stack:**
  - Choose ONNX Runtime + KMP or MLC‑LLM + shared core library.
  - For RAG, use sqlite‑vec‑based vector tables accessible from both platforms.[41][6][53]

### C. Repos to Clone and Run This Weekend

1. **TinyAgent (SqueezeAILab/TinyAgent)** – function‑calling SLM agents at the edge; includes TinyAgent‑1.1B models, dataset, and Mac assistant demo.[23][12][11]
2. **MLC‑LLM + MLC Chat** – end‑to‑end example of running local models on Android/iOS with good docs and performance; includes Llama‑3.2 and small models.[20][22][41]
3. **ExecuTorch Llama Android Demo** – official Android app that runs Llama‑3.2‑1B quantized, showing export, quantization, and UI wiring.[8][9]
4. **sqlite‑vec / sqlite‑vss mobile examples** – vector search on Android/iOS; includes precompiled mobile builds and guides for on‑device RAG.[54][53][7]
5. **ONNX Runtime MobileTransformers discussion & sample** – demonstrates on‑device LoRA training and full RAG stack for 500M–1B models on Android.[46][24]

### D. Red Flags and Dead Ends to Avoid

- Relying on a single tiny general‑purpose chat model without tools or RAG; real users will quickly hit hallucinations and capability ceilings compared to cloud assistants.[31][2]
- Over‑investing in 2‑bit quantization and extreme compression for general assistants; quality losses can be severe, and 4‑bit is a better default for 4–8GB devices.[4][9]
- Building complex multi‑hop agents (dozens of steps) on a single 0.5–1B model; instead, constrain to 2–3 planned steps + tools and rely on deterministic orchestration.
- Ignoring NPU/GPU paths and running everything on CPU; this wastes battery and will limit UX on mid‑tier phones.[44][42][45]
- Treating MCP as a cloud‑only protocol; you will miss the chance to standardize local tool schemas and future‑proof your design for hybrid deployments.[59][60]

Overall, the ecosystem in 2025–2026 suggests that sub‑2B mobile assistants are best viewed as *tool‑centric*, with the SLM acting as a planner/controller. The winning systems pair a strong small model (SmolLM2‑1.7B, TinyLlama‑1.1B, Qwen2.5‑0.5B/1.5B) with NPU‑aware runtimes, SQLite‑based RAG/memory, and a thin layer of agent logic plus MCP‑style tools.