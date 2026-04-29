/**
 * Search Engine — DuckDuckGo Web Search
 *
 * Fetches and parses DuckDuckGo HTML results for
 * online search grounding.
 *
 * Phase 4 implementation.
 */

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

export interface SearchEngine {
  search(query: string): Promise<SearchResult[]>;
  classifyIntent(message: string): Promise<{ needsSearch: boolean; query: string }>;
}

/**
 * Placeholder search engine.
 * Will be replaced with actual DuckDuckGo integration in Phase 4.
 */
export const searchEngine: SearchEngine = {
  async search(): Promise<SearchResult[]> {
    return [];
  },
  async classifyIntent(): Promise<{ needsSearch: boolean; query: string }> {
    return { needsSearch: false, query: '' };
  },
};
