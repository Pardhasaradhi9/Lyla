import weightsRaw from './router_weights.json';

export type Intent =
  | 'time_query' | 'battery_query' | 'device_query'
  | 'identity_query' | 'limitations_query'
  | 'calendar_query' | 'calendar_create'
  | 'contact_lookup'
  | 'reminder_create' | 'reminder_list'
  | 'memory_query' | 'memory_forget'
  | 'clipboard_read' | 'clipboard_write'
  | 'tts_speak'
  | 'math_query'
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
  'math_query',
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

const weights = weightsRaw as any;

export const routerEngine = {
  isLoaded: false,

  async init(modelPath: string): Promise<void> {
    // With FastText-lite, weights are baked into the JS bundle. Load is instantaneous.
    this.isLoaded = true;
    console.log('[RouterEngine] FastText-Lite loaded instantly.');
  },

  async classify(userMessage: string): Promise<ClassificationResult> {
    if (!this.isLoaded) {
      return { intent: 'chat', needs_brain: true };
    }

    const text = userMessage.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const tokens = text.split(/\s+/);

    let bestIntent = 'chat';
    let maxScore = -Infinity;

    for (const intent of Object.keys(weights.classes)) {
      let score = weights.classes[intent].prior;
      for (const token of tokens) {
        if (weights.classes[intent].word_probs[token] !== undefined) {
          score += weights.classes[intent].word_probs[token];
        } else {
          // Unseen word penalty (approx 1 / vocab_size)
          score += Math.log(1 / (weights.vocab.length + 100));
        }
      }

      if (score > maxScore) {
        maxScore = score;
        bestIntent = intent;
      }
    }

    // Default to chat if score is extremely low (meaning completely unknown vocab)
    if (maxScore < -50 && bestIntent !== 'chat') {
      bestIntent = 'chat';
    }

    // Determine if it needs brain based on intent
    const needsBrain = ['chat', 'factual_realtime', 'knowledge_general'].includes(bestIntent) || 
                       bestIntent.startsWith('knowledge_');

    console.log(`[RouterEngine] FastText classified: ${bestIntent} (Score: ${maxScore.toFixed(2)})`);

    return { 
      intent: bestIntent as Intent, 
      needs_brain: needsBrain 
    };
  },

  async extractFacts(
    userMessage: string,
    assistantResponse: string,
  ): Promise<Array<{ fact: string; category: string; entity: string | null }>> {
    // Stubbed. Real extraction moved to extractor.ts in Phase 4.
    return [];
  },

  async release(): Promise<void> {
    this.isLoaded = false;
  },
};
