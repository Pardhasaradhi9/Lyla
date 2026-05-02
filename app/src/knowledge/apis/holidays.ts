import { KnowledgeResult } from '../types';

const BASE = 'https://date.nager.at/api/v3';

export async function getHolidays(
  year: number,
  countryCode: string,
): Promise<KnowledgeResult[]> {
  try {
    const url = `${BASE}/PublicHolidays/${year}/${countryCode.toUpperCase()}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) return [];

    const upcoming = data
      .filter((h: any) => new Date(h.date) >= new Date())
      .slice(0, 5);

    if (upcoming.length === 0) return [];

    const content = upcoming
      .map((h: any) => `${h.date} — ${h.localName}${h.name !== h.localName ? ` (${h.name})` : ''}`)
      .join('\n');

    return [{
      title: `Upcoming Holidays (${countryCode.toUpperCase()})`,
      content,
      source: 'Public Holiday API',
      sourceUrl: `https://date.nager.at`,
    }];
  } catch {
    return [];
  }
}
