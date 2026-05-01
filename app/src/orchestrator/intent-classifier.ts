/**
 * Intent Classifier — Minimal pattern-based routing
 *
 * Only classifies intents that need TypeScript handling
 * (DB operations, deflection). Everything else goes to the LLM.
 *
 * The Instruct model handles identity, greetings, farewells,
 * thanks, praise, etc. naturally via the system prompt.
 */

export type Intent = 'memory_query' | 'memory_forget' | 'time_query' | 'battery_query' | 'device_query' | 'identity_query' | 'limitations_query' | 'factual_realtime' | 'chat';

interface ClassificationResult {
  intent: Intent;
  confidence: 'high' | 'medium';
  normalized: string;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s?!.']/g, '')
    .replace(/\s+/g, ' ');
}

const PATTERNS: Array<{ intent: Intent; patterns: RegExp[]; confidence: 'high' | 'medium' }> = [
  {
    intent: 'memory_query',
    confidence: 'high',
    patterns: [
      /\bwhat\s+(?:do\s+)?(?:you|u)\s+(?:remember|know|recall)\s+(?:about\s+me|about\s+my)\b/,
      /\bwhat\s+(?:do\s+)?(?:you|u)\s+(?:remember|know)\b/,
      /\bdo\s+(?:you|u)\s+(?:remember|know|recall)\b/,
      /\blist\s+(?:my\s+)?memories\b/,
      /\bshow\s+(?:me\s+)?(?:my\s+)?memories\b/,
      /\bwhat\s+(?:do\s+)?(?:you|u)\s+know\s+about\s+me\b/,
      /\b(?:what\s+)?(?:my\s+)?(?:saved\s+)?(?:facts|memories|info)\s*(?:about\s+me)?\s*$/,
    ],
  },
  {
    intent: 'memory_forget',
    confidence: 'high',
    patterns: [
      /\bforget\s+(?:that|this|about|my|everything|all)\b/,
      /\bdelete\s+(?:that|this|my|all)\s*(?:memory|memories|info)?\b/,
      /\bremove\s+(?:that|this|my|all)\s*(?:memory|memories|info)?\b/,
      /\bdon'?t\s+remember\s+(?:that|this)\b/,
      /\bclear\s+(?:my\s+)?(?:memory|memories)\b/,
      /\breset\s+(?:my\s+)?(?:memory|memories)\b/,
      /\berase\s+(?:what\s+)?(?:you\s+)?(?:know|remember)\b/,
      /\bwipe\s+(?:your|my)\s+memory\b/,
      /\bforget\s+everything\b/,
    ],
  },
  {
    intent: 'time_query',
    confidence: 'high',
    patterns: [
      /\bwhat\s+time\s+(?:is\s+it|is\s+it\s+now|do\s+you\s+have)\b/,
      /\bwhat'?s?\s+the\s+time\b/,
      /\b(?:current|the)\s+time\b/,
      /\btell\s+me\s+the\s+time\b/,
      /\bwhat\s+date\s+(?:is\s+it|is\s+today)\b/,
      /\bwhat'?s?\s+the\s+date\b/,
      /\bwhat\s+day\s+(?:is\s+it|is\s+today)\b/,
      /\bwhat'?s?\s+today'?s?\s+(?:date|day)\b/,
      /\b(?:what\s+)?(?:is\s+)?today'?s?\s+(?:date|day)\b/,
      /\btime\s+(?:in|at|for)\s+\w+/,
    ],
  },
  {
    intent: 'battery_query',
    confidence: 'high',
    patterns: [
      /\bwhat'?s?\s+(?:my\s+)?battery\b/,
      /\bbattery\s+(?:level|status|percentage|life|charging)\b/,
      /\bhow\s+much\s+battery\b/,
      /\b(?:is\s+)?(?:my\s+)?(?:phone|device)\s+charging\b/,
      /\b(?:check|tell\s+me)\s+(?:the\s+)?battery\b/,
    ],
  },
  {
    intent: 'device_query',
    confidence: 'high',
    patterns: [
      /\bwhat\s+(?:phone|device)\s+(?:is\s+this|am\s+i\s+using)\b/,
      /\b(?:device|phone)\s+info(?:rmation)?\b/,
      /\bwhat'?s?\s+(?:my\s+)?(?:phone|device)\s+model\b/,
      /\btell\s+me\s+about\s+(?:my\s+)?(?:this\s+)?(?:phone|device)\b/,
      /\bwhat'?s?\s+(?:my\s+)?device\b/,
      /\b(?:what\s+)?(?:is\s+)?(?:this\s+)?(?:device|phone)\b/,
    ],
  },
  {
    intent: 'identity_query',
    confidence: 'high',
    patterns: [
      /\bwho\s+(?:are|r)\s+(?:you|u)\b/,
      /\bwhat'?s?\s+(?:your|ur)\s+name\b/,
      /\bwho\s+(?:made|created|built|developed)\s+(?:you|u|lyla)\b/,
      /\bwhat\s+(?:are|r)\s+(?:you|u)\b/,
      /\btell\s+me\s+about\s+(?:yourself|u)\b/,
      /\bwho\s+is\s+lyla\b/,
      /\b(?:are|r)\s+(?:you|u)\s+lyla\b/,
      /\bwhat\s+should\s+i\s+call\s+(?:you|u)\b/,
    ],
  },
  {
    intent: 'limitations_query',
    confidence: 'high',
    patterns: [
      /\bwhat\s+(?:are|r)\s+(?:your|ur)\s+(?:limitations?|limits?)\b/,
      /\bwhat\s+can'??t\s+(?:you|u)\s+do\b/,
      /\bwhat\s+(?:are|r)\s+(?:you|u)\s+(?:capable|able)\s+of\b/,
      /\bwhat\s+can\s+(?:you|u)\s+do\b/,
      /\b(?:do\s+)?what\s+(?:do\s+)?(?:you|u)\s+do\b/,
      /\b(?:your|ur)\s+(?:capabilities|features|abilities)\b/,
    ],
  },
  {
    intent: 'factual_realtime',
    confidence: 'medium',
    patterns: [
      /\b(?:weather|temperature|forecast)\s+(?:in|at|for|today|tomorrow|now)\b/,
      /\b(?:current|latest|today'?s?|live)\s+(?:price|cost|rate|score|news|update)\b/,
      /\b(?:stock|crypto|bitcoin|gold|silver)\s+price\b/,
      /\bhow\s+much\s+(?:is|does|are)\s+(?:a|the)\b.*?\b(?:cost|worth|price)\b/,
      /\b(?:score|result)\s+of\s+(?:the|today|yesterday|last)\b/,
      /\bwhat\s*(?:'s|is)\s+(?:happening|going\s+on)\s+(?:in|today|now)\b/,
      /\b(?:latest|breaking|recent|today'?s?)\s+news\b/,
      /\bwhat'?s?\s+(?:trending|viral)\b/,
    ],
  },
];

export function classifyIntent(message: string): ClassificationResult {
  const normalized = normalize(message);

  for (const { intent, patterns, confidence } of PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(normalized)) {
        return { intent, confidence, normalized };
      }
    }
  }

  return { intent: 'chat', confidence: 'medium', normalized };
}
