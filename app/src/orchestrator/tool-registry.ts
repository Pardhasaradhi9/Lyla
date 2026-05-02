export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  description: string;
}

export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute: (params?: Record<string, unknown>) => Promise<ToolResult>;
  requiresPermission: boolean;
  category: 'system' | 'personal' | 'network';
}

export interface ToolResult {
  success: boolean;
  data: string;
  metadata?: Record<string, unknown>;
}

const tools = new Map<string, Tool>();

export function registerTool(tool: Tool): void {
  tools.set(tool.name, tool);
}

export function getTool(name: string): Tool | undefined {
  return tools.get(name);
}

export function getAllTools(): Tool[] {
  return Array.from(tools.values());
}

export function getToolDescriptions(): string {
  return getAllTools()
    .map(t => `- ${t.name}: ${t.description}`)
    .join('\n');
}

export async function executeTool(name: string, params?: Record<string, unknown>): Promise<ToolResult> {
  const tool = tools.get(name);
  if (!tool) {
    return { success: false, data: `Unknown tool: ${name}` };
  }
  try {
    return await tool.execute(params);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[ToolRegistry] ${name} failed:`, msg);
    return { success: false, data: `Tool ${name} failed: ${msg}` };
  }
}

export function registerBuiltinTools(): void {
  registerTool({
    name: 'time_query',
    description: 'Get the current time and date, optionally for a specific timezone or city',
    parameters: [
      { name: 'timezone', type: 'string', required: false, description: 'Target timezone or city name' },
    ],
    requiresPermission: false,
    category: 'system',
    execute: async () => {
      const { handleTimeQuery } = await import('./device-handlers');
      return { success: true, data: handleTimeQuery('what time is it') };
    },
  });

  registerTool({
    name: 'battery_query',
    description: 'Get battery level, charging state, and low power mode status',
    parameters: [],
    requiresPermission: false,
    category: 'system',
    execute: async () => {
      const { handleBatteryQuery } = await import('./device-handlers');
      return { success: true, data: await handleBatteryQuery() };
    },
  });

  registerTool({
    name: 'device_query',
    description: 'Get device model, OS version, and device name',
    parameters: [],
    requiresPermission: false,
    category: 'system',
    execute: async () => {
      const { handleDeviceQuery } = await import('./device-handlers');
      return { success: true, data: handleDeviceQuery() };
    },
  });

  registerTool({
    name: 'memory_query',
    description: 'Search memories semantically for information about the user',
    parameters: [
      { name: 'query', type: 'string', required: true, description: 'What to search for' },
    ],
    requiresPermission: false,
    category: 'personal',
    execute: async (params) => {
      const { memoryEngine } = await import('@/engines/memory');
      const query = (params?.query as string) || '';
      const results = await memoryEngine.findSimilar(query, 10);
      if (results.length === 0) {
        return { success: true, data: 'No relevant memories found.' };
      }
      const list = results.map(m => `- ${m.fact}`).join('\n');
      return { success: true, data: list };
    },
  });

  registerTool({
    name: 'memory_save',
    description: 'Save a structured fact to memory for future recall',
    parameters: [
      { name: 'fact', type: 'string', required: true, description: 'The fact to save' },
      { name: 'entity', type: 'string', required: false, description: 'The main entity in the fact' },
      { name: 'category', type: 'string', required: false, description: 'Category: personal, preference, relationship, work, location, education' },
    ],
    requiresPermission: false,
    category: 'personal',
    execute: async (params) => {
      const { memoryEngine } = await import('@/engines/memory');
      const fact = params?.fact as string;
      const entity = params?.entity as string | undefined;
      const category = params?.category as string | undefined;
      await memoryEngine.addMemory(fact, entity, category);
      return { success: true, data: `Saved: ${fact}` };
    },
  });

  registerTool({
    name: 'memory_forget',
    description: 'Delete a memory that matches the given query',
    parameters: [
      { name: 'query', type: 'string', required: true, description: 'Description of what to forget' },
    ],
    requiresPermission: false,
    category: 'personal',
    execute: async (params) => {
      const { memoryEngine } = await import('@/engines/memory');
      const query = (params?.query as string) || '';
      const similar = await memoryEngine.findSimilar(query, 1);
      if (similar.length > 0) {
        await memoryEngine.deleteMemory(similar[0].id);
        return { success: true, data: `Forgotten: ${similar[0].fact}` };
      }
      return { success: false, data: 'No matching memory found.' };
    },
  });

  registerTool({
    name: 'clipboard_read',
    description: 'Read the current contents of the device clipboard',
    parameters: [],
    requiresPermission: false,
    category: 'personal',
    execute: async () => {
      const Clipboard = await import('expo-clipboard');
      const hasContent = await Clipboard.default.hasStringAsync();
      if (!hasContent) {
        return { success: true, data: 'The clipboard is empty.' };
      }
      const content = await Clipboard.default.getStringAsync();
      const preview = content.length > 500 ? content.slice(0, 500) + '...' : content;
      return { success: true, data: preview };
    },
  });

  registerTool({
    name: 'clipboard_write',
    description: 'Write text to the device clipboard',
    parameters: [
      { name: 'text', type: 'string', required: true, description: 'The text to copy to clipboard' },
    ],
    requiresPermission: false,
    category: 'personal',
    execute: async (params) => {
      const Clipboard = await import('expo-clipboard');
      const text = (params?.text as string) || '';
      if (!text) {
        return { success: false, data: 'No text provided to copy.' };
      }
      await Clipboard.default.setStringAsync(text);
      return { success: true, data: `Copied to clipboard: "${text.slice(0, 80)}${text.length > 80 ? '...' : ''}"` };
    },
  });

  registerTool({
    name: 'tts_speak',
    description: 'Read text aloud using the device text-to-speech engine',
    parameters: [
      { name: 'text', type: 'string', required: true, description: 'The text to speak aloud' },
    ],
    requiresPermission: false,
    category: 'system',
    execute: async (params) => {
      const { speak } = await import('@/engines/tts');
      const text = (params?.text as string) || '';
      if (!text) {
        return { success: false, data: 'No text provided to speak.' };
      }
      speak(text);
      return { success: true, data: `Speaking: "${text.slice(0, 60)}${text.length > 60 ? '...' : ''}"` };
    },
  });

  registerTool({
    name: 'calendar_query',
    description: 'Read today\'s calendar events and upcoming schedule',
    parameters: [
      { name: 'days', type: 'number', required: false, description: 'Number of upcoming days to show (default: 0 for today only)' },
    ],
    requiresPermission: true,
    category: 'personal',
    execute: async (params) => {
      const { getTodayEvents, getUpcomingEvents } = await import('@/tools/calendar-tool');
      const days = (params?.days as number) || 0;
      if (days > 0) {
        const upcoming = await getUpcomingEvents(days);
        return { success: true, data: upcoming || 'No upcoming events.' };
      }
      return { success: true, data: await getTodayEvents() };
    },
  });

  registerTool({
    name: 'calendar_create',
    description: 'Create a new calendar event with title, date/time, and optional location',
    parameters: [
      { name: 'title', type: 'string', required: true, description: 'Event title' },
      { name: 'startDate', type: 'string', required: true, description: 'ISO date string or natural language like "tomorrow at 3pm"' },
      { name: 'durationMinutes', type: 'number', required: false, description: 'Duration in minutes (default: 60)' },
      { name: 'location', type: 'string', required: false, description: 'Event location' },
    ],
    requiresPermission: true,
    category: 'personal',
    execute: async (params) => {
      const { createEvent } = await import('@/tools/calendar-tool');
      const title = (params?.title as string) || 'New Event';
      const startDateStr = params?.startDate as string;
      const duration = (params?.durationMinutes as number) || 60;
      const location = params?.location as string | undefined;

      let startDate: Date;
      try {
        startDate = new Date(startDateStr);
        if (isNaN(startDate.getTime())) throw new Error('Invalid date');
      } catch {
        return { success: false, data: `Couldn't parse the date "${startDateStr}". Try something like "tomorrow at 3pm".` };
      }

      const endDate = new Date(startDate.getTime() + duration * 60000);
      return { success: true, data: await createEvent(title, startDate, endDate, location) };
    },
  });

  registerTool({
    name: 'contact_lookup',
    description: 'Search contacts by name and return phone number, email, and birthday',
    parameters: [
      { name: 'name', type: 'string', required: true, description: 'Contact name to search for' },
    ],
    requiresPermission: true,
    category: 'personal',
    execute: async (params) => {
      const { lookupContact } = await import('@/tools/contacts-tool');
      const name = (params?.name as string) || '';
      if (!name) return { success: false, data: 'No name provided.' };
      return { success: true, data: await lookupContact(name) };
    },
  });

  registerTool({
    name: 'reminder_create',
    description: 'Schedule a reminder notification at a specific time',
    parameters: [
      { name: 'text', type: 'string', required: true, description: 'What to remind about' },
      { name: 'time', type: 'string', required: true, description: 'When to remind (e.g. "5pm", "in 30 minutes")' },
    ],
    requiresPermission: true,
    category: 'personal',
    execute: async (params) => {
      const { createReminder } = await import('@/tools/reminder-tool');
      const text = (params?.text as string) || '';
      const timeStr = (params?.time as string) || '';
      if (!text || !timeStr) return { success: false, data: 'Need both reminder text and time.' };

      const triggerDate = parseReminderTime(timeStr);
      if (!triggerDate) return { success: false, data: `Couldn't parse "${timeStr}" as a time. Try "at 5pm" or "in 30 minutes".` };

      return { success: true, data: await createReminder(text, triggerDate) };
    },
  });

  registerTool({
    name: 'reminder_list',
    description: 'List all active scheduled reminders',
    parameters: [],
    requiresPermission: false,
    category: 'personal',
    execute: async () => {
      const { listReminders } = await import('@/tools/reminder-tool');
      return { success: true, data: await listReminders() };
    },
  });
}

function parseReminderTime(input: string): Date | null {
  const now = new Date();
  const lower = input.toLowerCase().trim();

  const inMatch = lower.match(/^in\s+(\d+)\s*(min|minute|minutes|hr|hour|hours|sec|second|seconds)/);
  if (inMatch) {
    const amount = parseInt(inMatch[1], 10);
    const unit = inMatch[2];
    if (unit.startsWith('min')) return new Date(now.getTime() + amount * 60000);
    if (unit.startsWith('hr') || unit.startsWith('hour')) return new Date(now.getTime() + amount * 3600000);
    if (unit.startsWith('sec')) return new Date(now.getTime() + amount * 1000);
  }

  const timeMatch = lower.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const ampm = timeMatch[3]?.toLowerCase();

    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;

    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    return target;
  }

  if (lower.includes('tomorrow')) {
    const timeInTomorrow = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(timeInTomorrow ? parseInt(timeInTomorrow[1], 10) + (timeInTomorrow[3]?.toLowerCase() === 'pm' ? 12 : 0) : 9, timeInTomorrow?.[2] ? parseInt(timeInTomorrow[2], 10) : 0, 0);
    return tomorrow;
  }

  return null;
}
