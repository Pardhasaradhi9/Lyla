export interface RouterDecision {
  action: 'direct' | 'tool' | 'escalate';
  answer?: string;
  tool?: string;
  params?: Record<string, unknown>;
  confidence?: number;
}

const ESCALATE_PATTERNS: RegExp[] = [
  /\b(?:write|compose|draft|create)\b.*\b(?:poem|story|song|letter|email|text|message|essay|article)\b/i,
  /\b(?:help|assist)\s+me\s+(?:write|create|compose|draft|make|build)\b/i,
  /\b(?:explain|describe|analyze|compare|contrast|evaluate|discuss)\b/i,
  /\b(?:why|how)\s+(?:is|are|do|does|can|should|would|could|did)\b/i,
  /\b(?:what|tell me)\s+(?:do you|is your)\s+(?:think|feel|believe|opinion)\b/i,
  /\b(?:summarize|summarise|paraphrase|rewrite|rephrase|improve)\b/i,
  /\b(?:recommend|suggest)\b/i,
  /\b(?:opinion|perspective|viewpoint|stance)\b/i,
  /\b(?:pros and cons|advantages|disadvantages)\b/i,
  /\b(?:meaning of|philosophy|purpose of)\b/i,
  /\btell me about\b/i,
  /\b(?:what if|imagine|suppose)\b/i,
];

const MAX_DIRECT_WORDS = 15;

export function validateRouterDecision(
  decision: RouterDecision,
  userMessage: string,
): RouterDecision {
  if (!decision || !decision.action) {
    return { action: 'escalate' };
  }

  if (decision.action === 'escalate') {
    return decision;
  }

  const wordCount = userMessage.trim().split(/\s+/).length;

  if (wordCount > MAX_DIRECT_WORDS) {
    return { action: 'escalate' };
  }

  for (const pattern of ESCALATE_PATTERNS) {
    if (pattern.test(userMessage)) {
      return { action: 'escalate' };
    }
  }

  if (decision.action === 'direct') {
    if (!decision.answer || decision.answer.trim().length === 0) {
      return { action: 'escalate' };
    }
  }

  if (decision.action === 'tool') {
    if (!decision.tool || decision.tool.trim().length === 0) {
      return { action: 'escalate' };
    }
  }

  return decision;
}
