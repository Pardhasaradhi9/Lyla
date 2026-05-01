import { getCalendars, getLocales } from 'expo-localization';
import * as Battery from 'expo-battery';
import * as Device from 'expo-device';

const CITY_TO_TIMEZONE: Record<string, string> = {
  'london': 'Europe/London',
  'paris': 'Europe/Paris',
  'berlin': 'Europe/Berlin',
  'madrid': 'Europe/Madrid',
  'rome': 'Europe/Rome',
  'amsterdam': 'Europe/Amsterdam',
  'moscow': 'Europe/Moscow',
  'istanbul': 'Europe/Istanbul',
  'dubai': 'Asia/Dubai',
  'mumbai': 'Asia/Kolkata',
  'delhi': 'Asia/Kolkata',
  'kolkata': 'Asia/Kolkata',
  'bangkok': 'Asia/Bangkok',
  'singapore': 'Asia/Singapore',
  'hong kong': 'Asia/Hong_Kong',
  'shanghai': 'Asia/Shanghai',
  'beijing': 'Asia/Shanghai',
  'tokyo': 'Asia/Tokyo',
  'seoul': 'Asia/Seoul',
  'sydney': 'Australia/Sydney',
  'melbourne': 'Australia/Melbourne',
  'auckland': 'Pacific/Auckland',
  'los angeles': 'America/Los_Angeles',
  'san francisco': 'America/Los_Angeles',
  'seattle': 'America/Los_Angeles',
  'denver': 'America/Denver',
  'chicago': 'America/Chicago',
  'dallas': 'America/Chicago',
  'new york': 'America/New_York',
  'washington': 'America/New_York',
  'boston': 'America/New_York',
  'miami': 'America/New_York',
  'toronto': 'America/Toronto',
  'vancouver': 'America/Vancouver',
  'mexico city': 'America/Mexico_City',
  'sao paulo': 'America/Sao_Paulo',
  'buenos aires': 'America/Argentina/Buenos_Aires',
  'cairo': 'Africa/Cairo',
  'lagos': 'Africa/Lagos',
  'nairobi': 'Africa/Nairobi',
  'johannesburg': 'Africa/Johannesburg',
  'honolulu': 'Pacific/Honolulu',
  'anchorage': 'America/Anchorage',
};

const REGION_ALIASES: Record<string, string> = {
  'uk': 'Europe/London',
  'britain': 'Europe/London',
  'england': 'Europe/London',
  'india': 'Asia/Kolkata',
  'japan': 'Asia/Tokyo',
  'korea': 'Asia/Seoul',
  'australia': 'Australia/Sydney',
  'california': 'America/Los_Angeles',
  'east coast': 'America/New_York',
  'west coast': 'America/Los_Angeles',
  'pacific': 'America/Los_Angeles',
  'central': 'America/Chicago',
  'eastern': 'America/New_York',
  'mountain': 'America/Denver',
  'gmt': 'GMT',
  'utc': 'UTC',
  'est': 'America/New_York',
  'pst': 'America/Los_Angeles',
  'cst': 'America/Chicago',
  'mst': 'America/Denver',
  'ist': 'Asia/Kolkata',
  'cet': 'Europe/Paris',
  'jst': 'Asia/Tokyo',
};

function extractTimezoneFromMessage(message: string): string | null {
  const lower = message.toLowerCase();

  const patterns = [
    /(?:time|clock|date)\s+(?:in|at|for|of)\s+([a-z\s]+)/,
    /(?:in|at)\s+([a-z\s]+)\s+(?:time|timezone|clock)/,
    /(?:what(?:'s| is)\s+(?:the\s+)?time\s+(?:in|at)\s+)([a-z\s]+)/,
  ];

  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match) {
      let location = match[1].trim().replace(/[?.!]+$/, '').replace(/\s+(now|right now|currently|please)$/,'');
      
      if (CITY_TO_TIMEZONE[location]) return CITY_TO_TIMEZONE[location];
      if (REGION_ALIASES[location]) return REGION_ALIASES[location];

      try {
        const allZones = Intl.supportedValuesOf('timeZone');
        const matched = allZones.find(tz => {
          const city = tz.split('/').pop()!.replace(/_/g, ' ').toLowerCase();
          return city === location;
        });
        if (matched) return matched;
      } catch {}
    }
  }

  return null;
}

function getDeviceTimezone(): string {
  try {
    const calendars = getCalendars();
    if (calendars.length > 0 && calendars[0].timeZone) {
      return calendars[0].timeZone;
    }
  } catch {}
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getDeviceLocale(): string {
  try {
    const locales = getLocales();
    if (locales.length > 0) return locales[0].languageTag;
  } catch {}
  return 'en-US';
}

export function handleTimeQuery(message: string): string {
  const now = new Date();
  const targetTz = extractTimezoneFromMessage(message);
  const deviceTz = getDeviceTimezone();
  const locale = getDeviceLocale();
  const timezone = targetTz || deviceTz;

  try {
    const timeStr = now.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: timezone,
    });

    const dateStr = now.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezone,
    });

    const tzLabel = timezone.replace(/_/g, ' ');

    if (targetTz && targetTz !== deviceTz) {
      const localTime = now.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: deviceTz,
      });
      return `${timeStr} on ${dateStr} (${tzLabel})\nYour local time: ${localTime}`;
    }

    return `${timeStr} on ${dateStr}`;
  } catch {
    const time = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    const date = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return `${time} on ${date}`;
  }
}

export async function handleBatteryQuery(): Promise<string> {
  try {
    const powerState = await Battery.getPowerStateAsync();
    const level = Math.round((powerState.batteryLevel ?? 0) * 100);
    const stateMap: Record<number, string> = {
      [Battery.BatteryState.UNPLUGGED]: 'Unplugged',
      [Battery.BatteryState.CHARGING]: 'Charging',
      [Battery.BatteryState.FULL]: 'Fully Charged',
    };
    const state = stateMap[powerState.batteryState ?? 0] || 'Unknown';
    const lowPower = powerState.lowPowerMode ? ' (Low Power Mode)' : '';

    if (level < 0) return 'Battery information is not available on this device (simulator).';

    return `${level}% — ${state}${lowPower}`;
  } catch {
    return 'Battery information is not available on this device.';
  }
}

export function handleDeviceQuery(): string {
  try {
    const parts: string[] = [];

    if (Device.modelName) parts.push(Device.modelName);
    if (Device.osName && Device.osVersion) parts.push(`${Device.osName} ${Device.osVersion}`);
    if (Device.deviceName) parts.push(`"${Device.deviceName}"`);

    if (parts.length === 0) return 'Device information is not available.';

    const isSimulator = !Device.isDevice;
    const suffix = isSimulator ? ' (Simulator)' : '';

    return `${parts.join(' · ')}${suffix}`;
  } catch {
    return 'Device information is not available.';
  }
}
