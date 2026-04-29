/**
 * Memory Repository — CRUD + Vector Search for Memories
 *
 * Phase 3 implementation — will use op-sqlite + sqlite-vec.
 */

export interface MemoryRow {
  id: string;
  fact: string;
  entity: string | null;
  category: string | null;
  source_message_id: string | null;
  created_at: number;
  updated_at: number;
}

/**
 * Placeholder memory repository.
 * Will be implemented with actual SQLite + sqlite-vec queries in Phase 3.
 */
export const memoryRepository = {
  async addMemory(_fact: string, _embedding: number[], _entity?: string, _category?: string): Promise<string> {
    return Date.now().toString();
  },

  async findSimilar(_embedding: number[], _limit?: number): Promise<MemoryRow[]> {
    return [];
  },

  async getAllMemories(): Promise<MemoryRow[]> {
    return [];
  },

  async deleteMemory(_id: string): Promise<void> {},

  async updateMemory(_id: string, _fact: string, _embedding: number[]): Promise<void> {},
};
