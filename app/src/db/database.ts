/**
 * Database Initialization — SQLite + sqlite-vec
 *
 * Creates all tables, loads sqlite-vec extension,
 * and handles schema migrations.
 *
 * Phase 3 full implementation. Schema defined here for reference.
 */

/**
 * SQL schema for Lyla's local database.
 * This will be executed via op-sqlite when the database module is implemented.
 */
export const SCHEMA = {
  conversations: `
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `,

  messages: `
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
  `,

  memories: `
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      fact TEXT NOT NULL,
      entity TEXT,
      category TEXT,
      source_message_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);
  `,

  // sqlite-vec virtual table for vector similarity search
  memoryVectors: `
    CREATE VIRTUAL TABLE IF NOT EXISTS memory_vectors USING vec0(
      memory_id TEXT PRIMARY KEY,
      embedding FLOAT[384]
    );
  `,
} as const;

/**
 * Placeholder database initialization.
 * Will be implemented with op-sqlite in Phase 3.
 */
export async function initDatabase(): Promise<void> {
  // Phase 3: Open SQLite database, load sqlite-vec, execute SCHEMA
}
