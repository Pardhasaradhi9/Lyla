import { KnowledgeResult } from '../types';

const BASE = 'https://api.open-meteo.com/v1';

const WEATHER_CODES: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Moderate drizzle',
  55: 'Dense drizzle', 61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 80: 'Rain showers',
  95: 'Thunderstorm',
};

export async function getWeather(
  latitude: number,
  longitude: number,
  locationName?: string,
): Promise<KnowledgeResult[]> {
  try {
    const url = `${BASE}/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&temperature_unit=celsius&wind_speed_unit=kmh`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();

    const cur = data.current;
    if (!cur) return [];

    const desc = WEATHER_CODES[cur.weather_code] ?? `Code ${cur.weather_code}`;
    const content = [
      `Weather${locationName ? ` in ${locationName}` : ''}: ${desc}`,
      `Temperature: ${cur.temperature_2m}°C (feels like ${cur.apparent_temperature}°C)`,
      `Humidity: ${cur.relative_humidity_2m}%`,
      `Wind: ${cur.wind_speed_10m} km/h`,
    ].join('\n');

    return [{
      title: `Current Weather${locationName ? ` — ${locationName}` : ''}`,
      content,
      source: 'Open-Meteo',
      sourceUrl: `https://open-meteo.com/en/docs?latitude=${latitude}&longitude=${longitude}`,
    }];
  } catch {
    return [];
  }
}
