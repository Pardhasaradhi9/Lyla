import { initLlama, LlamaContext } from 'llama.rn';
import { ROUTER_SYSTEM_PROMPT } from '@/prompts/router-prompt';
import { EXTRACTOR_SYSTEM_PROMPT } from '@/prompts/extractor-prompt';

const ROUTER_CONFIG = {
  n_ctx: 1024,
  n_gpu_layers: 99,
  n_batch: 256,
  use_mlock: true,
  use_mmap: true,
  cache_type_k: 'q8_0',
  cache_type_v: 'q8_0',
  max_tokens: 128,
  temperature: 0.1,
  top_k: 10,
  penalty_repeat: 1.05,
} as const;

export type Intent =
  | 'time_query' | 'battery_query' | 'device_query'
  | 'identity_query' | 'limitations_query'
  | 'calendar_query' | 'calendar_create'
  | 'contact_lookup'
  | 'reminder_create' | 'reminder_list'
  | 'memory_query' | 'memory_forget'
  | 'clipboard_read' | 'clipboard_write'
  | 'tts_speak'
  | 'knowledge_weather' | 'knowledge_country' | 'knowledge_book'
  | 'knowledge_paper' | 'knowledge_dictionary' | 'knowledge_currency'
  | 'knowledge_holiday' | 'knowledge_general'
  | 'factual_realtime'
  | 'chat';

export const VALID_INTENTS: Set<string> = new Set<Intent>([
  'time_query', 'battery_query', 'device_query',
  'identity_query', 'limitations_query',
  'calendar_query', 'calendar_create',
  'contact_lookup',
  'reminder_create', 'reminder_list',
  'memory_query', 'memory_forget',
  'clipboard_read', 'clipboard_write',
  'tts_speak',
  'knowledge_weather', 'knowledge_country', 'knowledge_book',
  'knowledge_paper', 'knowledge_dictionary', 'knowledge_currency',
  'knowledge_holiday', 'knowledge_general',
  'factual_realtime',
  'chat',
]);

export interface ClassificationResult {
  intent: Intent;
  needs_brain: boolean;
}

export const routerEngine = {
  isLoaded: false,
  context: null as LlamaContext | null,

  async init(modelPath: string): Promise<void> {
    if (this.context) {
      await this.release();
    }

    try {
      this.context = await initLlama({
        model: modelPath,
        use_mlock: ROUTER_CONFIG.use_mlock,
        n_ctx: ROUTER_CONFIG.n_ctx,
        n_gpu_layers: ROUTER_CONFIG.n_gpu_layers,
      });
      this.isLoaded = true;
    } catch (error) {
      console.error('[RouterEngine] Failed to load:', error);
      throw error;
    }
  },

  async classify(userMessage: string): Promise<ClassificationResult> {
    if (!this.context) {
      return { intent: 'chat', needs_brain: false };
    }

    const prompt = `<|im_start|>system\n${ROUTER_SYSTEM_PROMPT}<|im_end|>\n<|im_start|>user\n${userMessage}<|im_end|>\n<|im_start|>assistant\n`;

    try {
      const result = await this.context.completion(
        {
          prompt,
          n_predict: ROUTER_CONFIG.max_tokens,
          temperature: ROUTER_CONFIG.temperature,
          top_k: ROUTER_CONFIG.top_k,
          penalty_repeat: ROUTER_CONFIG.penalty_repeat,
          stop: ['<|im_end|>', '<|im_start|>', '\n\n'],
        },
        () => {},
      );

      const text = result.text.trim();
      return parseClassification(text);
    } catch (error) {
      console.error('[RouterEngine] Classification error:', error);
      return { intent: 'chat', needs_brain: false };
    }
  },

  async extractFacts(
    userMessage: string,
    assistantResponse: string,
  ): Promise<Array<{ fact: string; category: string; entity: string | null }>> {
    if (!this.context) return [];

    const prompt = `<|im_start|>system\n${EXTRACTOR_SYSTEM_PROMPT}<|im_end|>\n<|im_start|>user\nUser said: "${userMessage}"\nAssistant replied: "${assistantResponse}"<|im_end|>\n<|im_start|>assistant\n`;

    try {
      const result = await this.context.completion(
        {
          prompt,
          n_predict: ROUTER_CONFIG.max_tokens,
          temperature: 0.1,
          top_k: 10,
          penalty_repeat: ROUTER_CONFIG.penalty_repeat,
          stop: ['<|im_end|>', '<|im_start|>'],
        },
        () => {},
      );

      const text = result.text.trim();
      return parseExtractorOutput(text);
    } catch (error) {
      console.error('[RouterEngine] Extraction error:', error);
      return [];
    }
  },

  async release(): Promise<void> {
    if (this.context) {
      await this.context.release();
      this.context = null;
    }
    this.isLoaded = false;
  },
};

function parseClassification(text: string): ClassificationResult {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { intent: 'chat', needs_brain: false };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const intent = String(parsed.intent ?? 'chat');
    const needsBrain = parsed.needs_brain === true;

    if (VALID_INTENTS.has(intent)) {
      return { intent: intent as Intent, needs_brain: needsBrain };
    }

    return { intent: 'chat', needs_brain: false };
  } catch {
    return { intent: 'chat', needs_brain: false };
  }
}

function parseExtractorOutput(
  text: string,
): Array<{ fact: string; category: string; entity: string | null }> {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item: unknown) =>
          typeof item === 'object' &&
          item !== null &&
          'fact' in (item as Record<string, unknown>) &&
          'category' in (item as Record<string, unknown>),
      )
      .map((item: Record<string, unknown>) => ({
        fact: String(item.fact),
        category: String(item.category),
        entity: item.entity ? String(item.entity) : null,
      }));
  } catch {
    return [];
  }
}
