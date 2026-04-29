/**
 * Memory Engine — Fact Extraction, Storage, Retrieval
 *
 * Handles automatic memory extraction from conversations,
 * deduplication via embeddings, and recall for context injection.
 *
 * Phase 3 implementation.
 */

export interface Memory {
  id: string;
  fact: string;
  entity?: string;
  category?: string;
  sourceMessageId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface MemoryEngine {
  extractFacts(userMessage: string, assistantResponse: string): Promise<Memory[]>;
  findSimilar(query: string, limit?: number): Promise<Memory[]>;
  addMemory(memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Memory>;
  deleteMemory(id: string): Promise<void>;
  getAllMemories(): Promise<Memory[]>;
}

/**
 * Placeholder memory engine.
 * Will be replaced with actual implementation in Phase 3.
 */
export const memoryEngine: MemoryEngine = {
  async extractFacts(): Promise<Memory[]> {
    return [];
  },
  async findSimilar(): Promise<Memory[]> {
    return [];
  },
  async addMemory(partial): Promise<Memory> {
    return {
      ...partial,
      id: Date.now().toString(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  },
  async deleteMemory(): Promise<void> {},
  async getAllMemories(): Promise<Memory[]> {
    return [];
  },
};
