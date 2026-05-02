# Tech Stack Reference — Lyla

> Exact libraries, versions, and configurations. Single source of truth.
> Last Updated: 2026-05-02

---

## Runtime & Framework

| Component | Technology | Version | Notes |
|:---|:---|:---|:---|
| Language | TypeScript | 5.9.x | Strict mode |
| Framework | React Native | 0.81.5 | New Architecture (Fabric + TurboModules) |
| Build System | Expo SDK 54 (prebuild mode) | ~54.0.33 | `newArchEnabled: true` |
| JS Engine | Hermes | built-in | Fast cold start, low RAM |
| State Management | Zustand | 5.x | Lightweight, no boilerplate |
| Navigation | Expo Router | 6.x | File-based routing |
| React | React 19.1 | 19.1.0 | Concurrent features, useOptimistic |

## AI Models (Downloaded On First Launch)

### Active Models

| Model | Role | Format | Size | Source |
|:---|:---|:---|:---|:---|
| **LFM2.5-1.2B-Instruct** (Huihui Abliterated, Q6_K) | Primary Brain | GGUF | 918 MB | [HuggingFace](https://huggingface.co/mradermacher/Huihui-LFM2.5-1.2B-Instruct-abliterated-GGUF) |
| **Snowflake Arctic Embed S** (Q8_0) | Embedding / vector search | GGUF | 35 MB | [HuggingFace](https://huggingface.co/mradermacher/snowflake-arctic-embed-s-GGUF) |

### Planned Models

| Model | Role | Format | Size | Source |
|:---|:---|:---|:---|:---|
| **LFM2.5-350M** (Q4_K_M) | Router — intent classification, tool selection | GGUF | 229 MB | [HuggingFace](https://huggingface.co/LiquidAI/LFM2.5-350M-GGUF) |
| **LFM2-350M-Extract** (Q4_K_M) | Fact extraction — structured JSON from conversations | GGUF | 229 MB | [HuggingFace](https://huggingface.co/LiquidAI/LFM2-350M-Extract-GGUF) |
| **Whisper Tiny EN** | Speech-to-Text | GGML | 75 MB | [HuggingFace](https://huggingface.co/ggerganov/whisper.cpp) |
| **LFM2.5-1.2B-Instruct** (Q4_K_M) | Brain for 4GB devices | GGUF | ~600 MB | Same source, different quant |

## AI / ML Libraries

| Component | Library | Version | Purpose |
|:---|:---|:---|:---|
| LLM Inference | `llama.rn` | 0.12.0-rc.9 | Run GGUF models locally, streaming tokens |
| Embeddings | `llama.rn` (same) | same | Load embedding GGUF model |
| Speech-to-Text | `whisper.rn` | TBD (not installed) | Local Whisper inference |
| Text-to-Speech | `expo-speech` | ~14.0.8 | OS native TTS (iOS: AVSpeechSynthesizer, Android: TextToSpeech) |

## Database & Storage

| Component | Library | Purpose |
|:---|:---|:---|
| SQLite | `expo-sqlite` (~16.0.10) | Chat history, memories, conversations |
| Vector Search | `sqlite-vec` (bundled extension) | Semantic similarity on memory embeddings |
| File System | `expo-file-system` (~19.0.22) | Model download, cache, file management |
| Secure Storage | `expo-secure-store` (TBD) | API keys, auth tokens, encryption keys |
| Key-Value | `@react-native-async-storage/async-storage` (TBD) | UI settings, onboarding state, tool permissions |

## Currently Installed Packages

### Dependencies

```
@expo/vector-icons         ^15.0.3     Icons
@react-native-community/netinfo  11.4.1  Online/offline detection
cheerio                    ^1.2.0      HTML parsing (for web search)
expo                       ~54.0.33    Framework
expo-battery               ~10.0.8     Battery level + state
expo-blur                  ~15.0.8     Glassmorphism effects
expo-clipboard             ~8.0.8      Read/write clipboard
expo-constants             ~18.0.13    App constants
expo-device                ~8.0.10     Device info + RAM detection
expo-file-system           ~19.0.22    File management
expo-haptics               ~15.0.8     Taptic feedback
expo-linking               ~8.0.12     Deep linking
expo-localization          ~17.0.8     Timezone + locale
expo-router                ~6.0.23     Navigation
expo-speech                ~14.0.8     Text-to-speech
expo-sqlite                ~16.0.10    SQLite + sqlite-vec
expo-status-bar            ~3.0.9      Status bar styling
expo-system-ui             ~6.0.9      System UI
expo-web-browser           ~15.0.11    In-app browser
llama.rn                   ^0.12.0-rc.9  LLM inference
react                      19.1.0      UI framework
react-native               0.81.5      Platform
react-native-gesture-handler ~2.28.0   Gestures
react-native-markdown-display ^7.0.2   Markdown rendering
react-native-reanimated    ~4.1.1      Animations
react-native-safe-area-context ~5.6.0  Safe area
react-native-screens       ~4.16.0     Native screens
react-native-worklets      ^0.8.1      Background threads
react-native-worklets-core ^1.6.3      Worklet runtime
zustand                    ^5.0.12     State management
```

### Packages To Install (Phase 2b — Batch Native Rebuild)

```
expo-local-authentication  ~16.0.0     FaceID / TouchID / Biometrics
expo-calendar              ~15.0.0     Read/write calendar events
expo-contacts              ~15.0.0     Read contacts
expo-secure-store          ~15.0.0     iOS Keychain / Android Keystore
expo-notifications         ~0.30.0     Local push notifications
expo-task-manager          ~13.0.0     Background tasks
expo-background-fetch      ~13.0.0     Periodic background execution
expo-crypto                ~14.0.0     SHA-256, UUID, random bytes
whisper.rn                 latest      Speech-to-text
```

## LLM Configuration

### Primary Brain (1.2B)

```javascript
{
  model: 'path/to/Huihui-LFM2.5-1.2B-Instruct-abliterated.Q6_K.gguf',
  n_ctx: 8192,          // Full context on 6GB+ devices
  n_gpu_layers: 99,     // Offload all to Metal GPU
  n_batch: 512,
  n_threads: 4,
  use_mlock: true,
  use_mmap: true,
  cache_type_k: 'q8_0', // Quantized KV cache
  cache_type_v: 'q8_0',
  // Inference params:
  max_tokens: 2048,
  temperature: 0.3,
  top_k: 50,
  repeat_penalty: 1.05,
}
```

### Router (350M) — Planned

```javascript
{
  model: 'path/to/LFM2.5-350M-Q4_K_M.gguf',
  n_ctx: 1024,          // Short context — only routing/extraction
  n_gpu_layers: 99,
  n_batch: 512,
  temperature: 0.1,     // Low temperature for deterministic routing
  top_k: 10,
}
```

### Embedding Model

```javascript
{
  model: 'path/to/snowflake-arctic-embed-s.Q8_0.gguf',
  n_ctx: 512,
  n_gpu_layers: 99,
  n_batch: 512,
  embedding: true,
}
```

## Minimum Device Requirements

| Platform | Minimum | Recommended |
|:---|:---|:---|
| iOS | iPhone 12, iOS 16, 4 GB RAM | iPhone 13+, iOS 17+, 6 GB RAM |
| Android | Snapdragon 695+, 4 GB RAM, Android 10 | Snapdragon 7-series+, 6 GB RAM |
| Storage | ~1.2 GB free (models + app) | ~2.5 GB free (all models + STT) |
