/**
 * Memory Engine — Fact Storage and Retrieval
 *
 * Coordinates the Embedding Engine and Memory Repository.
 * Takes string queries, embeds them, and searches the vector database.
 */

import { embeddingEngine } from './embeddings';
import { memoryRepository, type MemoryRow, type SearchResult } from '../db/memory-repository';
import { MEMORY } from '@/utils/constants';

export interface Memory extends MemoryRow {}

export interface MemoryEngine {
  /** Find similar memories for a given query string */
  findSimilar(query: string, limit?: number): Promise<SearchResult[]>;
  
  /** Embed a fact and save it to the database */
  addMemory(fact: string, entity?: string, category?: string, sourceMessageId?: string): Promise<Memory>;
  
  deleteMemory(id: string): Promise<void>;
  getAllMemories(): Promise<Memory[]>;
  getMemoryCount(): Promise<number>;
}

export const memoryEngine: MemoryEngine = {
  async findSimilar(query: string, limit = MEMORY.MAX_CONTEXT_MEMORIES): Promise<SearchResult[]> {
    if (!embeddingEngine.isLoaded) {
      console.warn('[MemoryEngine] Cannot search: embedding engine not loaded');
      return [];
    }

    try {
      const queryVector = await embeddingEngine.embed(query);
      const results = await memoryRepository.searchMemories(
        queryVector, 
        limit, 
        MEMORY.DISTANCE_THRESHOLD
      );
      
      console.log(`[MemoryEngine] Found ${results.length} memories for query: "${query}"`);
      return results;
    } catch (e) {
      console.error('[MemoryEngine] Search failed:', e);
      return [];
    }
  },

  async addMemory(fact: string, entity?: string, category?: string, sourceMessageId?: string): Promise<Memory> {
    if (!embeddingEngine.isLoaded) {
      throw new Error('Embedding engine not loaded');
    }

    const vector = await embeddingEngine.embed(fact);
    const id = await memoryRepository.saveMemory(fact, vector, entity, category, sourceMessageId);
    
    return {
      id,
      fact,
      entity: entity || null,
      category: category || null,
      source_message_id: sourceMessageId || null,
      created_at: Date.now(),
      updated_at: Date.now(),
    };
  },

  async deleteMemory(id: string): Promise<void> {
    await memoryRepository.deleteMemory(id);
  },

  async getAllMemories(): Promise<Memory[]> {
    return memoryRepository.getAllMemories();
  },

  async getMemoryCount(): Promise<number> {
    return memoryRepository.getMemoryCount();
  },
};
