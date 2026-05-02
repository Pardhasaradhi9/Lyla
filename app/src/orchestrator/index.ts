import { classifyIntent, type Intent } from './intent-classifier';
import { getFactualGuardResponse } from './factual-guard';
import { getIdentityResponse } from './identity-handler';
import { handleTimeQuery, handleBatteryQuery, handleDeviceQuery } from './device-handlers';
import { formatModelResponse, formatStreamingToken } from './response-formatter';
import { executeTool, registerBuiltinTools } from './tool-registry';
import { buildSystemState, formatSystemStateForPrompt } from './system-state';
import { extractFacts } from './fact-extractor';
import { validateRouterDecision, type RouterDecision } from './router-guardrails';
import { useAppStore } from '@/stores/app-store';

export interface OrchestratorResult {
  response: string;
  handledBy: 'factual_guard' | 'model' | 'memory' | 'system' | 'tool';
  intent: Intent;
  wasStreamed: boolean;
}

export interface OrchestratorConfig {
  streamCompletion: (
    messages: Array<{ role: string; content: string }>,
    onToken: (token: string) => void,
  ) => Promise<string>;
  isModelReady: () => boolean;
  isRouterReady: () => boolean;
  routerClassify: (message: string) => Promise<RouterDecision>;
  swapToBrain: () => Promise<void>;
  swapToRouter: () => Promise<void>;
  llmExtractFacts: (userMsg: string, assistantMsg: string) => Promise<Array<{ fact: string; category: string; entity: string | null }>>;
}

function sysResponse(response: string, intent: Intent, t0: number): OrchestratorResult {
  return { response, handledBy: 'system', intent, wasStreamed: false };
}

export function createOrchestrator(config: OrchestratorConfig) {
  registerBuiltinTools();

  return {
    async processMessage(
      userMessage: string,
      conversationHistory: Array<{ role: string; content: string }>,
      onToken?: (token: string) => void,
    ): Promise<OrchestratorResult> {

      const t0 = Date.now();

      // ── 1. CLASSIFY ─────────────────────────────────────────────
      const { intent } = classifyIntent(userMessage);
      const t1 = Date.now();

      // ── 2. ROUTE: Direct handlers (0ms LLM) ────────────────────

      if (intent === 'time_query') {
        return sysResponse(handleTimeQuery(userMessage), intent, t0);
      }

      if (intent === 'battery_query') {
        return sysResponse(await handleBatteryQuery(), intent, t0);
      }

      if (intent === 'device_query') {
        return sysResponse(handleDeviceQuery(), intent, t0);
      }

      if (intent === 'identity_query') {
        return sysResponse(getIdentityResponse(intent)!, intent, t0);
      }

      if (intent === 'limitations_query') {
        return sysResponse(getIdentityResponse('limitations')!, intent, t0);
      }

      // ── 3. ROUTE: Memory tools ─────────────────────────────────

      if (intent === 'memory_query') {
        const result = await executeTool('memory_query', { query: userMessage });
        return { response: result.data, handledBy: 'memory', intent, wasStreamed: false };
      }

      if (intent === 'memory_forget') {
        const result = await executeTool('memory_forget', { query: userMessage });
        return {
          response: result.success ? result.data : "I couldn't find that memory. Ask 'what do you remember about me?' to see stored memories.",
          handledBy: 'memory',
          intent,
          wasStreamed: false,
        };
      }

      // ── 3b. ROUTE: Clipboard tools ────────────────────────────────

      if (intent === 'clipboard_read') {
        const result = await executeTool('clipboard_read');
        if (result.data === 'The clipboard is empty.') {
          return { response: result.data, handledBy: 'tool', intent, wasStreamed: false };
        }
        const hasSummarize = /\b(summarize|summarise|explain|what does|what does this mean)\b/i.test(userMessage);
        if (hasSummarize && config.isModelReady()) {
          const { SYSTEM_PROMPT } = await import('@/utils/system-prompt');
          const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `I copied this text. Please summarize or explain it:\n\n${result.data}` },
          ];
          try {
            let raw = '';
            raw = await config.streamCompletion(messages, onToken ? (t) => { const c = formatStreamingToken(t); if (c) onToken(c); } : () => {});
            const { response } = formatModelResponse(raw);
            return { response, handledBy: 'model', intent, wasStreamed: true };
          } catch {
            return { response: result.data, handledBy: 'tool', intent, wasStreamed: false };
          }
        }
        return { response: `Here's what's on your clipboard:\n\n${result.data}`, handledBy: 'tool', intent, wasStreamed: false };
      }

      if (intent === 'clipboard_write') {
        const history = conversationHistory;
        let lastAssistantMsg = '';
        for (let i = history.length - 1; i >= 0; i--) {
          if (history[i].role === 'assistant') {
            lastAssistantMsg = history[i].content;
            break;
          }
        }
        const textToCopy = lastAssistantMsg || userMessage.replace(/\bcopy\s+/i, '').replace(/\bto\s+clipboard\b/i, '').trim();
        const result = await executeTool('clipboard_write', { text: textToCopy });
        return { response: result.success ? "Done! I've copied that to your clipboard." : result.data, handledBy: 'tool', intent, wasStreamed: false };
      }

      // ── 3c. ROUTE: TTS tool ───────────────────────────────────────

      if (intent === 'tts_speak') {
        const history = conversationHistory;
        let lastAssistantMsg = '';
        for (let i = history.length - 1; i >= 0; i--) {
          if (history[i].role === 'assistant') {
            lastAssistantMsg = history[i].content;
            break;
          }
        }
        if (!lastAssistantMsg) {
          return { response: "I don't have a previous response to read back yet!", handledBy: 'tool', intent, wasStreamed: false };
        }
        const result = await executeTool('tts_speak', { text: lastAssistantMsg });
        return { response: result.success ? "Reading it back to you now..." : result.data, handledBy: 'tool', intent, wasStreamed: false };
      }

      // ── 3d. ROUTE: Calendar tools ─────────────────────────────────

      if (intent === 'calendar_query') {
        const days = /\b(?:upcoming|next|this\s+week)\b/i.test(userMessage) ? 7 : 0;
        const result = await executeTool('calendar_query', { days });
        return { response: result.data, handledBy: 'tool', intent, wasStreamed: false };
      }

      if (intent === 'calendar_create') {
        const titleMatch = userMessage.match(/(?:meeting|event|appointment)(?:\s+(?:with|for|about))?\s+(.+?)(?:\s+(?:tomorrow|today|at|on|next)\b|$)/i);
        const title = titleMatch?.[1]?.trim() || userMessage.replace(/^(?:add|create|schedule|put)\s+(?:a\s+)?/i, '').trim();

        const timeStr = extractTimeFromMessage(userMessage);
        if (!timeStr) {
          return { response: "I'd love to create that event, but I need to know when. Can you tell me the date and time? For example: 'Add meeting with Sarah tomorrow at 3pm'", handledBy: 'tool', intent, wasStreamed: false };
        }

        const result = await executeTool('calendar_create', { title, startDate: timeStr.toISOString(), durationMinutes: 60 });
        return { response: result.data, handledBy: 'tool', intent, wasStreamed: false };
      }

      // ── 3e. ROUTE: Contacts tool ───────────────────────────────────

      if (intent === 'contact_lookup') {
        const nameMatch = userMessage.match(/(?:phone|number|email|birthday|contact|info)\s+(?:for|of|is\s+)?\s*(\w+(?:\s+\w+)?)/i)
          || userMessage.match(/(\w+)'s\s+(?:phone|number|email|birthday|contact)/i);
        const name = nameMatch?.[1]?.trim() || '';
        if (!name) {
          return { response: "Who should I look up? Tell me a name and I'll search your contacts.", handledBy: 'tool', intent, wasStreamed: false };
        }
        const result = await executeTool('contact_lookup', { name });
        return { response: result.data, handledBy: 'tool', intent, wasStreamed: false };
      }

      // ── 3f. ROUTE: Reminders tools ─────────────────────────────────

      if (intent === 'reminder_create') {
        const textMatch = userMessage.match(/remind\s+me\s+(?:to|about)\s+(.+?)(?:\s+(?:at|in|by|on)\b|$)/i)
          || userMessage.match(/(?:set\s+(?:a\s+)?reminder|notify\s+me)\s+(?:to|about)?\s*(.+?)(?:\s+(?:at|in|by|on)\b|$)/i);
        const text = textMatch?.[1]?.trim() || '';
        const timeMatch = userMessage.match(/(?:at|in|by)\s+(.+?)$/i);
        const timeStr = timeMatch?.[1]?.trim() || '';

        if (!text) {
          return { response: "What should I remind you about? Try: 'Remind me to call mom at 5pm'", handledBy: 'tool', intent, wasStreamed: false };
        }
        if (!timeStr) {
          return { response: "When should I remind you? Try: 'Remind me to call mom at 5pm' or 'Remind me to buy milk in 30 minutes'", handledBy: 'tool', intent, wasStreamed: false };
        }

        const result = await executeTool('reminder_create', { text, time: timeStr });
        return { response: result.data, handledBy: 'tool', intent, wasStreamed: false };
      }

      if (intent === 'reminder_list') {
        const result = await executeTool('reminder_list');
        return { response: result.data, handledBy: 'tool', intent, wasStreamed: false };
      }

      // ── 4. ROUTE: Factual guard (until web search) ─────────────

      if (intent === 'factual_realtime') {
        const online = useAppStore.getState().isOnline;
        return { response: getFactualGuardResponse(userMessage, online), handledBy: 'factual_guard', intent, wasStreamed: false };
      }

      // ── 4b. ROUTE: 350M Router (classifier-only, guarded) ──────

      if (intent === 'chat' && config.isRouterReady()) {
        try {
          const rawDecision = await config.routerClassify(userMessage);
          const decision = validateRouterDecision(rawDecision, userMessage);
          console.log(`[Orchestrator] Router: raw=${rawDecision.action} guarded=${decision.action}`);

          if (decision.action === 'direct' && decision.answer) {
            autoExtractFacts(userMessage, decision.answer);
            return { response: decision.answer, handledBy: 'system', intent, wasStreamed: false };
          }

          if (decision.action === 'tool' && decision.tool) {
            try {
              const result = await executeTool(decision.tool, decision.params ?? {});
              autoExtractFacts(userMessage, result.data);
              return { response: result.data, handledBy: 'tool', intent, wasStreamed: false };
            } catch {
              // Tool execution failed, fall through to Brain
            }
          }
        } catch (e) {
          console.warn('[Orchestrator] Router failed, falling back to Brain:', e);
        }
      }

      // ── 5. REASON: Complex query → Brain with system state ─────

      if (!config.isModelReady()) {
        return { response: "I'm still loading up — give me a moment and try again!", handledBy: 'model', intent, wasStreamed: false };
      }

      let relevantMemories: Array<{ fact: string; category: string | null; entity: string | null }> = [];
      let totalMemoryCount = 0;
      const t2 = t1;

      try {
        const { memoryEngine } = await import('@/engines/memory');
        relevantMemories = (await memoryEngine.findSimilar(userMessage)).map(m => ({
          fact: m.fact,
          category: m.category,
          entity: m.entity,
        }));
        const allMems = await memoryEngine.getAllMemories();
        totalMemoryCount = allMems.length;
      } catch (e) {
        console.warn('[Orchestrator] Memory search skipped:', e);
      }

      const t3 = Date.now();
      const systemState = await buildSystemState(relevantMemories, totalMemoryCount);
      const stateString = formatSystemStateForPrompt(systemState);

      const { SYSTEM_PROMPT } = await import('@/utils/system-prompt');
      const systemPrompt = SYSTEM_PROMPT + '\n\n[SYSTEM STATE]\n' + stateString + '\n[/SYSTEM STATE]';

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: userMessage },
      ];

      let rawResponse = '';
      const streamCallback = onToken
        ? (token: string) => {
            const cleanToken = formatStreamingToken(token);
            if (cleanToken) onToken(cleanToken);
          }
        : (_token: string) => {};

      try {
        rawResponse = await config.streamCompletion(messages, streamCallback);
      } catch (error) {
        console.error('[Orchestrator] LLM completion failed:', error);
        return { response: "Something went wrong. Could you try again?", handledBy: 'model', intent, wasStreamed: false };
      }

      const t4 = Date.now();
      const { response } = formatModelResponse(rawResponse);

      // ── 6. LEARN: Auto-extract facts from the conversation ─────
      autoExtractFacts(userMessage, response, config.llmExtractFacts);

      const t5 = Date.now();
      console.log(`[Orchestrator] Timing: classify=${t1 - t0}ms mem=${t3 - t2}ms state=${t4 - t3}ms llm+format=${t5 - t4}ms total=${t5 - t0}ms intent=${intent}`);

      return { response, handledBy: 'model', intent, wasStreamed: true };
    },
  };
}

type FactExtractorFn = (userMsg: string, assistantMsg: string) => Promise<Array<{ fact: string; category: string; entity: string | null }>>;

function autoExtractFacts(userMessage: string, assistantResponse: string, llmExtractor?: FactExtractorFn): void {
  try {
    const facts = extractFacts(userMessage);
    if (facts.length === 0 && llmExtractor) {
      llmExtractor(userMessage, assistantResponse)
        .then((llmFacts) => {
          if (llmFacts.length === 0) return;
          import('@/engines/memory').then(({ memoryEngine }) => {
            for (const fact of llmFacts.slice(0, 3)) {
              memoryEngine.addMemory(fact.fact, fact.entity ?? undefined, fact.category).catch(() => {});
            }
          }).catch(() => {});
        })
        .catch(() => {});
      return;
    }
    if (facts.length === 0) return;

    import('@/engines/memory').then(({ memoryEngine }) => {
      for (const fact of facts.slice(0, 3)) {
        memoryEngine.addMemory(fact.fact, fact.entity || undefined, fact.category).catch(() => {});
      }
    }).catch(() => {});
  } catch {}
}

function extractTimeFromMessage(message: string): Date | null {
  const now = new Date();
  const lower = message.toLowerCase();

  if (lower.includes('tomorrow')) {
    const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      if (timeMatch[3]?.toLowerCase() === 'pm' && h < 12) h += 12;
      if (timeMatch[3]?.toLowerCase() === 'am' && h === 12) h = 0;
      tomorrow.setHours(h, m, 0);
    } else {
      tomorrow.setHours(9, 0, 0);
    }
    return tomorrow;
  }

  const todayMatch = lower.match(/(?:today\s+)?(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (todayMatch) {
    let h = parseInt(todayMatch[1], 10);
    const m = todayMatch[2] ? parseInt(todayMatch[2], 10) : 0;
    if (todayMatch[3]?.toLowerCase() === 'pm' && h < 12) h += 12;
    if (todayMatch[3]?.toLowerCase() === 'am' && h === 12) h = 0;
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    return target;
  }

  const inMatch = lower.match(/in\s+(\d+)\s*(min|minute|hour|hr)/i);
  if (inMatch) {
    const amount = parseInt(inMatch[1], 10);
    const unit = inMatch[2].toLowerCase();
    const ms = unit.startsWith('hour') || unit.startsWith('hr') ? 3600000 : 60000;
    return new Date(now.getTime() + amount * ms);
  }

  if (lower.includes('today')) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
  }

  return null;
}

export type Orchestrator = ReturnType<typeof createOrchestrator>;
