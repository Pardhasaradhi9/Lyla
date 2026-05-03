/**
 * Memory Repository
 *
 * Handles saving and retrieving memories from SQLite,
 * including vector embeddings for semantic search using sqlite-vec.
 */

import * as SQLite from 'expo-sqlite';
import { getDatabase, isVecAvailable } from '@/db/database';

export interface MemoryRow {
  id: string;
  fact: string;
  entity: string | null;
  category: string | null;
  source_message_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface SearchResult extends MemoryRow {
  distance: number;
}

class MemoryRepository {
  private get db(): SQLite.SQLiteDatabase {
    return getDatabase();
  }

  /**
   * Save a new memory and its embedding.
   */
  async saveMemory(
    fact: string,
    embedding: number[],
    entity: string | null = null,
    category: string | null = null,
    sourceMessageId: string | null = null
  ): Promise<string> {
    const db = this.db;
    const id = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9);
    const now = Date.now();

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO memories (id, fact, entity, category, source_message_id, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, fact, entity, category, sourceMessageId, now, now]
      );

      if (isVecAvailable()) {
        try {
          const embeddingJson = JSON.stringify(embedding);
          await db.runAsync(
            `INSERT INTO memory_vectors (memory_id, embedding) VALUES (?, ?)`,
            [id, embeddingJson]
          );
        } catch (vecError) {
          console.warn('[MemoryRepo] Failed to insert vector (non-fatal, fact still saved):', vecError);
        }
      }
    });

    console.log(`[MemoryRepo] Saved memory: "${fact}" (${id})`);
    return id;
  }

  /**
   * Search for similar memories using K-Nearest Neighbors (KNN).
   */
  async searchMemories(
    queryEmbedding: number[],
    limit: number = 5,
    distanceThreshold: number = 2.0
  ): Promise<SearchResult[]> {
    if (!isVecAvailable()) {
      return [];
    }

    const db = this.db;
    const embeddingJson = JSON.stringify(queryEmbedding);

    try {
      const results = await db.getAllAsync<SearchResult>(
        `
        SELECT
          m.id, m.fact, m.entity, m.category, m.source_message_id,
          m.created_at, m.updated_at,
          v.distance
        FROM memory_vectors v
        JOIN memories m ON v.memory_id = m.id
        WHERE v.embedding MATCH ?
          AND k = ?
        ORDER BY v.distance
        `,
        [embeddingJson, limit]
      );

      return results.filter(r => r.distance <= distanceThreshold);
    } catch (e) {
      console.warn('[MemoryRepo] Vector search failed:', e);
      return [];
    }
  }

  /**
   * Delete a memory by ID.
   */
  async deleteMemory(id: string): Promise<void> {
    const db = this.db;
    await db.withTransactionAsync(async () => {
      if (isVecAvailable()) {
        try {
          await db.runAsync(`DELETE FROM memory_vectors WHERE memory_id = ?`, [id]);
        } catch (e) {
          console.warn('[MemoryRepo] Failed to delete vector:', e);
        }
      }
      await db.runAsync(`DELETE FROM memories WHERE id = ?`, [id]);
    });
  }

  /**
   * Get all memories (for the Settings -> View Memories screen).
   */
  async getAllMemories(): Promise<MemoryRow[]> {
    const db = this.db;
    return db.getAllAsync<MemoryRow>(`SELECT * FROM memories ORDER BY created_at DESC`);
  }

  /**
   * Get total memory count without loading all rows.
   */
  async getMemoryCount(): Promise<number> {
    const db = this.db;
    const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM memories');
    return row?.count ?? 0;
  }

  async deleteAllMemories(): Promise<void> {
    const db = this.db;
    await db.withTransactionAsync(async () => {
      if (isVecAvailable()) {
        try {
          await db.runAsync(`DELETE FROM memory_vectors`);
        } catch (e) {
          console.warn('[MemoryRepo] Failed to clear vectors:', e);
        }
      }
      await db.runAsync(`DELETE FROM memories`);
    });
    console.log('[MemoryRepo] All memories cleared');
  }
}

export const memoryRepository = new MemoryRepository();
