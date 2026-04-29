/**
 * App-wide constants for Lyla.
 */

/** Model file names and download URLs */
export const MODELS = {
  PRIMARY_LLM: {
    name: 'Qwen3-1.7B-Abliterated',
    fileName: 'qwen3-1.7b-abliterated-q4_k_m.gguf',
    sizeBytes: 1_073_741_824, // ~1 GB
    url: 'https://huggingface.co/mlabonne/Qwen3-1.7B-Abliterated-GGUF/resolve/main/Qwen3-1.7B-Abliterated-Q4_K_M.gguf',
  },
  SPEED_LLM: {
    name: 'LFM2.5-1.2B-Thinking',
    fileName: 'lfm2.5-1.2b-thinking-q4_k_m.gguf',
    sizeBytes: 734_003_200, // ~700 MB
    url: '', // TBD — exact HF URL
  },
  EMBEDDING: {
    name: 'Snowflake Arctic Embed 33M',
    fileName: 'snowflake-arctic-embed-33m-q8_0.gguf',
    sizeBytes: 68_157_440, // ~65 MB
    url: '', // TBD — exact HF URL
  },
  WHISPER: {
    name: 'Whisper Tiny EN',
    fileName: 'ggml-tiny.en.bin',
    sizeBytes: 78_643_200, // ~75 MB
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin',
  },
} as const;

/** LLM inference parameters (from TECH_STACK.md) */
export const LLM_CONFIG = {
  n_ctx: 4096,
  n_gpu_layers: 99,
  n_batch: 512,
  n_threads: 4,
  use_mlock: true,
  use_mmap: true,
  cache_type_k: 'q8_0',
  cache_type_v: 'q8_0',
} as const;

/** Embedding model parameters */
export const EMBEDDING_CONFIG = {
  n_ctx: 512,
  n_gpu_layers: 99,
  n_batch: 512,
  embedding: true,
} as const;

/** Memory engine thresholds */
export const MEMORY = {
  /** Cosine similarity threshold for duplicate detection */
  SIMILARITY_THRESHOLD: 0.85,
  /** Max memories to inject into system prompt */
  MAX_CONTEXT_MEMORIES: 10,
  /** Embedding dimension for snowflake-arctic-embed:33m */
  EMBEDDING_DIM: 384,
} as const;

/** App metadata */
export const APP = {
  NAME: 'Lyla',
  TAGLINE: 'Your Life, Your Language, Your AI.',
  VERSION: '0.1.0',
  MODELS_DIR: 'models/',
  DB_NAME: 'lyla.db',
} as const;
