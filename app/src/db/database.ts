/**
 * Database Initialization — expo-sqlite
 *
 * Creates all tables, enables WAL mode, and handles schema migrations.
 * Uses expo-sqlite for Expo compatibility.
 *
 * Tables:
 * - conversations: Chat session metadata
 * - messages: Individual messages within conversations
 * - memories: Extracted facts about the user (Phase 3)
 */

import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let sqliteVecAvailable = false;

export function isVecAvailable(): boolean {
  return sqliteVecAvailable;
}

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  if (db) return;

  db = await SQLite.openDatabaseAsync('lyla.db');

  await db.execAsync(`PRAGMA journal_mode = WAL;`);

  sqliteVecAvailable = false;
  try {
    const sqliteVec = SQLite.bundledExtensions?.['sqlite-vec'];
    if (sqliteVec) {
      await db.loadExtensionAsync(sqliteVec.libPath, sqliteVec.entryPoint);
      const version = await db.getFirstAsync<{ 'vec_version()': string }>('SELECT vec_version()');
      console.log('[Database] Loaded sqlite-vec, version:', version);
      sqliteVecAvailable = true;
    } else {
      console.warn('[Database] sqlite-vec not found in bundled extensions. Ensure withSQLiteVecExtension: true in app.json and npx expo prebuild was run.');
    }
  } catch (e) {
    console.warn('[Database] Failed to load sqlite-vec:', e);
    sqliteVecAvailable = false;
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      fact TEXT NOT NULL,
      entity TEXT,
      category TEXT,
      source_message_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);
  `);

  if (sqliteVecAvailable) {
    try {
      await db.execAsync(`
        CREATE VIRTUAL TABLE IF NOT EXISTS memory_vectors USING vec0(
          memory_id TEXT PRIMARY KEY,
          embedding FLOAT[384]
        );
      `);
      console.log('[Database] Created memory_vectors table successfully');
    } catch (e) {
      console.warn('[Database] Failed to create memory_vectors:', e);
      sqliteVecAvailable = false;
    }
  } else {
    console.warn('[Database] Skipping memory_vectors creation — sqlite-vec not available. Memory search will be disabled.');
  }

  console.log('[Database] Initialized successfully');
}

/**
 * Close the database connection.
 * Call this when the app goes to background if needed.
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
    sqliteVecAvailable = false;
    console.log('[Database] Closed');
  }
}
