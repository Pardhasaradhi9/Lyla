/**
 * Embedding Engine — Vector Embedding Generation
 *
 * Uses llama.rn with snowflake-arctic-embed:33m to generate
 * 384-dimensional embeddings for memory search.
 *
 * Phase 3 implementation.
 */

export interface EmbeddingEngine {
  isLoaded: boolean;
  init(modelPath: string): Promise<void>;
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  release(): Promise<void>;
}

/**
 * Placeholder embedding engine.
 * Will be replaced with actual llama.rn embedding in Phase 3.
 */
export const embeddingEngine: EmbeddingEngine = {
  isLoaded: false,

  async init(): Promise<void> {
    this.isLoaded = true;
  },

  async embed(): Promise<number[]> {
    // Return a zero vector of 384 dimensions
    return new Array(384).fill(0);
  },

  async embedBatch(texts: string[]): Promise<number[][]> {
    return texts.map(() => new Array(384).fill(0));
  },

  async release(): Promise<void> {
    this.isLoaded = false;
  },
};
