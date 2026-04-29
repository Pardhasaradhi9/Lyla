# Tech Stack Reference — Lyla

> Exact libraries, versions, and configurations for every component.
> This is the single source of truth for what we use and how.

---

## Runtime & Framework

| Component | Technology | Version | Install Command |
|:---|:---|:---|:---|
| **Language** | TypeScript | 5.x | Built into RN |
| **Framework** | React Native | 0.76+ (New Architecture) | `npx @react-native-community/cli init` |
| **Build System** | Expo (prebuild mode) | SDK 52+ | `npx create-expo-app` |
| **State Management** | Zustand | 5.x | `npm install zustand` |
| **Navigation** | Expo Router | 4.x | `npm install expo-router` |

## AI / ML Libraries

| Component | Library | Version | Purpose | Install |
|:---|:---|:---|:---|:---|
| **LLM Inference** | `llama.rn` | latest | Run GGUF models locally | `npm install llama.rn` |
| **Speech-to-Text** | `whisper.rn` | latest | Local Whisper inference | `npm install whisper.rn` |
| **Text-to-Speech** | `expo-speech` | latest | OS native TTS (V1) | `npx expo install expo-speech` |
| **Embeddings** | `llama.rn` | (same) | Load embedding GGUF model | (uses same library) |

## Database & Storage

| Component | Library | Purpose | Install |
|:---|:---|:---|:---|
| **SQLite** | `op-sqlite` | Chat history, memories, preferences | `npm install @op-engineering/op-sqlite` |
| **Vector Search** | `sqlite-vec` | Semantic similarity on memory vectors | Loaded as extension via op-sqlite |
| **File System** | `expo-file-system` | Model file management | `npx expo install expo-file-system` |

## Models (Downloaded on First Launch)

| Model | Purpose | Format | Size (Q4_K_M) | Source |
|:---|:---|:---|:---|:---|
| `Qwen3-1.7B-Abliterated` | Primary LLM (uncensored) | GGUF | ~1.0 GB | HuggingFace (mlabonne) |
| `LFM2.5-1.2B-Thinking` | Speed LLM (censored) | GGUF | ~700 MB | HuggingFace (LiquidAI) |
| `snowflake-arctic-embed:33m` | Memory embeddings | GGUF | ~65 MB | HuggingFace |
| `ggml-tiny.en.bin` | Whisper STT (English) | GGML | ~75 MB | HuggingFace (ggerganov) |

## UI Libraries

| Component | Library | Purpose |
|:---|:---|:---|
| **Icons** | `@expo/vector-icons` | UI icons |
| **Animations** | `react-native-reanimated` | Smooth micro-animations |
| **Gestures** | `react-native-gesture-handler` | Swipe, long-press interactions |
| **Haptics** | `expo-haptics` | Tactile feedback |
| **Status Bar** | `expo-status-bar` | Status bar styling |
| **Blur** | `expo-blur` | Glassmorphism effects |

## Networking

| Component | Library | Purpose |
|:---|:---|:---|
| **HTTP** | `fetch` (built-in) | DuckDuckGo search requests |
| **Network Detection** | `@react-native-community/netinfo` | Online/offline detection |
| **HTML Parsing** | `cheerio` (lightweight) | Parse DuckDuckGo HTML results |

## Development Tools

| Tool | Purpose |
|:---|:---|
| **TypeScript** | Type safety across the codebase |
| **ESLint + Prettier** | Code quality and formatting |
| **Jest** | Unit testing |
| **Detox** (optional) | E2E testing on real devices |

## Key Configuration Notes

### llama.rn Context Parameters (Mobile-Optimized)
```javascript
{
  model: 'file:///path/to/qwen3-1.7b-abliterated-q4_k_m.gguf',
  n_ctx: 4096,          // Context window (max tokens in conversation)
  n_gpu_layers: 99,     // Offload all layers to GPU (Metal on iOS)
  n_batch: 512,         // Batch size for prompt processing
  n_threads: 4,         // CPU threads (adjust per device)
  use_mlock: true,      // Lock memory to prevent swapping
  use_mmap: true,       // Memory-map the model file
  flash_attn_type: 'auto',
  cache_type_k: 'q8_0', // KV cache quantization (saves memory)
  cache_type_v: 'q8_0',
}
```

### Embedding Context Parameters
```javascript
{
  model: 'file:///path/to/snowflake-arctic-embed-33m.gguf',
  n_ctx: 512,           // Embedding context (shorter is fine)
  n_gpu_layers: 99,
  n_batch: 512,
  embedding: true,      // Enable embedding mode
}
```

### Whisper Configuration
```javascript
{
  filePath: 'ggml-tiny.en.bin',
  language: 'en',
  maxLen: 0,            // No max length
  translate: false,
  noTimestamps: true,
}
```

### expo-speech Configuration
```javascript
{
  language: 'en-US',    // Or 'en-IN' for Indian English
  pitch: 1.0,           // Normal pitch
  rate: 0.9,            // Slightly slower for clarity
  voice: undefined,     // Use system default (user can change)
}
```

## Minimum Device Requirements

| Platform | Minimum | Recommended |
|:---|:---|:---|
| **iOS** | iPhone 12, iOS 16, 4 GB RAM | iPhone 13+, iOS 17+ |
| **Android** | Snapdragon 695+, 4 GB RAM, Android 10 | Snapdragon 7-series+, 6 GB RAM |
| **Storage** | ~1.5 GB free (models + app) | ~3 GB free |
