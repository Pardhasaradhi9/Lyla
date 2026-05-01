/**
 * Embedding Engine — llama.rn Wrapper for Vector Generation
 *
 * Uses llama.rn with snowflake-arctic-embed to generate
 * 384-dimensional embeddings for memory search.
 */

import { initLlama, LlamaContext } from 'llama.rn';
import { EMBEDDING_CONFIG } from '@/utils/constants';

export interface EmbeddingEngine {
  isLoaded: boolean;
  context: LlamaContext | null;
  init(modelPath: string): Promise<void>;
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  release(): Promise<void>;
}

/**
 * llama.rn Embedding engine implementation.
 */
export const embeddingEngine: EmbeddingEngine = {
  isLoaded: false,
  context: null,

  async init(modelPath: string): Promise<void> {
    if (this.context) {
      await this.release();
    }

    try {
      this.context = await initLlama({
        model: modelPath,
        use_mlock: true, // pin memory
        n_ctx: EMBEDDING_CONFIG.n_ctx,
        n_gpu_layers: EMBEDDING_CONFIG.n_gpu_layers,
        n_batch: EMBEDDING_CONFIG.n_batch,
        embedding: true, // Critical for embedding models
      });
      this.isLoaded = true;
      console.log('[EmbeddingEngine] Initialized successfully');
    } catch (error) {
      console.error('[EmbeddingEngine] Failed to load model:', error);
      throw error;
    }
  },

  async embed(text: string): Promise<number[]> {
    if (!this.context) {
      throw new Error('Embedding Context is not initialized');
    }

    try {
      // Pass the text to get its embedding vector
      const result = await this.context.embedding(text);
      return result.embedding;
    } catch (error) {
      console.error('[EmbeddingEngine] Failed to embed text:', error);
      throw error;
    }
  },

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.context) {
      throw new Error('Embedding Context is not initialized');
    }

    const embeddings: number[][] = [];
    // Currently executing sequentially, could parallelize if llama.rn queue supports it
    for (const text of texts) {
      const result = await this.context.embedding(text);
      embeddings.push(result.embedding);
    }
    return embeddings;
  },

  async release(): Promise<void> {
    if (this.context) {
      await this.context.release();
      this.context = null;
      this.isLoaded = false;
      console.log('[EmbeddingEngine] Released');
    }
  },
};
