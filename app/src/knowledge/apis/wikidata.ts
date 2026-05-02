import { KnowledgeResult } from '../types';

const BASE = 'https://www.wikidata.org/w/api.php';

interface WikidataEntity {
  id: string;
  label: string;
  description?: string;
}

export async function searchWikidata(query: string): Promise<KnowledgeResult[]> {
  try {
    const url = `${BASE}?action=wbsearchentities&search=${encodeURIComponent(query)}&format=json&language=en&limit=3`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Lyla/0.1.0 (private on-device AI)' },
    });
    if (!res.ok) return [];
    const data = await res.json();

    if (!data.search || data.search.length === 0) return [];

    return data.search
      .filter((e: WikidataEntity) => e.label && e.description)
      .map((e: WikidataEntity) => ({
        title: e.label,
        content: e.description ?? '',
        source: 'Wikidata',
        sourceUrl: `https://www.wikidata.org/wiki/${e.id}`,
      }));
  } catch {
    return [];
  }
}
