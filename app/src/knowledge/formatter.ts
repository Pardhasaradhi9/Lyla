import { KnowledgeResult } from './types';

export interface FormattedKnowledge {
  text: string;
  sources: Array<{ title: string; url?: string }>;
}

export function formatForBrain(
  results: KnowledgeResult[],
  userQuery: string,
): FormattedKnowledge {
  if (results.length === 0) {
    return { text: '', sources: [] };
  }

  const parts: string[] = ['[KNOWLEDGE]'];
  const sources: Array<{ title: string; url?: string }> = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const ref = `[${i + 1}]`;
    parts.push(`${ref} ${r.title} (${r.source})\n${r.content}`);
    sources.push({ title: `${r.title} — ${r.source}`, url: r.sourceUrl });
  }

  parts.push('[/KNOWLEDGE]');
  parts.push('');
  parts.push('Answer the user\'s question using the knowledge above. Reference sources as [1], [2], etc. when using info from them. Be concise.');

  return {
    text: parts.join('\n'),
    sources,
  };
}

export function postProcessCitations(
  response: string,
  sources: Array<{ title: string; url?: string }>,
): string {
  if (sources.length === 0) return response;

  let cleaned = response;

  const usedRefs = new Set<number>();
  const refRegex = /\[(\d+)\]/g;
  let match;
  while ((match = refRegex.exec(response)) !== null) {
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= sources.length) {
      usedRefs.add(num);
    }
  }

  if (usedRefs.size > 0) {
    const sourceList = Array.from(usedRefs)
      .map(n => `[${n}] ${sources[n - 1].title}`)
      .join('\n');
    cleaned += `\n\n---\n${sourceList}`;
  }

  return cleaned;
}
