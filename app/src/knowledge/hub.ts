import { KnowledgeResponse, KnowledgeResult } from './types';
import { formatForBrain, postProcessCitations, FormattedKnowledge } from './formatter';
import { getCached, setCache, CACHE_TTL, initKnowledgeCache } from './cache';
import { searchWikipedia } from './apis/wikipedia';
import { searchWikidata } from './apis/wikidata';
import { getWeather } from './apis/open-meteo';
import { getCountryInfo } from './apis/rest-countries';
import { searchBooks } from './apis/openlibrary';
import { searchPapers } from './apis/openalex';
import { defineWord } from './apis/dictionary';
import { convertCurrency } from './apis/currency';
import { getHolidays } from './apis/holidays';

let cacheInitialized = false;

async function ensureCache() {
  if (!cacheInitialized) {
    await initKnowledgeCache();
    cacheInitialized = true;
  }
}

export type KnowledgeIntent =
  | 'knowledge_weather'
  | 'knowledge_country'
  | 'knowledge_book'
  | 'knowledge_paper'
  | 'knowledge_dictionary'
  | 'knowledge_currency'
  | 'knowledge_holiday'
  | 'knowledge_general';

export async function queryKnowledge(
  intent: KnowledgeIntent,
  userMessage: string,
): Promise<KnowledgeResponse> {
  await ensureCache();

  let results: KnowledgeResult[] = [];

  switch (intent) {
    case 'knowledge_weather':
      results = await handleWeather(userMessage);
      break;
    case 'knowledge_country':
      results = await handleCountry(userMessage);
      break;
    case 'knowledge_book':
      results = await handleBook(userMessage);
      break;
    case 'knowledge_paper':
      results = await handlePaper(userMessage);
      break;
    case 'knowledge_dictionary':
      results = await handleDictionary(userMessage);
      break;
    case 'knowledge_currency':
      results = await handleCurrency(userMessage);
      break;
    case 'knowledge_holiday':
      results = await handleHoliday(userMessage);
      break;
    case 'knowledge_general':
    default:
      results = await handleGeneral(userMessage);
      break;
  }

  return { results, query: userMessage, cached: false };
}

export function formatKnowledgeForBrain(
  results: KnowledgeResult[],
  userQuery: string,
): FormattedKnowledge {
  return formatForBrain(results, userQuery);
}

async function cachedFetch(
  key: string,
  source: string,
  ttl: number,
  fetcher: () => Promise<KnowledgeResult[]>,
): Promise<KnowledgeResult[]> {
  const cached = await getCached(key, source);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {}
  }

  const results = await fetcher();

  if (results.length > 0) {
    setCache(key, source, JSON.stringify(results), ttl).catch(() => {});
  }

  return results;
}

async function handleWeather(message: string): Promise<KnowledgeResult[]> {
  const locationMatch = message.match(/(?:in|at|for)\s+([\w\s]+?)(?:\s*[?.!]?\s*$|\s+(?:today|tomorrow|now|this)\b)/i)
    ?? message.match(/(?:weather|temperature|forecast|rain)\s+(?:in|at|for)\s+([\w\s]+?)(?:\s*[?.!]?\s*$)/i);
  const location = locationMatch?.[1]?.trim();

  if (location) {
    const geo = await geocodeCity(location);
    if (geo) {
      return cachedFetch(
        `weather:${location.toLowerCase()}:${geo.lat}:${geo.lon}`,
        'open-meteo',
        CACHE_TTL.WEATHER,
        () => getWeather(geo.lat, geo.lon, location),
      );
    }
  }

  return cachedFetch(
    'weather:default',
    'open-meteo',
    CACHE_TTL.WEATHER,
    () => getWeather(17.385, 78.486, 'your location'),
  );
}

async function geocodeCity(city: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en`,
    );
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return { lat: data.results[0].latitude, lon: data.results[0].longitude };
    }
  } catch {}
  return null;
}

async function handleCountry(message: string): Promise<KnowledgeResult[]> {
  const match = message.match(/(?:capital|population|currency|language|info(?:rmation)?)\s+(?:of|about|for)\s+([\w\s]+?)(?:\s*[?.!]?\s*$)/i)
    ?? message.match(/(?:tell me about|about)\s+([\w\s]+?)(?:\s*[?.!]?\s*$)/i);
  const country = match?.[1]?.trim() ?? message.replace(/[^a-zA-Z\s]/g, '').trim();

  return cachedFetch(
    `country:${country}`,
    'rest-countries',
    CACHE_TTL.COUNTRY,
    () => getCountryInfo(country),
  );
}

async function handleBook(message: string): Promise<KnowledgeResult[]> {
  const match = message.match(/(?:book|novel|author|written by|about)\s+(.+?)(?:\s*[?.!]?\s*$)/i);
  const query = match?.[1]?.trim() ?? message.replace(/[^a-zA-Z\s]/g, '').trim();

  return cachedFetch(
    `book:${query}`,
    'openlibrary',
    CACHE_TTL.BOOK,
    () => searchBooks(query),
  );
}

async function handlePaper(message: string): Promise<KnowledgeResult[]> {
  const match = message.match(/(?:paper|research|article|study)\s+(?:about|on)\s+(.+?)(?:\s*[?.!]?\s*$)/i)
    ?? message.match(/(?:latest|recent)\s+(?:papers?|research)\s+(.+?)(?:\s*[?.!]?\s*$)/i);
  const query = match?.[1]?.trim() ?? message.replace(/[^a-zA-Z\s]/g, '').trim();

  return cachedFetch(
    `paper:${query}`,
    'openalex',
    CACHE_TTL.PAPER,
    () => searchPapers(query),
  );
}

async function handleDictionary(message: string): Promise<KnowledgeResult[]> {
  const match = message.match(/(?:meaning|definition|define|what (?:does|is))\s+(?:of\s+)?(?:["']?(\w+)["']?)/i)
    ?? message.match(/(?:what(?:'s| is) )?(\w+)\s+mean/i);
  const word = match?.[1]?.trim() ?? message.replace(/[^a-zA-Z]/g, '').trim();

  if (!word || word.length < 2) return [];

  return cachedFetch(
    `dict:${word}`,
    'dictionary',
    CACHE_TTL.DICTIONARY,
    () => defineWord(word),
  );
}

async function handleCurrency(message: string): Promise<KnowledgeResult[]> {
  const match = message.match(/(\d+(?:\.\d+)?)\s*(?:USD|EUR|GBP|INR|JPY|AUD|CAD|CHF|CNY)\s*(?:to|in|=)\s*(USD|EUR|GBP|INR|JPY|AUD|CAD|CHF|CNY)/i);
  const fromMatch = message.match(/(?:from\s+)?(USD|EUR|GBP|INR|JPY|AUD|CAD|CHF|CNY)/gi);

  if (match) {
    const amount = parseFloat(match[1]);
    const from = message.match(/(\d+)\s*(USD|EUR|GBP|INR|JPY|AUD|CAD|CHF|CNY)/i);
    const to = match[2];
    return cachedFetch(
      `currency:${from?.[2]}:${to}:${amount}`,
      'currency',
      CACHE_TTL.CURRENCY,
      () => convertCurrency(from?.[2] ?? 'USD', to, amount),
    );
  }

  if (fromMatch && fromMatch.length >= 2) {
    return cachedFetch(
      `currency:${fromMatch[0]}:${fromMatch[1]}:1`,
      'currency',
      CACHE_TTL.CURRENCY,
      () => convertCurrency(fromMatch[0], fromMatch[1], 1),
    );
  }

  return [];
}

async function handleHoliday(message: string): Promise<KnowledgeResult[]> {
  const year = new Date().getFullYear();
  return cachedFetch(
    `holiday:${year}:US`,
    'holidays',
    CACHE_TTL.HOLIDAY,
    () => getHolidays(year, 'US'),
  );
}

async function handleGeneral(message: string): Promise<KnowledgeResult[]> {
  const cleanQuery = message
    .replace(/^(?:who|what|when|where|why|how|tell me about|explain|describe)\s+/i, '')
    .replace(/[?.!]+$/, '')
    .trim();

  const [wikiResults, wikidataResults] = await Promise.all([
    cachedFetch(cleanQuery, 'wikipedia', CACHE_TTL.WIKIPEDIA, () => searchWikipedia(cleanQuery)),
    cachedFetch(cleanQuery, 'wikidata', CACHE_TTL.WIKIDATA, () => searchWikidata(cleanQuery)),
  ]);

  return [...wikiResults, ...wikidataResults];
}
