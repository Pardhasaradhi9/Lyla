import { KnowledgeResult } from '../types';

const BASE = 'https://api.openalex.org';

export async function searchPapers(query: string): Promise<KnowledgeResult[]> {
  try {
    const url = `${BASE}/works?search=${encodeURIComponent(query)}&per_page=3&select=id,title,authorships,publication_year,abstract_inverted_index,doi,type`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Lyla/0.1.0 (mailto:lyla@prepmyrez.com)' },
    });
    if (!res.ok) return [];
    const data = await res.json();

    if (!data.results || data.results.length === 0) return [];

    return data.results.map((paper: any) => {
      const authors = paper.authorships
        ?.slice(0, 3)
        .map((a: any) => a.author?.display_name)
        .filter(Boolean)
        .join(', ') ?? 'Unknown authors';

      const abstract = paper.abstract_inverted_index
        ? reconstructAbstract(paper.abstract_inverted_index)
        : 'No abstract available.';

      return {
        title: paper.title ?? 'Untitled',
        content: `${authors} (${paper.publication_year ?? 'Unknown year'})\n${abstract.slice(0, 300)}`,
        source: 'OpenAlex',
        sourceUrl: paper.doi ? `https://doi.org/${paper.doi}` : paper.id,
      };
    });
  } catch {
    return [];
  }
}

function reconstructAbstract(inverted: Record<string, number[]>): string {
  const positions: Map<number, string> = new Map();
  for (const [word, indices] of Object.entries(inverted)) {
    for (const idx of indices) {
      positions.set(idx, word);
    }
  }
  const sorted = Array.from(positions.entries()).sort((a, b) => a[0] - b[0]);
  return sorted.map(([, word]) => word).join(' ');
}
