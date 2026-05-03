import { ClassificationResult, Intent } from '@/engines/router';

const KNOWLEDGE_INTENTS: Set<string> = new Set([
  'knowledge_weather', 'knowledge_country', 'knowledge_book',
  'knowledge_paper', 'knowledge_dictionary', 'knowledge_currency',
  'knowledge_holiday', 'knowledge_general',
]);

const TOOL_INTENTS: Set<string> = new Set([
  'calendar_query', 'calendar_create', 'contact_lookup',
  'reminder_create', 'reminder_list',
  'memory_query', 'memory_forget',
  'clipboard_read', 'clipboard_write', 'tts_speak',
]);

const DIRECT_INTENTS: Set<string> = new Set([
  'time_query', 'battery_query', 'device_query',
  'identity_query', 'limitations_query', 'math_query',
]);

export function isKnowledgeIntent(intent: string): boolean {
  return KNOWLEDGE_INTENTS.has(intent);
}

export function isToolIntent(intent: string): boolean {
  return TOOL_INTENTS.has(intent);
}

export function isDirectIntent(intent: string): boolean {
  return DIRECT_INTENTS.has(intent);
}

export function validateClassification(
  result: ClassificationResult,
  userMessage: string,
): ClassificationResult {
  if (!result || !result.intent) {
    return { intent: 'chat', needs_brain: true };
  }

  if (!VALID_INTENTS_SET.has(result.intent)) {
    return { intent: 'chat', needs_brain: true };
  }

  return result;
}

const VALID_INTENTS_SET: Set<string> = new Set([
  'time_query', 'battery_query', 'device_query',
  'identity_query', 'limitations_query',
  'calendar_query', 'calendar_create', 'contact_lookup',
  'reminder_create', 'reminder_list',
  'memory_query', 'memory_forget',
  'clipboard_read', 'clipboard_write', 'tts_speak',
  'math_query',
  'knowledge_weather', 'knowledge_country', 'knowledge_book',
  'knowledge_paper', 'knowledge_dictionary', 'knowledge_currency',
  'knowledge_holiday', 'knowledge_general',
  'factual_realtime', 'chat',
]);
