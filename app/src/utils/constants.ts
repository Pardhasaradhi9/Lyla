/**
 * App-wide constants for Lyla.
 */

/** Model file names and download URLs */
export const MODELS = {
  PRIMARY_LLM: {
    name: 'LFM2.5-1.2B-Instruct',
    fileName: 'Huihui-LFM2.5-1.2B-Instruct-abliterated.Q6_K.gguf',
    sizeBytes: 963_000_000,
    url: 'https://huggingface.co/mradermacher/Huihui-LFM2.5-1.2B-Instruct-abliterated-GGUF/resolve/main/Huihui-LFM2.5-1.2B-Instruct-abliterated.Q6_K.gguf',
  },
  SPEED_LLM: {
    name: 'LFM2.5-350M',
    fileName: 'LFM2.5-350M-Q4_K_M.gguf',
    sizeBytes: 229_000_000,
    url: 'https://huggingface.co/LiquidAI/LFM2.5-350M-GGUF/resolve/main/LFM2.5-350M-Q4_K_M.gguf',
  },
  EXTRACT_LLM: {
    name: 'LFM2-350M-Extract',
    fileName: 'LFM2-350M-Extract-Q4_K_M.gguf',
    sizeBytes: 229_000_000,
    url: 'https://huggingface.co/LiquidAI/LFM2-350M-Extract-GGUF/resolve/main/LFM2-350M-Extract-Q4_K_M.gguf',
  },
  EMBEDDING: {
    name: 'Snowflake Arctic Embed (Small)',
    fileName: 'snowflake-arctic-embed-s.Q8_0.gguf',
    sizeBytes: 35_000_000, // ~35 MB
    url: 'https://huggingface.co/mradermacher/snowflake-arctic-embed-s-GGUF/resolve/main/snowflake-arctic-embed-s.Q8_0.gguf',
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
  n_ctx: 8192,
  n_gpu_layers: 99,
  n_batch: 512,
  n_threads: 4,
  use_mlock: true,
  use_mmap: true,
  cache_type_k: 'q8_0',
  cache_type_v: 'q8_0',
  max_tokens: 2048,
  temperature: 0.3,
  top_k: 50,
  repeat_penalty: 1.05,
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
