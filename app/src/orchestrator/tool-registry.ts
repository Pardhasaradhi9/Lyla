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
}
