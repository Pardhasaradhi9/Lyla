import { KnowledgeResult } from '../types';

const BASE = 'https://restcountries.com/v3.1';

export async function getCountryInfo(name: string): Promise<KnowledgeResult[]> {
  try {
    const url = `${BASE}/name/${encodeURIComponent(name)}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) return [];
    const c = data[0];

    const currencies = c.currencies
      ? Object.values(c.currencies).map((cu: any) => `${cu.name} (${cu.symbol})`).join(', ')
      : 'Unknown';

    const languages = c.languages
      ? Object.values(c.languages).join(', ')
      : 'Unknown';

    const content = [
      `Official name: ${c.name?.official ?? 'Unknown'}`,
      `Capital: ${(c.capital ?? ['Unknown']).join(', ')}`,
      `Region: ${c.region ?? 'Unknown'}${c.subregion ? ` (${c.subregion})` : ''}`,
      `Population: ${c.population?.toLocaleString() ?? 'Unknown'}`,
      `Languages: ${languages}`,
      `Currencies: ${currencies}`,
      `Area: ${c.area?.toLocaleString() ?? 'Unknown'} km²`,
    ].join('\n');

    return [{
      title: c.name?.common ?? name,
      content,
      source: 'REST Countries',
      sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(c.name?.common ?? name)}`,
    }];
  } catch {
    return [];
  }
}
