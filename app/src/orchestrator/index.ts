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
import { memoryEngine } from '@/engines/memory';
import { SYSTEM_PROMPT } from '@/utils/system-prompt';
import { useSettingsStore } from '@/stores/settings-store';
import { parseToolCall, getToolPromptForBrain } from './tool-definitions';
import { extractToolCallIfPresent } from './response-formatter';

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
      if (intent === 'identity_query') return sysResponse(getIdentityResponse(intent, userMessage)!, intent);
      if (intent === 'limitations_query') return sysResponse(getIdentityResponse('limitations', userMessage)!, intent);
      if (intent === 'math_query') return sysResponse(handleMathQuery(userMessage), intent);

      // ── 3. FACTUAL GUARD ─────────────────────────────────────────

      if (intent === 'factual_realtime') {
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
      console.warn(`[Orchestrator] Knowledge Hub returned 0 results for intent=${intent} query="${userMessage.slice(0, 80)}"`);
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

      // Build system prompt with relevant context for knowledge synthesis
      let relevantMemories: Array<{ fact: string; category: string | null; entity: string | null }> = [];
      try {
        relevantMemories = (await memoryEngine.findSimilar(userMessage, 5)).map(m => ({
          fact: m.fact, category: m.category, entity: m.entity,
        }));
      } catch {}
      const memoryContext = relevantMemories.length > 0
        ? '\n\nRelevant memories:\n' + relevantMemories.map(m => `- ${m.fact}`).join('\n')
        : '';
      const knowledgeSystemPrompt = SYSTEM_PROMPT + '\n\nCurrent time: ' + new Date().toLocaleString() + memoryContext;

      const brainResponse = await runBrain(
        formatted.text,
        userMessage,
        conversationHistory,
        onToken,
        config,
        knowledgeSystemPrompt,
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

  // ── Brain-extracted tools — use native tool calling for argument parsing ──
  if (intent === 'calendar_create' || intent === 'contact_lookup' || intent === 'reminder_create') {
    return await handleBrainToolCall(intent, userMessage, conversationHistory, onToken, config, t0);
  }

  if (intent === 'reminder_list') {
    const result = await executeTool('reminder_list');
    return { response: result.data, handledBy: 'tool', intent, wasStreamed: false };
  }

  return sysResponse("I'm not sure how to handle that.", intent);
}

async function handleBrainToolCall(
  intent: Intent,
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  onToken: ((token: string) => void) | undefined,
  config: OrchestratorConfig,
  t0: number,
): Promise<OrchestratorResult> {
  const brainReady = await ensureBrainLoaded(config);
  if (!brainReady) {
    return sysResponse("I need a moment to load up — try again shortly!", intent);
  }

  // Build system prompt WITH tool schemas
  const toolPrompt = getToolPromptForBrain();
  const systemPrompt = SYSTEM_PROMPT + '\n' + toolPrompt;

  // Ask Brain to generate a tool call
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];
  // Include recent conversation for context
  for (const msg of conversationHistory.slice(-6)) {
    messages.push(msg);
  }
  messages.push({ role: 'user', content: userMessage });

  let rawOutput = '';
  try {
    rawOutput = await config.streamCompletion(messages, () => {}, systemPrompt);
  } catch (e) {
    console.error('[Orchestrator] Brain tool call generation failed:', e);
    return sysResponse("Something went wrong processing that. Could you try again?", intent);
  }

  // Check if Brain generated a tool call
  const { hasToolCall, toolCall, textResponse } = extractToolCallIfPresent(rawOutput);

  if (hasToolCall && toolCall) {
    console.log(`[Orchestrator] Brain tool call: ${toolCall.name}(${JSON.stringify(toolCall.arguments)})`);
    const result = await executeTool(toolCall.name, toolCall.arguments);

    if (result.success) {
      // Let Brain generate a natural confirmation
      const confirmMessages: Array<{ role: string; content: string }> = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...conversationHistory.slice(-4),
        { role: 'user', content: userMessage },
        { role: 'system', content: `Tool "${toolCall.name}" executed successfully. Result: ${result.data}\n\nConfirm this to the user in a friendly, natural way. Be brief.` },
      ];

      // Actually, simpler approach — just have Brain confirm with the tool result context:
      let confirmText = '';
      try {
        confirmText = await config.streamCompletion(
          confirmMessages,
          (token) => { if (onToken) onToken(formatStreamingToken(token)); },
          SYSTEM_PROMPT,
        );
      } catch {
        confirmText = result.data; // Fallback to raw tool result
      }

      await ensureRouterLoaded(config);
      const t5 = Date.now();
      console.log(`[Orchestrator] Brain tool call total: ${t5 - t0}ms`);
      return { response: formatModelResponse(confirmText).response, handledBy: 'tool', intent, wasStreamed: true };
    }

    // Tool execution failed
    await ensureRouterLoaded(config);
    return { response: result.data, handledBy: 'tool', intent, wasStreamed: false };
  }

  // Brain didn't generate a tool call — use its text response as fallback
  if (textResponse) {
    await ensureRouterLoaded(config);
    return { response: formatModelResponse(textResponse).response, handledBy: 'model', intent, wasStreamed: false };
  }

  // Complete fallback
  await ensureRouterLoaded(config);
  return sysResponse("I couldn't process that request. Could you rephrase it?", intent);
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
    relevantMemories = (await memoryEngine.findSimilar(userMessage)).map(m => ({
      fact: m.fact, category: m.category, entity: m.entity,
    }));
    totalMemoryCount = await memoryEngine.getMemoryCount();
  } catch (e) {
    console.warn('[Orchestrator] Memory search skipped:', e);
  }

  const systemState = await buildSystemState(relevantMemories, totalMemoryCount);
  const stateString = formatSystemStateForPrompt(systemState);

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
  if (!useSettingsStore.getState().memoryEnabled) return;
  if (userMessage.length < 10) return;
  if (/^(hi|hello|hey|thanks|ok|sure|yes|no|bye|lol|haha|cool|nice|great|wow)\b/i.test(userMessage.trim())) return;

  try {
    const facts = extractFacts(userMessage);
    if (facts.length > 0) {
      for (const fact of facts.slice(0, 3)) {
        // Dedup check — skip if a very similar memory already exists
        memoryEngine.findSimilar(fact.fact, 1).then(existing => {
          if (existing.length === 0 || existing[0].distance > 0.5) {
            memoryEngine.addMemory(fact.fact, fact.entity || undefined, fact.category).catch(() => {});
          } else {
            console.log(`[AutoExtract] Skipped duplicate: "${fact.fact}" (distance=${existing[0].distance.toFixed(2)})`);
          }
        }).catch(() => {
          // If dedup check fails, save anyway
          memoryEngine.addMemory(fact.fact, fact.entity || undefined, fact.category).catch(() => {});
        });
      }
      return;
    }
    if (llmExtractor) {
      llmExtractor(userMessage, assistantResponse)
        .then((llmFacts) => {
          for (const fact of llmFacts.slice(0, 3)) {
            memoryEngine.addMemory(fact.fact, fact.entity ?? undefined, fact.category).catch(() => {});
          }
        })
        .catch(() => {});
    }
  } catch {}
}



export type Orchestrator = ReturnType<typeof createOrchestrator>;
