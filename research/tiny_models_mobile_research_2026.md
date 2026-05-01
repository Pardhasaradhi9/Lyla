# 🧠 Tiny Models (<2B) + Ecosystem = Mobile Assistant Power
## State of the Field: 2025–2026
> Research compiled April 2026 | Sources cited with timestamps

---

## 1. The Model Landscape: What's Actually Worth Deploying

### Key Models Under 2B (April 2026)

| Model | Params | Format | Strengths | Mobile-Ready? |
|---|---|---|---|---|
| **Qwen3-0.6B** | 0.6B | GGUF, ONNX | Thinking/non-thinking dual mode, 32K ctx, tool use | ✅ Android/iOS |
| **Qwen3-1.7B** | 1.7B | GGUF, ONNX | Best-in-class at size, multilingual, agentic | ✅ Android/iOS |
| **Gemma 3 1B** | 1B | `.task` (LiteRT) | 2,585 tok/s prefill on mobile GPU, 529MB | ✅ Android first |
| **FunctionGemma** | 270M | LiteRT-LM, GGUF | Specialized for function calling only | ✅ Phone + Jetson |
| **LFM2.5-1.2B** | 1.2B | GGUF, ONNX, MLX | 82 tok/s on mobile NPU, <1GB RAM, agentic | ✅ Android/iOS |
| **LFM2.5-VL-450M** | 450M | GGUF, ONNX | Vision+language, bounding box, 250ms on edge | ✅ Snapdragon 8 Elite |
| **MiniCPM4-0.5B** | 0.5B | ONNX | 78 tok/s on Snapdragon 8 Gen 2 (CPU) | ✅ Android |
| **MiniCPM-V 4.0** | ~4.1B | llama.cpp | 17 tok/s, <2s TTFT on iPhone 16 Pro Max | ⚠️ High-end only |
| **MobileLLM-Flash-350M/650M/1.4B** | 350M–1.4B | ExecuTorch | Meta's hardware-in-the-loop latency-optimized | ✅ Meta internal + open |

### The Density Insight

Qwen3 dense base models match Qwen2.5 models with significantly more parameters — Qwen3-1.7B performs as well as Qwen2.5-3B on many benchmarks — due to architectural improvements and more effective training methods. *(Qwen3 release blog, April 2025)*

This means the effective capability of a 1.7B model in 2025–2026 is closer to what a 3B model delivered in 2024.

---

## 2. Inference Runtimes: The Real Performance Numbers

### Framework Comparison

| Runtime | Primary Compute | Android | iOS | NPU Support | Notes |
|---|---|---|---|---|---|
| **ExecuTorch** | CPU/GPU/NPU | ✅ | ✅ | ✅ 12+ backends | Meta's production runtime |
| **MLC LLM** | GPU (OpenCL) | ✅ | ✅ | ❌ limited | TVM-compiled, fast decode |
| **llama.cpp** | CPU | ✅ | ✅ | ❌ | GGUF de-facto standard |
| **MNN (Alibaba)** | CPU/GPU | ✅ | ✅ | ⚠️ partial | Powers Qwen native apps |
| **Google LiteRT** | CPU/GPU/DSP | ✅ | 🔜 | ⚠️ partial | Gemma's native home |
| **mllm-NPU** | NPU (Qualcomm) | ✅ | ❌ | ✅ QNN | Research prototype |
| **LEAP (Liquid AI)** | CPU/GPU/NPU | ✅ | ✅ | ✅ Qualcomm/AMD | Proprietary SDK |

### Key Performance Data Points

**ExecuTorch (Meta, GA October 2025)**
ExecuTorch hit 1.0 GA in October 2025, with a 50KB base footprint, support for 12+ hardware backends (Apple, Qualcomm, Arm, MediaTek, Vulkan), and over 80% of the most popular edge LLMs on HuggingFace working out of the box. Meta now uses it across Instagram, WhatsApp, Messenger, and Facebook, serving billions of users.

**NPU breakthrough (ASPLOS '25, March 2025)**
The mllm-NPU system achieves 22.4× faster prefill speed and 30.7× energy savings compared to CPU/GPU baselines, and for the first time achieves more than 1,000 tokens/sec prefilling for a billion-sized model.

**NPU caveat**
Only mllm and PowerInfer-2 claim to support Qualcomm NPUs for LLM inference; the typically closed-source nature of vendor-specific SDKs creates significant development barriers. *(arXiv:2410.03613, benchmarking paper July 2025)*

**Real numbers on mid-tier Android**
On Nubia Z50 (Snapdragon 8 Gen 2, Android 15): MiniCPM4-0.5B at Q4F32 achieves **78 tokens/sec on CPU alone**. *(DakeQQ/Native-LLM-for-Android, GitHub commit January 2026)*

**Battery math**
A 7B-parameter LLM consumes 0.7 J/token — a fully charged iPhone can sustain it for less than 2 hours at 10 tokens/s. A 350M 8-bit model at 0.035 J/token can support conversational use for an entire day. *(MobileLLM paper, arXiv:2402.14905)*

**LFM2.5-1.2B performance (Liquid AI, November 2025)**
- 239 tok/s decode on AMD CPU
- 82 tok/s on mobile NPU
- Runs under 1GB of memory

**LFM2.5-VL-450M latency (April 2026)**
- Jetson Orin: 233ms for 256×256 image, 242ms for 512×512
- Samsung S25 Ultra (Snapdragon 8 Elite): 950ms for 256×256, 2.4s for 512×512
- AMD Ryzen AI Max+ 395: 637ms for 256×256

**Gemma 3 1B (Google AI Edge, March 2025)**
At only 529MB, Gemma 3 1B runs up to 2,585 tokens per second pre-fill on the mobile GPU, processing up to a page of content in under a second.

---

## 3. Real-World Builds That Actually Ship

### 🟢 DakeQQ/Native-LLM-for-Android
- **GitHub:** `github.com/DakeQQ/Native-LLM-for-Android` *(Updated January 2026)*
- Models supported: Qwen3 (0.6B, 1.7B, 4B), Gemma-3-it (1B), Llama-3.2-Instruct (1B), MiniCPM (0.5B, 1B, 2.7B), DeepSeek-R1-Distill-Qwen 1.5B, and more
- All running via ONNX with Q4F32 quantization
- Includes low-memory mode for 4–6GB RAM devices
- **Best for:** Developers wanting a working Android baseline today

### 🟢 Google AI Edge Gallery
- **GitHub:** `github.com/google-ai-edge/mediapipe-samples` *(September 2025, now on Google Play)*
- Runs Gemma 3 1B and Gemma 3n with on-device function calling and RAG demos
- Audio Scribe: transcribes audio directly on the phone with no internet connection required
- AI Edge On-device Function Calling SDK enables models to call specific OS functions (alarms, reservations, search) — currently Android-only
- **Best for:** Prototyping function calling and RAG on Android

### 🟢 FunctionGemma
- **Blog:** `blog.google/technology/developers/functiongemma/` *(December 2025)*
- Gemma 3 270M fine-tuned specifically for function calling
- Mobile Actions benchmark: 58% baseline accuracy → 85% after fine-tuning
- Acts as a local routing agent; hands off complex tasks to Gemma 3 27B
- Supported by: LiteRT-LM, vLLM, MLX, llama.cpp, Ollama, Vertex AI, LM Studio
- **Best for:** OS-level automation (calendar, contacts, alarms) on-device

### 🟢 MiniCPM-V 4.0 iOS App
- **GitHub:** `github.com/OpenBMB/MiniCPM-o` *(iOS app open-sourced August 2025)*
- 4.1B total params, but runs: <2s TTFT, 17+ tok/s decode on iPhone 16 Pro Max
- No heating problems reported
- Outperforms GPT-4.1-mini on OpenCompass across 8 benchmarks
- **Best for:** Multimodal (vision + language) on high-end iPhones

### 🟡 Pocket RAG (Research)
- **arXiv:** arxiv.org/pdf/2602.13229 *(February 2026)*
- Fully offline Android RAG system within 2GB memory constraint
- Hybrid RAG + selective compression + batched prompt decoding + quantization caching
- TTFT: 3.7s (4× improvement over baseline)
- Accuracy: 94.5% (physical first aid), 97.0% (psychological first aid)
- **Best for:** Reference for building narrow-domain offline RAG on Android

### 🔴 Notable Failure Mode
ExecuTorch's vector database search is notably inferior to cloud/Python services — no hybrid search, no sparse search — and LLM support was still not production-ready as of late 2025. *(DeepSense.ai blog, October 2025)*

---

## 4. Specialization & Fine-Tuning at <2B Scale

### Core Insight: Prompting ≠ Reliability at This Scale

FunctionGemma's Mobile Actions evaluation makes this explicit: raw prompting achieves ~58% task completion; fine-tuning brings it to 85%. For production use, fine-tuning is not optional.

### What Works for Function Calling

**Qwen3's native tool use** (April 2025)
Qwen3-1.7B natively supports tool use and structured output in both thinking and non-thinking modes. It's the strongest out-of-the-box option at this size.

**FunctionGemma approach** (December 2025)
Uses Gemma's 256k vocabulary to efficiently tokenize JSON and multilingual inputs. Small vocabulary size means shorter sequences → lower latency on mobile.

### Fine-Tuning Stack That's Mobile-Viable

| Component | Recommended Tool | Notes |
|---|---|---|
| **SFT framework** | Unsloth + HuggingFace Transformers | Supports Gemma, Qwen3, MiniCPM4 |
| **PEFT method** | QLoRA (4-bit) | Reduces GPU memory 66%, trainable params 10,000× |
| **Hardware** | RTX 4090 (24GB) or A100 (40GB) | Sufficient for 0.5B–2B |
| **Constrained decoding** | llama.cpp grammar sampling / Outlines | Enforce JSON schema at inference time |
| **Structured output** | Native JSON mode in Qwen3/LFM2.5 | No extra tooling required |

LoRA reduces trainable parameters by 10,000× compared to full fine-tuning and reduces required GPU memory by 66%, while preserving the model's general knowledge. *(Telefónica/Google AI Edge analysis, January 2026)*

### Notable Fine-Tuned Variants
- **FunctionGemma** — Gemma 3 270M, function calling only (Google, December 2025)
- **Qwen3-ASR-0.6B** — ASR model, 52 languages, 2000× throughput at 128 concurrency (Qwen team, January 2026)
- **DeepSeek-R1-Distill-Qwen-1.5B** — reasoning distillation into 1.5B, runs on Android *(DakeQQ, February 2025)*
- **MiniCPM-S-1B** — 87.89% average FFN sparsity, 84% FLOPs reduction *(OpenBMB, July 2024)*

---

## 5. Ecosystem Scaffolding: The Force Multiplier

A well-scaffolded 1.7B model regularly outperforms a raw 7B model on narrow tasks. This is the most important section.

### On-Device RAG Stack Options

**RAGdb** *(arXiv December 2025)*
Consolidates automated multimodal ingestion, ONNX-based extraction, and hybrid vector retrieval into a **single portable SQLite container** — zero dependencies, embeddable, no cloud required. Best architecture found in research for mobile edge RAG.

**Google AI Edge RAG SDK** *(Android, announced May 2025)*
Full RAG pipeline: import → chunk → index → embed → retrieve → generate. Supports custom databases, chunking strategies, and retrieval functions. Android-only as of April 2026, iOS coming.

**MNN + sqlite-vec on Android** *(DEV.to, February 2026)*
Community-documented pattern: MNN for inference + local vector index for fast retrieval without heavy RAM usage. Fully offline, no API calls. Practical on 4–6GB devices.

**Key RAG constraint**
Vector search algorithms like IVF-HNSW typically require the entire index to reside in RAM. The Galaxy S24 leaves only 5–6 GB available after the OS. *(MobileRAG paper, 2025)*

**Mitigation:** chunk aggressively, use sqlite-vec or LanceDB with memory-mapped files, keep total vector index under 500MB.

### Recommended System Architecture

```
User input
    │
    ▼
[Intent Classifier]
FunctionGemma 270M or Qwen3-0.6B
    │
    ├──── "RAG task" ──────────────────────────────┐
    │                                              │
    │     [sqlite-vec retrieval]                   │
    │          │                                   │
    │     [1.7B model + retrieved context]         │
    │          │                                   │
    ├──── "Tool call" ──────────────────────────── │──┐
    │                                              │  │
    │     [Structured JSON out]                    │  │
    │          │                                   │  │
    │     [OS API: calendar / alarm / contacts]    │  │
    │                                              │  │
    └──── "Open-ended chat" ──────────────────┐   │  │
                                              │   │  │
               [1.7B model direct]            │   │  │
                                              │   │  │
               ◄────────────────────────────────────┘
                       Response to user
```

### Memory Pattern: Rolling Context Compression
- Keep 6–8 turns of raw conversation
- At turn 6, summarize older turns using the on-device model (cheap, fast)
- Store summary as a compact context prefix
- **Result:** Effectively unlimited conversation history in ~512 tokens of active context

---

## 6. On-Device Tool Access & MCP

### Current State of MCP on Mobile (April 2026)

MCP has moved well past its origins as a way to wire up local tools — it now runs in production at companies large and small — but the spec's current focus is on remote Streamable HTTP transport, not mobile STDIO. *(MCP 2026 Roadmap, March 2026)*

**Gap:** No standardized MCP mobile SDK for Android/iOS exists as of April 2026.

### What Exists Instead

| Tool | Platform | Offline? | Notes |
|---|---|---|---|
| **Google AI Edge FC SDK** | Android | ✅ | JSON schema tool calls, production-ready |
| **Liquid AI LEAP SDK** | iOS + Android | ✅ | Cross-platform, models 300MB+, proprietary |
| **MNN tool-use templates** | Android | ✅ | Community JSON schemas for OS APIs |
| **Custom STDIO MCP servers** | Android | ✅ (ADB) | Requires ADB/root; not user-facing |
| **Qwen3 native tool use** | Any (via llama.cpp) | ✅ | Model-level, no framework needed |

### Security Warning
In April 2025, security researchers found multiple outstanding MCP security issues: prompt injection, tool permissions that allow data exfiltration by combining tools, and lookalike tools that can silently replace trusted ones. On-device tool access needs careful permission scoping even in offline contexts. *(Wikipedia/MCP security analysis, 2025)*

### Practical On-Device Tool Schema Example (Calendar)
```json
{
  "name": "create_calendar_event",
  "description": "Creates an event in the user's calendar",
  "parameters": {
    "type": "object",
    "properties": {
      "title": {"type": "string"},
      "date": {"type": "string", "format": "date"},
      "time": {"type": "string", "format": "time"},
      "duration_minutes": {"type": "integer"}
    },
    "required": ["title", "date"]
  }
}
```

---

## 7. Mixture of Tiny Agents

### Architecture Pattern (Validated in Research)

The clearest real-world example is FunctionGemma as a router: a 270M model handles OS tool calls and routes complex tasks to a 27B cloud model. The same principle scales to fully on-device pipelines:

```
Input → 0.6B intent classifier → routes to one of:
  ├── 0.6B slot filler (structured data extraction)
  ├── 1.7B chat model (open-ended Q&A)
  ├── FunctionGemma 270M (OS tool calls)
  └── Cloud fallback (complex reasoning)
```

### Speculative Decoding as a "Tiny Ensemble"
Intel and Weizmann Institute (ICML 2025) demonstrated up to 2.8× faster inference using any small draft model to accelerate a larger target model. For on-device use, speculative decoding is particularly attractive because a smaller model is often available anyway — the draft model can be a quantized/pruned version of the target. *(State of on-device LLMs blog, January 2026)*

### Memory Overhead Warning
Loading 2–3 models simultaneously is **not feasible on 4–6GB devices**. Practical solution: **sequential unload/load** with model warm caching. Switching latency: ~200–400ms. Design your UX to tolerate this.

### Open-Source Implementations
As of April 2026: **none** fully productized for mobile. This is an active research area with no canonical framework yet. Community patterns exist in Discord servers (MLC LLM, ExecuTorch) but not packaged repos.

---

## 8. Hybrid Architectures (Local + Cloud)

### Recommended Scaling Pattern
Build systems that automatically scale model complexity based on available hardware — using a 2B model on older devices, a 7B model on current mid-range phones, and a 13B model on next year's flagships, all with the same codebase. *(Medium/Stepan Plotytsia, October 2025)*

### Escalation Trigger Patterns (Community Best Practices)

| Trigger | Implementation | Notes |
|---|---|---|
| Low confidence score | Calibrated logit sampling | Requires model calibration step |
| Output length budget exceeded | Simple token counter | Cheapest to implement |
| Task type classification | Intent router (on-device) | Route "complex reasoning" to cloud |
| User explicit request | UI control | Transparent to user |
| Latency exceeded threshold | Wall clock timer | Fallback after N seconds |

### Context Sync Privacy Rule
**Never raw-forward full context to cloud.** Always summarize locally first using the on-device model, then send the summary. This avoids leaking PII from earlier turns while preserving semantic continuity.

### Reference Implementations
No major open-source reference implementation for this hybrid handoff pattern exists as of April 2026. Most production apps use proprietary approaches.

---

## 9. Key Players & Resources to Track

### Labs & Teams

| Player | Focus Area | Key Resource | Date |
|---|---|---|---|
| **Alibaba / Qwen Team** | Qwen3 0.6B–1.7B + MNN runtime | `github.com/QwenLM/Qwen3` | Apr 2025 |
| **OpenBMB / Tsinghua** | MiniCPM4 0.5B on-device | `github.com/OpenBMB/MiniCPM` | Jun 2025 |
| **Google AI Edge** | Gemma 3/3n, LiteRT, RAG SDK, FunctionGemma | `developers.googleblog.com` | Dec 2025 |
| **Meta / FAIR** | ExecuTorch 1.0, MobileLLM-Flash | `arxiv.org/pdf/2603.15954` | Mar 2026 |
| **Liquid AI** | LFM2.5-1.2B, LFM2.5-VL-450M, LEAP SDK | `liquid.ai/blog` | Feb 2026 |
| **DakeQQ** | Native Android LLM demo repo | `github.com/DakeQQ/Native-LLM-for-Android` | Jan 2026 |
| **mllm project** | NPU-accelerated inference (Qualcomm) | `arxiv.org/abs/2407.05858` | Jul 2024 |

### Must-Read Papers (2025–2026)

| Paper | Key Contribution | Link | Date |
|---|---|---|---|
| MobileLLM-Flash (Meta) | Hardware-in-the-loop latency optimization, ExecuTorch-ready | arxiv.org/pdf/2603.15954 | Mar 2026 |
| Pocket RAG | Full offline Android RAG system, 2GB constraint | arxiv.org/pdf/2602.13229 | Feb 2026 |
| RAGdb | SQLite-native edge RAG, zero dependencies | arxiv.org/pdf/2602.22217 | Dec 2025 |
| llm.npu / mllm-NPU | 1,000+ tok/s prefill via NPU, 22× energy savings | arxiv.org/abs/2407.05858 | Jul 2024 |
| MobileAIBench | Comprehensive mobile LLM benchmark framework | OpenReview (ICLR 2025) | 2024 |
| MobileLLM (Meta) | Sub-billion parameter architecture design | arxiv.org/pdf/2402.14905 | Feb 2024 |

### Community Channels
- Discord: MLC LLM server, ExecuTorch server, Qwen community
- HuggingFace: LiteRT community space (`huggingface.co/litert-community`)
- Reddit: r/LocalLLaMA (mobile threads)

---

## 10. Gaps, Pain Points & Unsolved Problems

### What's Still Broken (April 2026)

**1. NPU Fragmentation**
Every vendor requires proprietary SDK work — Qualcomm Hexagon, Apple Neural Engine, MediaTek APU are all separately closed. Only mllm and PowerInfer-2 currently support Qualcomm NPUs. *(arXiv benchmarking paper, July 2025)*

**2. Function Calling Reliability at <1B**
Raw prompting fails at ~58% accuracy. Fine-tuning is required but adds development friction. No universal "mobile function calling" dataset or benchmark exists.

**3. On-Device Observability**
No standard logging or debugging stack for mobile inference. Profiling requires ADB, manual logcat parsing, or vendor-specific tools. You're flying blind when inference breaks.

**4. App Store Model Distribution**
300MB–1.5GB model files conflict with app store download size limits (Google Play: 150MB APK, iOS App Store: 4GB with on-demand resources). Most apps ship models as post-install OTA downloads with no standardized update mechanism.

**5. On-Device Fine-Tuning Data Pipeline**
Collecting personalization/fine-tuning data without privacy violations remains architecturally unsolved at the framework level. No production-ready on-device federated fine-tuning stack for mobile.

**6. MCP for Mobile**
No standardized offline-first local MCP implementation for Android/iOS as of April 2026. The 2026 MCP roadmap focuses on remote Streamable HTTP transport scalability, not mobile STDIO. *(MCP 2026 Roadmap, March 2026)*

**7. Hybrid Search in On-Device RAG**
ExecuTorch and most mobile runtimes lack sparse search support. Only dense vector retrieval is practical today. BM25 + dense hybrid is still cloud-only in production. *(DeepSense.ai blog, October 2025)*

### 6-Month Breakthroughs to Watch

- **LiteRT-LM going fully open-source** (Google, signaled September 2025)
- **Apple Neural Engine SDK** opening up beyond CoreML abstractions (long-standing community request)
- **MCP mobile transport spec** — STDIO-over-IPC for mobile processes — being discussed in SEP working groups
- **NPU abstraction layer** — Qualcomm, MediaTek, and Apple unified NPU SDK (no confirmed timeline)
- **Gemma 4 Edge models (E2B/E4B)** wider tooling ecosystem buildout (April 2026 release, ecosystem immature)

---

## ✅ Actionable Outputs

### Starter Stack: Mid-Tier Android (6GB RAM), Today

```
MODEL:    Qwen3-1.7B-Instruct Q4_K_M (GGUF ~1.1GB)
RUNTIME:  MNN or llama.cpp (Android NDK build)
ROUTER:   FunctionGemma 270M (LiteRT, <200MB) — intent classification
RAG:      sqlite-vec + nomic-embed-text-v1.5 (~75MB) — local vector store
MEMORY:   Rolling 8-turn window, compress at turn 6 with on-device summarizer
TOOLS:    3 JSON-schema tools: calendar read/write, alarm set, contacts lookup
```

**Total RAM budget:** ~1.4GB active. Fits comfortably on 6GB device.
**Approximate latency:** 1.5–3s first token on Snapdragon 8 Gen 2.

---

### Decision Tree: Architecture by Use Case

```
What is your primary use case?
│
├── "Structured data extraction / forms / slot filling"
│   → FunctionGemma 270M (fine-tuned) + Google AI Edge FC SDK
│   → Fine-tune with domain-specific JSON examples (100–1000 samples)
│
├── "Document Q&A / notes / meeting summaries"
│   → Qwen3-1.7B + sqlite-vec RAG + MNN runtime
│   → Chunk at 256 tokens, overlap 64 tokens, nomic embeddings
│
├── "General assistant / open-ended chat"
│   → Qwen3-1.7B Q4_K_M + llama.cpp mobile
│   → Enable thinking mode for complex questions, disable for speed
│
├── "Vision + text (receipt scanning, field inspection, OCR)"
│   → LFM2.5-VL-450M (ultra-low RAM) or Gemma 3n 2B (richer model)
│   → LiteRT for Android, ONNX+MNN for cross-platform
│
├── "Lowest possible RAM (<1GB total constraint)"
│   → LFM2.5-350M or Qwen3-0.6B Q4_K_M + llama.cpp
│
└── "Multi-turn personal assistant with memory"
    → Qwen3-1.7B + rolling context compression + sqlite-vec user memory
    → Store user preferences as embedding-indexed key-value pairs
```

---

### 5 Repos to Clone This Weekend

| Repo | What You Get | Last Active |
|---|---|---|
| `github.com/DakeQQ/Native-LLM-for-Android` | Working Android APK, Qwen3/MiniCPM/Gemma, ONNX/MNN | Jan 2026 |
| `github.com/google-ai-edge/mediapipe-samples` | FunctionGemma + Gemma 3n demo apps (Android) | Sep 2025 |
| `github.com/OpenBMB/MiniCPM` | MiniCPM4 + iOS app + llama.cpp guide | Jun 2025 |
| `github.com/QwenLM/Qwen3` | Qwen3 0.6B/1.7B with Ollama/llama.cpp/MNN guides | Apr 2025 |
| `github.com/mllm-team/mllm` | NPU-accelerated inference on Qualcomm Snapdragon | 2024 (active) |

---

### 🚩 Red Flags & Dead Ends to Avoid

1. **Don't use ExecuTorch for RAG** — vector database search support is broken/missing as of late 2025

2. **Don't raw-prompt a 270M model for function calling** — reliability is ~58% without fine-tuning. Either fine-tune or use Qwen3's built-in tool mode at 1.7B+

3. **Don't target Kirin SoCs (Huawei)** — a significant performance gap persists between Kirin and Snapdragon/MediaTek SoCs for LLM inference; community support is also minimal *(arXiv benchmarking paper, July 2025)*

4. **Don't test only on flagship devices** — your Pixel 8 Pro makes everything look fast; users' Galaxy A54 with 6GB RAM tells a different story *(Medium blog, October 2025)*

5. **Don't build on MLC LLM's NPU path** — GPU (OpenCL) is well-supported and production-ready; NPU support is not

6. **Don't assume MCP works offline on mobile** — the entire spec assumes a running server process with network access; mobile STDIO adaptation doesn't exist as a standard yet

7. **Don't raw-forward full conversation context to cloud** — always summarize on-device first to prevent PII leakage from earlier turns

8. **Don't ship without testing quantization quality** — Q2_K reduces model quality significantly at <2B scale; Q4_K_M is the practical minimum for coherent output

---

## Meta-Takeaway

The models themselves are no longer the bottleneck at the 1.7B scale. The bottleneck is the **scaffolding layer** — RAG quality, tool reliability, routing accuracy, and memory management.

A well-scaffolded Qwen3-1.7B or LFM2.5-1.2B today is genuinely useful for narrow personal assistant tasks on mid-tier Android hardware. A raw 7B model without scaffolding is often worse on those same tasks — and uses 4–5× more battery and RAM.

The next 6 months will be defined by: NPU ecosystem opening up, MCP mobile adaptation, and the first production-grade open-source hybrid routing framework for on-device + cloud handoff.

---

*Research compiled April 2026 | All sources cited with publication dates | Models and benchmarks subject to rapid change in this space*
