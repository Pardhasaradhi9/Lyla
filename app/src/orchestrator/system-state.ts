import { getCalendars, getLocales } from 'expo-localization';
import * as Battery from 'expo-battery';
import * as Device from 'expo-device';
import NetInfo from '@react-native-community/netinfo';

// Calendar cache — avoids expensive calendar API calls on every Brain message
let _calCache: { data: { todayEvents: string; upcomingEvents: string }; ts: number } | null = null;
const CAL_CACHE_TTL = 60_000; // 60 seconds

export interface SystemState {
  time: {
    now: Date;
    timezone: string;
    locale: string;
  };
  battery: {
    level: number;
    charging: boolean;
    lowPower: boolean;
  };
  network: {
    online: boolean;
    type: string;
  };
  device: {
    model: string;
    os: string;
    name: string;
    isDevice: boolean;
  };
  calendar: {
    todayEvents: string;
    upcomingEvents: string;
  };
  memories: {
    relevant: Array<{ fact: string; category: string | null; entity: string | null }>;
    totalCount: number;
  };
}

export async function buildSystemState(relevantMemories: SystemState['memories']['relevant'] = [], totalMemoryCount = 0): Promise<SystemState> {
  const now = new Date();
  const timezone = getDeviceTimezone();
  const locale = getDeviceLocale();

  let battery = { level: -1, charging: false, lowPower: false };
  try {
    const powerState = await Battery.getPowerStateAsync();
    battery = {
      level: Math.round((powerState.batteryLevel ?? 0) * 100),
      charging: powerState.batteryState === Battery.BatteryState.CHARGING,
      lowPower: !!powerState.lowPowerMode,
    };
  } catch {}

  let network = { online: false, type: 'unknown' };
  try {
    const netInfo = await NetInfo.fetch();
    network = {
      online: !!netInfo.isConnected,
      type: netInfo.type || 'unknown',
    };
  } catch {}

  const device = {
    model: Device.modelName || 'Unknown',
    os: Device.osName && Device.osVersion ? `${Device.osName} ${Device.osVersion}` : 'Unknown',
    name: Device.deviceName || 'Unknown',
    isDevice: Device.isDevice,
  };

  let calendarState = { todayEvents: '', upcomingEvents: '' };
  const nowMs = Date.now();
  if (_calCache && (nowMs - _calCache.ts) < CAL_CACHE_TTL) {
    calendarState = _calCache.data;
  } else {
    try {
      const { getTodayEvents, getUpcomingEvents } = await import('@/tools/calendar-tool');
      const data = { todayEvents: await getTodayEvents(), upcomingEvents: await getUpcomingEvents(3) };
      _calCache = { data, ts: nowMs };
      calendarState = data;
    } catch {}
  }

  return {
    time: { now, timezone, locale },
    battery,
    network,
    device,
    calendar: calendarState,
    memories: { relevant: relevantMemories, totalCount: totalMemoryCount },
  };
}

export function formatSystemStateForPrompt(state: SystemState): string {
  const parts: string[] = [];

  parts.push(`Current time: ${state.time.now.toLocaleString()} (${state.time.timezone})`);

  if (state.battery.level >= 0) {
    const charging = state.battery.charging ? ', charging' : '';
    const lowPower = state.battery.lowPower ? ', low power mode' : '';
    parts.push(`Battery: ${state.battery.level}%${charging}${lowPower}`);
  }

  parts.push(`Network: ${state.network.online ? `online (${state.network.type})` : 'offline'}`);
  parts.push(`Device: ${state.device.model}, ${state.device.os}`);

  if (state.calendar.todayEvents && !state.calendar.todayEvents.includes('no events')) {
    parts.push(state.calendar.todayEvents);
  }
  if (state.calendar.upcomingEvents) {
    parts.push(state.calendar.upcomingEvents);
  }

  if (state.memories.relevant.length > 0) {
    parts.push(`Relevant memories:\n${state.memories.relevant.map(m => `- ${m.fact}`).join('\n')}`);
  }

  return parts.join('\n');
}

export function getDeviceTimezone(): string {
  try {
    const calendars = getCalendars();
    if (calendars.length > 0 && calendars[0].timeZone) return calendars[0].timeZone;
  } catch {}
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function getDeviceLocale(): string {
  try {
    const locales = getLocales();
    if (locales.length > 0) return locales[0].languageTag;
  } catch {}
  return 'en-US';
}
