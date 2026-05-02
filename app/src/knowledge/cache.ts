import { getDatabase } from '@/db/database';

interface CacheRow {
  query: string;
  source: string;
  response: string;
  created_at: number;
  expires_at: number;
}

export async function initKnowledgeCache(): Promise<void> {
  try {
    const db = getDatabase();
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS knowledge_cache (
        query TEXT NOT NULL,
        source TEXT NOT NULL,
        response TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        PRIMARY KEY (query, source)
      )
    `);
  } catch {}
}

export async function getCached(
  query: string,
  source: string,
): Promise<string | null> {
  try {
    const db = getDatabase();
    const now = Date.now();
    const row = await db.getFirstAsync<CacheRow>(
      'SELECT response FROM knowledge_cache WHERE query = ? AND source = ? AND expires_at > ?',
      [query.toLowerCase().trim(), source, now],
    );
    return row?.response ?? null;
  } catch {
    return null;
  }
}

export async function setCache(
  query: string,
  source: string,
  response: string,
  ttlMs: number,
): Promise<void> {
  try {
    const db = getDatabase();
    const now = Date.now();
    await db.runAsync(
      'INSERT OR REPLACE INTO knowledge_cache (query, source, response, created_at, expires_at) VALUES (?, ?, ?, ?, ?)',
      [query.toLowerCase().trim(), source, response, now, now + ttlMs],
    );
  } catch {}
}

export async function evictExpired(): Promise<void> {
  try {
    const db = getDatabase();
    await db.runAsync('DELETE FROM knowledge_cache WHERE expires_at < ?', [Date.now()]);
  } catch {}
}

export const CACHE_TTL = {
  WIKIPEDIA: 30 * 24 * 60 * 60 * 1000,
  WIKIDATA: 30 * 24 * 60 * 60 * 1000,
  WEATHER: 1 * 60 * 60 * 1000,
  COUNTRY: 365 * 24 * 60 * 60 * 1000,
  BOOK: 365 * 24 * 60 * 60 * 1000,
  PAPER: 7 * 24 * 60 * 60 * 1000,
  DICTIONARY: 365 * 24 * 60 * 60 * 1000,
  CURRENCY: 1 * 24 * 60 * 60 * 1000,
  HOLIDAY: 30 * 24 * 60 * 60 * 1000,
} as const;
