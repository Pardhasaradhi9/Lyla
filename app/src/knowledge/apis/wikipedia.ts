import { KnowledgeResult } from '../types';

const BASE = 'https://en.wikipedia.org/api/rest_v1';

export async function searchWikipedia(query: string): Promise<KnowledgeResult[]> {
  try {
    const searchUrl = `${BASE}/page/summary/${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Lyla/0.1.0 (private on-device AI)' },
    });
    if (!res.ok) return [];
    const data = await res.json();

    if (data.type === 'disambiguation' && data.content_urls?.desktop?.page) {
      const term = data.content_urls.desktop.page.split('/').pop();
      if (term) return searchWikipedia(term);
      return [];
    }

    if (!data.extract) return [];

    return [{
      title: data.title ?? query,
      content: data.extract,
      source: 'Wikipedia',
      sourceUrl: data.content_urls?.desktop?.page,
    }];
  } catch {
    return [];
  }
}
