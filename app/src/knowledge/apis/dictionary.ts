import { KnowledgeResult } from '../types';

const BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en';

export async function defineWord(word: string): Promise<KnowledgeResult[]> {
  try {
    const url = `${BASE}/${encodeURIComponent(word.toLowerCase())}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) return [];
    const entry = data[0];

    const meanings = entry.meanings?.slice(0, 2) ?? [];
    const parts: string[] = [];

    if (entry.phonetic) parts.push(`Pronunciation: ${entry.phonetic}`);

    for (const meaning of meanings) {
      const defs = meaning.definitions?.slice(0, 2) ?? [];
      for (const d of defs) {
        parts.push(`(${meaning.partOfSpeech}) ${d.definition}`);
        if (d.example) parts.push(`  Example: "${d.example}"`);
      }
    }

    if (parts.length === 0) return [];

    return [{
      title: entry.word ?? word,
      content: parts.join('\n'),
      source: 'Free Dictionary',
      sourceUrl: `https://dictionaryapi.dev/`,
    }];
  } catch {
    return [];
  }
}
