import { KnowledgeResult } from '../types';

const BASE = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies';

export async function convertCurrency(
  from: string,
  to: string,
  amount: number,
): Promise<KnowledgeResult[]> {
  try {
    const fromLower = from.toLowerCase();
    const url = `${BASE}/${fromLower}.json`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();

    const rates = data[fromLower];
    if (!rates) return [];

    const toLower = to.toLowerCase();
    const rate = rates[toLower];
    if (!rate) return [];

    const converted = (amount * rate).toFixed(2);

    return [{
      title: `${amount} ${from.toUpperCase()} to ${to.toUpperCase()}`,
      content: `${amount} ${from.toUpperCase()} = ${converted} ${to.toUpperCase()}\nRate: 1 ${from.toUpperCase()} = ${rate.toFixed(4)} ${to.toUpperCase()}`,
      source: 'Currency-API',
      sourceUrl: 'https://github.com/fawazahmed0/exchange-api',
    }];
  } catch {
    return [];
  }
}
