# Tech Stack Reference — Lyla

> Exact libraries, versions, and configurations. Single source of truth.
> Last Updated: 2026-05-03

---

## Runtime & Framework

| Component | Technology | Version | Notes |
|:---|:---|:---|:---|
| Language | TypeScript | 5.9.x | Strict mode enabled |
| Framework | React Native | 0.81.5 | New Architecture (Fabric + TurboModules) |
| Build System | Expo SDK 54 (prebuild mode) | ~54.0.33 | `newArchEnabled: true` |
| JS Engine | Hermes | built-in | Fast cold start, low RAM |
| State Management | Zustand | 5.x | Lightweight, no boilerplate |
| Navigation | Expo Router | 6.x | File-based routing |
| React | React 19.1 | 19.1.0 | Concurrent features, useOptimistic |

## AI Models (Downloaded On First Launch)

### Active Models (Currently In Use)

| Model | Role | Format | Size | Context | Source |
|:---|:---|:---|:---|:---|:---|
| **LFM2.5-1.2B-Instruct** (Huihui Abliterated, Q6_K) | Primary Brain | GGUF | 918 MB | 8192 | [HuggingFace](https://huggingface.co/mradermacher/Huihui-LFM2.5-1.2B-Instruct-abliterated-GGUF) |
| **LFM2-350M-Extract** (Q4_K_M) | Memory Extractor — structured JSON facts | GGUF | 229 MB | 2048 | [HuggingFace](https://huggingface.co/LiquidAI/LFM2-350M-Extract-GGUF) |
| **FastText Lite** (Native JS) | Router — intent classification (<1ms) | JSON | 12 KB | - | Custom trained Naive Bayes weights |
| **Snowflake Arctic Embed S** (Q8_0) | Embedding / vector search | GGUF | 35 MB | 512 | [HuggingFace](https://huggingface.co/mradermacher/snowflake-arctic-embed-s-GGUF) |
| **Whisper Tiny EN** | Speech-to-Text | GGML | 75 MB | - | [HuggingFace](https://huggingface.co/ggerganov/whisper.cpp) |

### Planned Models (Not Yet Active)

| Model | Role | Format | Size | Source |
|:---|:---|:---|:---|:---|
| **LFM2.5-1.2B-Instruct** (Q4_K_M) | Brain for 4GB devices | GGUF | ~600 MB | Same source, different quant |

## AI / ML Libraries

| Component | Library | Version | Purpose |
|:---|:---|:---|:---|
| LLM Inference | `llama.rn` | 0.12.0-rc.9 | Run GGUF models locally, streaming tokens |
| Router / Classifier | Custom JS | — | Pure JS Naive Bayes classifier |
| Embeddings | `llama.rn` (same) | same | Arctic Embed GGUF model |
| Math Engine | `mathjs` | 15.2.0 | Arithmetic, trig, unit conversions, percentages |
| Speech-to-Text | `whisper.rn` | 0.5.5 | Local Whisper inference |
| Audio Recording | `expo-av` | 15.0.2 | Native microphone access + ducking |
| Text-to-Speech | `expo-speech` | ~14.0.8 | OS native TTS (AVSpeechSynthesizer / TextToSpeech) |

## Database & Storage

| Component | Library | Version | Purpose |
|:---|:---|:---|:---|
| SQLite | `expo-sqlite` | ~16.0.10 | Chat history, memories, knowledge cache |
| Vector Search | `sqlite-vec` | bundled extension | Semantic similarity on memory embeddings |
| File System | `expo-file-system` | ~19.0.22 | Model download, cache, file management |
| Secure Storage | `expo-secure-store` | ~15.0.8 | iOS Keychain / Android Keystore |
| Key-Value | (via Zustand persist) | — | UI settings, onboarding state |

## Currently Installed Packages (All 35 Dependencies)

```
@expo/vector-icons              ^15.0.3     Ionicons, FontAwesome, etc.
@react-native-community/netinfo 11.4.1      Online/offline detection
cheerio                         ^1.2.0      HTML parsing (for future web search)
expo                            ~54.0.33    Framework
expo-background-fetch           ~14.0.9     Periodic background execution
expo-battery                    ~10.0.8     Battery level + state
expo-blur                       ~15.0.8     Glassmorphism effects
expo-calendar                   ~15.0.8     Read/write calendar events
expo-clipboard                  ~8.0.8      Read/write clipboard
expo-constants                  ~18.0.13    App constants
expo-contacts                   ~15.0.11    Contact lookup
expo-crypto                     ~15.0.9     SHA-256, UUID, random bytes
expo-device                     ~8.0.10     Device info + RAM detection
expo-file-system                ~19.0.22    File management + model downloads
expo-haptics                    ~15.0.8     Taptic feedback
expo-linking                    ~8.0.12     Deep linking
expo-local-authentication       ~17.0.8     FaceID / TouchID / Biometrics
expo-localization               ~17.0.8     Timezone + locale
expo-notifications              ~0.32.17    Local push notifications + reminders
expo-router                     ~6.0.23     File-based navigation
expo-secure-store               ~15.0.8     iOS Keychain / Android Keystore
expo-speech                     ~14.0.8     Text-to-speech
expo-sqlite                     ~16.0.10    SQLite + sqlite-vec extension
expo-status-bar                 ~3.0.9      Status bar styling
expo-system-ui                  ~6.0.9      System UI colors
expo-task-manager               ~14.0.9     Background tasks
expo-web-browser                ~15.0.11    In-app browser
llama.rn                        ^0.12.0-rc.9  LLM + embedding inference
mathjs                          ^15.2.0     Math evaluation engine
react                           19.1.0      UI framework
react-native                    0.81.5      Platform
react-native-gesture-handler    ~2.28.0     Gestures
react-native-markdown-display   ^7.0.2      Markdown rendering in chat
react-native-reanimated         ~4.1.1      Animations
react-native-safe-area-context  ~5.6.0      Safe area insets
react-native-screens            ~4.16.0     Native screen optimization
react-native-worklets           ^0.8.1      Background threads
react-native-worklets-core      ^1.6.3      Worklet runtime
zustand                         ^5.0.12     State management
```

### Dev Dependencies

```
@types/react                    ~19.1.0     TypeScript type definitions
typescript                      ~5.9.2      Compiler
```

## LLM Configuration

### Router (350M) — `ROUTER_CONFIG`

```typescript
{
  model: 'LFM2.5-350M-Q4_K_M.gguf',
  n_ctx: 2048,          // Increased from 1024 (was overflowing)
  n_gpu_layers: 99,     // Offload all to Metal GPU
  n_batch: 256,
  use_mlock: true,
  use_mmap: true,
  cache_type_k: 'q8_0',
  cache_type_v: 'q8_0',
  max_tokens: 256,
  temperature: 0.1,     // Low temperature for deterministic classification
  top_k: 10,
  penalty_repeat: 1.05, // NOT repeat_penalty — llama.rn uses penalty_repeat
}
```

### Primary Brain (1.2B) — `LLM_CONFIG`

```typescript
{
  model: 'Huihui-LFM2.5-1.2B-Instruct-abliterated.Q6_K.gguf',
  n_ctx: 8192,          // Full context on 6GB+ devices
  n_gpu_layers: 99,     // Offload all to Metal GPU
  n_batch: 512,
  n_threads: 4,
  use_mlock: true,
  use_mmap: true,
  cache_type_k: 'q8_0', // Quantized KV cache
  cache_type_v: 'q8_0',
  max_tokens: 2048,
  temperature: 0.3,
  top_k: 50,
  repeat_penalty: 1.05,
}
```

### Embedding Model — `EMBEDDING_CONFIG`

```typescript
{
  model: 'snowflake-arctic-embed-s.Q8_0.gguf',
  n_ctx: 512,
  n_gpu_layers: 99,
  n_batch: 512,
  embedding: true,      // Enable embedding mode
}
```

### Memory Config — `MEMORY`

```typescript
{
  SIMILARITY_THRESHOLD: 0.85,  // Cosine similarity for dedup/retrieval
  MAX_CONTEXT_MEMORIES: 10,    // Max memories injected into Brain context
  EMBEDDING_DIM: 384,          // Arctic Embed S output dimensions
}
```

## Expo Plugins (app.json)

```json
{
  "plugins": [
    "expo-router",
    "expo-web-browser",
    ["expo-sqlite", { "withSQLiteVecExtension": true }],
    ["expo-local-authentication", {
      "faceIDPermission": "Lyla uses Face ID to keep your conversations private."
    }],
    ["expo-calendar", {
      "calendarPermission": "Lyla needs calendar access to check your schedule and create events."
    }],
    ["expo-contacts", {
      "contactsPermission": "Lyla needs contacts access to look up phone numbers and emails for you."
    }],
    ["expo-notifications", {
      "icon": "./assets/icon.png",
      "color": "#7C3AED"
    }]
  ]
}
```

## TypeScript Configuration

```json
{
  "strict": true,
  "baseUrl": ".",
  "paths": {
    "@/*":             ["src/*"],
    "@/engines/*":     ["src/engines/*"],
    "@/db/*":          ["src/db/*"],
    "@/stores/*":      ["src/stores/*"],
    "@/components/*":  ["src/components/*"],
    "@/prompts/*":     ["src/prompts/*"],
    "@/utils/*":       ["src/utils/*"],
    "@/theme/*":       ["src/theme/*"]
  }
}
```

## Minimum Device Requirements

| Platform | Minimum | Recommended |
|:---|:---|:---|
| iOS | iPhone 12, iOS 16, 4 GB RAM | iPhone 13+, iOS 17+, 6 GB RAM |
| Android | Snapdragon 695+, 4 GB RAM, Android 10 | Snapdragon 7-series+, 6 GB RAM |
| Storage | ~1.2 GB free (models + app) | ~2.5 GB free (all models + STT) |

## Knowledge Hub APIs (All Free, No API Keys)

| API | Purpose | Base URL |
|:---|:---|:---|
| Wikipedia | General knowledge | `https://en.wikipedia.org/api/rest_v1/` |
| Wikidata | Structured entity data | `https://www.wikidata.org/w/api.php` |
| Open-Meteo | Weather + geocoding | `https://api.open-meteo.com/v1/` |
| REST Countries | Country facts | `https://restcountries.com/v3.1/` |
| Open Library | Book search | `https://openlibrary.org/` |
| OpenAlex | Research papers | `https://api.openalex.org/` |
| Free Dictionary | Word definitions | `https://api.dictionaryapi.dev/api/v2/` |
| ExchangeRate | Currency conversion | `https://open.er-api.com/v6/` |
| Nager.Date | Public holidays | `https://date.nager.at/api/v3/` |
