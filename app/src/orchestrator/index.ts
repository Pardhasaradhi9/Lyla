import { getFactualGuardResponse } from './factual-guard';
import { getIdentityResponse } from './identity-handler';
import { handleTimeQuery, handleBatteryQuery, handleDeviceQuery } from './device-handlers';
import { handleMathQuery } from './math-handler';
import { formatModelResponse, formatStreamingToken } from './response-formatter';
import { executeTool, registerBuiltinTools } from './tool-registry';
import { buildSystemState, formatSystemStateForPrompt } from './system-state';
import { extractFacts } from './fact-extractor';
import { validateClassification, isKnowledgeIntent, isToolIntent } from './router-guardrails';
import { queryKnowledge, formatKnowledgeForBrain, type KnowledgeIntent } from '@/knowledge/hub';
import { postProcessCitations } from '@/knowledge/formatter';
import { type ClassificationResult, type Intent } from '@/engines/router';
import { useAppStore } from '@/stores/app-store';

export interface OrchestratorResult {
  response: string;
  handledBy: 'factual_guard' | 'model' | 'memory' | 'system' | 'tool' | 'knowledge';
  intent: Intent;
  wasStreamed: boolean;
}

export interface OrchestratorConfig {
  streamCompletion: (
    messages: Array<{ role: string; content: string }>,
    onToken: (token: string) => void,
    systemPrompt?: string,
  ) => Promise<string>;
  isModelReady: () => boolean;
  isRouterReady: () => boolean;
  routerClassify: (message: string) => Promise<ClassificationResult>;
  swapToBrain: () => Promise<void>;
  swapToRouter: () => Promise<void>;
  llmExtractFacts: (userMsg: string, assistantMsg: string) => Promise<Array<{ fact: string; category: string; entity: string | null }>>;
  knowledgeEnabled: () => boolean;
}

function sysResponse(response: string, intent: Intent): OrchestratorResult {
  return { response, handledBy: 'system', intent, wasStreamed: false };
}

export function createOrchestrator(config: OrchestratorConfig) {
  registerBuiltinTools();

  return {
    async processMessage(
      userMessage: string,
      conversationHistory: Array<{ role: string; content: string }>,
      onToken?: (token: string) => void,
      options?: { knowledgeActive?: boolean },
    ): Promise<OrchestratorResult> {

      const t0 = Date.now();

      // ── 1. CLASSIFY ──────────────────────────────────────────────

      let classification: ClassificationResult;

      if (config.isRouterReady()) {
        const raw = await config.routerClassify(userMessage);
        classification = validateClassification(raw, userMessage);
      } else {
        classification = { intent: 'chat', needs_brain: false };
      }

      const { intent, needs_brain } = classification;
      const t1 = Date.now();
      console.log(`[Orchestrator] Intent: ${intent} | needs_brain: ${needs_brain} | classify: ${t1 - t0}ms`);

      // ── 2. DIRECT HANDLERS (no model) ────────────────────────────

      if (intent === 'time_query') return sysResponse(handleTimeQuery(userMessage), intent);
      if (intent === 'battery_query') return sysResponse(await handleBatteryQuery(), intent);
      if (intent === 'device_query') return sysResponse(handleDeviceQuery(), intent);
      if (intent === 'identity_query') return sysResponse(getIdentityResponse(intent)!, intent);
      if (intent === 'limitations_query') return sysResponse(getIdentityResponse('limitations')!, intent);
      if (intent === 'math_query') return sysResponse(handleMathQuery(userMessage), intent);

      // ── 3. FACTUAL GUARD ─────────────────────────────────────────

      if (intent === 'factual_realtime') {
        if (config.isModelReady()) {
          return await handleBrain(userMessage, conversationHistory, onToken, config, t0,
            'The user is asking about very recent or real-time information. You are an on-device AI without internet access. Be honest about this limitation, but share any relevant knowledge you have about the topic. Do not fabricate current data.');
        }
        const online = useAppStore.getState().isOnline;
        return { response: getFactualGuardResponse(userMessage, online), handledBy: 'factual_guard', intent, wasStreamed: false };
      }

      // ── 4. KNOWLEDGE HUB ─────────────────────────────────────────

      const knowledgeAllowed = options?.knowledgeActive ?? config.knowledgeEnabled();

      if (isKnowledgeIntent(intent) && knowledgeAllowed) {
        return await handleKnowledge(intent as KnowledgeIntent, userMessage, conversationHistory, onToken, needs_brain, config, t0);
      }

      // ── 5. TOOL CALLS ────────────────────────────────────────────

      if (isToolIntent(intent)) {
        return await handleTool(intent, userMessage, conversationHistory, onToken, needs_brain, config, t0);
      }

      // ── 6. BRAIN ─────────────────────────────────────────────────

      return await handleBrain(userMessage, conversationHistory, onToken, config, t0);
    },
  };
}

async function ensureBrainLoaded(config: OrchestratorConfig): Promise<boolean> {
  if (config.isModelReady()) return true;
  try {
    console.log('[Orchestrator] Swapping to Brain...');
    await config.swapToBrain();
    return config.isModelReady();
  } catch (e) {
    console.warn('[Orchestrator] Swap to Brain failed:', e);
    return false;
  }
}

async function ensureRouterLoaded(config: OrchestratorConfig): Promise<void> {
  if (config.isRouterReady()) return;
  try {
    console.log('[Orchestrator] Swapping back to Router...');
    await config.swapToRouter();
  } catch (e) {
    console.warn('[Orchestrator] Swap to Router failed:', e);
  }
}

async function handleKnowledge(
  intent: KnowledgeIntent,
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  onToken: ((token: string) => void) | undefined,
  _needsBrain: boolean,
  config: OrchestratorConfig,
  t0: number,
): Promise<OrchestratorResult> {
  try {
    const knowledgeResponse = await queryKnowledge(intent, userMessage);

    if (knowledgeResponse.results.length === 0) {
      const brainReady = await ensureBrainLoaded(config);
      if (brainReady) {
        const result = await handleBrain(userMessage, conversationHistory, onToken, config, t0);
        await ensureRouterLoaded(config);
        return result;
      }
      return sysResponse("I couldn't find information on that. Try rephrasing your question.", intent);
    }

    const brainReady = await ensureBrainLoaded(config);

    if (brainReady) {
      const formatted = formatKnowledgeForBrain(knowledgeResponse.results, userMessage);
      const brainResponse = await runBrain(
        formatted.text,
        userMessage,
        conversationHistory,
        onToken,
        config,
      );

      const finalResponse = postProcessCitations(brainResponse, formatted.sources);
      autoExtractFacts(userMessage, finalResponse, config.llmExtractFacts);

      await ensureRouterLoaded(config);

      const t5 = Date.now();
      console.log(`[Orchestrator] Knowledge+Brain total: ${t5 - t0}ms`);
      return { response: finalResponse, handledBy: 'knowledge', intent, wasStreamed: true };
    }

    const simpleResponse = knowledgeResponse.results.map(r => r.content).join('\n\n');
    autoExtractFacts(userMessage, simpleResponse, config.llmExtractFacts);
    return { response: simpleResponse, handledBy: 'knowledge', intent, wasStreamed: false };
  } catch (e) {
    console.warn('[Orchestrator] Knowledge failed, falling back to Brain:', e);
    return await handleBrain(userMessage, conversationHistory, onToken, config, t0);
  }
}

async function handleTool(
  intent: Intent,
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  onToken: ((token: string) => void) | undefined,
  needsBrain: boolean,
  config: OrchestratorConfig,
  t0: number,
): Promise<OrchestratorResult> {
  if (intent === 'memory_query') {
    const result = await executeTool('memory_query', { query: userMessage });
    return { response: result.data, handledBy: 'memory', intent, wasStreamed: false };
  }

  if (intent === 'memory_forget') {
    const result = await executeTool('memory_forget', { query: userMessage });
    return {
      response: result.success ? result.data : "I couldn't find that memory.",
      handledBy: 'memory',
      intent,
      wasStreamed: false,
    };
  }

  if (intent === 'clipboard_read') {
    const result = await executeTool('clipboard_read');
    if (result.data === 'The clipboard is empty.') {
      return { response: result.data, handledBy: 'tool', intent, wasStreamed: false };
    }
    const hasSummarize = /\b(summarize|summarise|explain|what does|what does this mean)\b/i.test(userMessage);
    if (hasSummarize) {
      const brainReady = await ensureBrainLoaded(config);
      if (brainReady) {
        const brainResponse = await runBrain(
          `I copied this text. Please summarize or explain it:\n\n${result.data}`,
          userMessage, conversationHistory, onToken, config,
        );
        await ensureRouterLoaded(config);
        return { response: brainResponse, handledBy: 'model', intent, wasStreamed: true };
      }
    }
    return { response: `Here's what's on your clipboard:\n\n${result.data}`, handledBy: 'tool', intent, wasStreamed: false };
  }

  if (intent === 'clipboard_write') {
    let lastAssistantMsg = '';
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      if (conversationHistory[i].role === 'assistant') {
        lastAssistantMsg = conversationHistory[i].content;
        break;
      }
    }
    const textToCopy = lastAssistantMsg || userMessage.replace(/\bcopy\s+/i, '').replace(/\bto\s+clipboard\b/i, '').trim();
    const result = await executeTool('clipboard_write', { text: textToCopy });
    return { response: result.success ? "Done! I've copied that to your clipboard." : result.data, handledBy: 'tool', intent, wasStreamed: false };
  }

  if (intent === 'tts_speak') {
    let lastAssistantMsg = '';
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      if (conversationHistory[i].role === 'assistant') {
        lastAssistantMsg = conversationHistory[i].content;
        break;
      }
    }
    if (!lastAssistantMsg) {
      return sysResponse("I don't have a previous response to read back yet!", intent);
    }
    const result = await executeTool('tts_speak', { text: lastAssistantMsg });
    return { response: result.success ? "Reading it back to you now..." : result.data, handledBy: 'tool', intent, wasStreamed: false };
  }

  if (intent === 'calendar_query') {
    const days = /\b(?:upcoming|next|this\s+week)\b/i.test(userMessage) ? 7 : 0;
    const result = await executeTool('calendar_query', { days });
    if (needsBrain) {
      const brainReady = await ensureBrainLoaded(config);
      if (brainReady) {
        const brainResponse = await runBrain(
          `Based on this calendar data: ${result.data}\n\nAnswer the user's question.`,
          userMessage, conversationHistory, onToken, config,
        );
        await ensureRouterLoaded(config);
        return { response: brainResponse, handledBy: 'model', intent, wasStreamed: true };
      }
    }
    return { response: result.data, handledBy: 'tool', intent, wasStreamed: false };
  }

  if (intent === 'calendar_create') {
    const titleMatch = userMessage.match(/(?:meeting|event|appointment)(?:\s+(?:with|for|about))?\s+(.+?)(?:\s+(?:tomorrow|today|at|on|next)\b|$)/i);
    const title = titleMatch?.[1]?.trim() || userMessage.replace(/^(?:add|create|schedule|put)\s+(?:a\s+)?/i, '').trim();
    const timeStr = extractTimeFromMessage(userMessage);
    if (!timeStr) {
      return { response: "I'd love to create that event, but I need to know when. Try: 'Add meeting with Sarah tomorrow at 3pm'", handledBy: 'tool', intent, wasStreamed: false };
    }
    const result = await executeTool('calendar_create', { title, startDate: timeStr.toISOString(), durationMinutes: 60 });
    return { response: result.data, handledBy: 'tool', intent, wasStreamed: false };
  }

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

  if (intent === 'reminder_create') {
    const textMatch = userMessage.match(/remind\s+me\s+(?:to|about)\s+(.+?)(?:\s+(?:at|in|by|on)\b|$)/i)
      || userMessage.match(/(?:set\s+(?:a\s+)?reminder|notify\s+me)\s+(?:to|about)?\s*(.+?)(?:\s+(?:at|in|by|on)\b|$)/i);
    const text = textMatch?.[1]?.trim() || '';
    const timeMatch = userMessage.match(/(?:at|in|by)\s+(.+?)$/i);
    const timeStr = timeMatch?.[1]?.trim() || '';
    if (!text) return { response: "What should I remind you about?", handledBy: 'tool', intent, wasStreamed: false };
    if (!timeStr) return { response: "When should I remind you? Try: 'Remind me to call mom at 5pm'", handledBy: 'tool', intent, wasStreamed: false };
    const result = await executeTool('reminder_create', { text, time: timeStr });
    return { response: result.data, handledBy: 'tool', intent, wasStreamed: false };
  }

  if (intent === 'reminder_list') {
    const result = await executeTool('reminder_list');
    return { response: result.data, handledBy: 'tool', intent, wasStreamed: false };
  }

  return sysResponse("I'm not sure how to handle that.", intent);
}

async function handleBrain(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  onToken: ((token: string) => void) | undefined,
  config: OrchestratorConfig,
  t0: number,
  overrideSystemNote?: string,
): Promise<OrchestratorResult> {
  const brainReady = await ensureBrainLoaded(config);
  if (!brainReady) {
    return sysResponse("I'm still loading up — give me a moment and try again!", 'chat');
  }

  let relevantMemories: Array<{ fact: string; category: string | null; entity: string | null }> = [];
  let totalMemoryCount = 0;

  try {
    const { memoryEngine } = await import('@/engines/memory');
    relevantMemories = (await memoryEngine.findSimilar(userMessage)).map(m => ({
      fact: m.fact, category: m.category, entity: m.entity,
    }));
    const allMems = await memoryEngine.getAllMemories();
    totalMemoryCount = allMems.length;
  } catch (e) {
    console.warn('[Orchestrator] Memory search skipped:', e);
  }

  const systemState = await buildSystemState(relevantMemories, totalMemoryCount);
  const stateString = formatSystemStateForPrompt(systemState);

  const { SYSTEM_PROMPT } = await import('@/utils/system-prompt');
  let systemPrompt = SYSTEM_PROMPT + '\n\n[SYSTEM STATE]\n' + stateString + '\n[/SYSTEM STATE]';
  if (overrideSystemNote) {
    systemPrompt += '\n\n[NOTE]\n' + overrideSystemNote + '\n[/NOTE]';
  }

  const brainResponse = await runBrain(
    null, userMessage, conversationHistory, onToken, config, systemPrompt,
  );

  autoExtractFacts(userMessage, brainResponse, config.llmExtractFacts);

  await ensureRouterLoaded(config);

  const t5 = Date.now();
  console.log(`[Orchestrator] Brain total: ${t5 - t0}ms`);

  return { response: brainResponse, handledBy: 'model', intent: 'chat', wasStreamed: true };
}

async function runBrain(
  contextOrInstruction: string | null,
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  onToken: ((token: string) => void) | undefined,
  config: OrchestratorConfig,
  customSystemPrompt?: string,
): Promise<string> {
  const messages: Array<{ role: string; content: string }> = [];

  if (customSystemPrompt) {
    messages.push({ role: 'system', content: customSystemPrompt });
  }

  for (const msg of conversationHistory) {
    messages.push(msg);
  }

  if (contextOrInstruction && contextOrInstruction !== customSystemPrompt) {
    messages.push({ role: 'user', content: `${contextOrInstruction}\n\nUser: ${userMessage}` });
  } else {
    messages.push({ role: 'user', content: userMessage });
  }

  let rawResponse = '';
  const streamCallback = onToken
    ? (token: string) => {
        const cleanToken = formatStreamingToken(token);
        if (cleanToken) onToken(cleanToken);
      }
    : (_token: string) => {};

  try {
    rawResponse = await config.streamCompletion(messages, streamCallback, customSystemPrompt);
  } catch (error) {
    console.error('[Orchestrator] LLM completion failed:', error);
    return "Something went wrong. Could you try again?";
  }

  const { response } = formatModelResponse(rawResponse);
  return response;
}

type FactExtractorFn = (userMsg: string, assistantMsg: string) => Promise<Array<{ fact: string; category: string; entity: string | null }>>;

function autoExtractFacts(userMessage: string, assistantResponse: string, llmExtractor?: FactExtractorFn): void {
  if (!useSettingsStore_readOnly().memoryEnabled) return;

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

function useSettingsStore_readOnly() {
  const { useSettingsStore } = require('@/stores/settings-store');
  return useSettingsStore.getState();
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
