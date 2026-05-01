/**
 * Lyla Orchestrator — The Brain Behind the Model
 *
 * Routing layer between user and LLM. Handles:
 * 1. Memory operations (query, forget) → SQLite
 * 2. Device queries (time, battery, device info) → Native APIs
 * 3. Identity/limitations → Hardcoded responses
 * 4. Factual/realtime questions → Deflection (until web search)
 * 5. Everything else → LLM with contextual prompt
 */

import { classifyIntent, type Intent } from './intent-classifier';
import { getFactualGuardResponse } from './factual-guard';
import { getIdentityResponse } from './identity-handler';
import { handleTimeQuery, handleBatteryQuery, handleDeviceQuery } from './device-handlers';
import { formatModelResponse, formatStreamingToken } from './response-formatter';

export interface OrchestratorResult {
  response: string;
  handledBy: 'factual_guard' | 'model' | 'memory' | 'system';
  intent: Intent;
  wasStreamed: boolean;
}

export interface OrchestratorConfig {
  streamCompletion: (
    messages: Array<{ role: string; content: string }>,
    onToken: (token: string) => void,
  ) => Promise<string>;
  isModelReady: () => boolean;
}

function systemResponse(response: string, intent: Intent, t0: number, t1: number): OrchestratorResult {
  const total = Date.now() - t0;
  console.log(`[Orchestrator] Timing: classify=${t1 - t0}ms total=${total}ms`);
  return { response, handledBy: 'system', intent, wasStreamed: false };
}

export function createOrchestrator(config: OrchestratorConfig) {
  return {
    async processMessage(
      userMessage: string,
      conversationHistory: Array<{ role: string; content: string }>,
      onToken?: (token: string) => void,
    ): Promise<OrchestratorResult> {

      const t0 = Date.now();
      const { intent } = classifyIntent(userMessage);
      const t1 = Date.now();

      // ── Memory Query → DB lookup ────────────────────────────────
      if (intent === 'memory_query') {
        try {
          const { memoryEngine } = await import('@/engines/memory');
          const allMemories = await memoryEngine.getAllMemories();
          if (allMemories.length > 0) {
            const memoryList = allMemories.map(m => `- ${m.fact}`).join('\n');
            return {
              response: `Here's what I remember about you:\n${memoryList}`,
              handledBy: 'memory',
              intent,
              wasStreamed: false,
            };
          }
        } catch (e) {
          console.warn('[Orchestrator] Memory query failed:', e);
        }
        return {
          response: "I don't have any memories about you yet! Long-press any message to save it to my memory, and I'll use it in future conversations.",
          handledBy: 'memory',
          intent,
          wasStreamed: false,
        };
      }

      // ── Memory Forget → DB delete ───────────────────────────────
      if (intent === 'memory_forget') {
        try {
          const { memoryEngine } = await import('@/engines/memory');
          const similar = await memoryEngine.findSimilar(userMessage, 1);
          if (similar.length > 0) {
            const target = similar[0];
            await memoryEngine.deleteMemory(target.id);
            return {
              response: `Done! I've forgotten: "${target.fact}"`,
              handledBy: 'memory',
              intent,
              wasStreamed: false,
            };
          }
          const allMemories = await memoryEngine.getAllMemories();
          if (allMemories.length === 0) {
            return {
              response: "I don't have any memories stored yet, so there's nothing to forget!",
              handledBy: 'memory',
              intent,
              wasStreamed: false,
            };
          }
        } catch (e) {
          console.warn('[Orchestrator] Memory forget failed:', e);
        }
        return {
          response: "I couldn't find a specific memory matching that. Ask 'what do you remember about me?' to see all stored memories.",
          handledBy: 'memory',
          intent,
          wasStreamed: false,
        };
      }

      // ── Time/Date Query → Device API ────────────────────────────
      if (intent === 'time_query') {
        const response = handleTimeQuery(userMessage);
        return systemResponse(response, intent, t0, t1);
      }

      // ── Battery Query → Device API ──────────────────────────────
      if (intent === 'battery_query') {
        const response = await handleBatteryQuery();
        return systemResponse(response, intent, t0, t1);
      }

      // ── Device Query → Device API ───────────────────────────────
      if (intent === 'device_query') {
        const response = handleDeviceQuery();
        return systemResponse(response, intent, t0, t1);
      }

      // ── Identity Query → Hardcoded responses ────────────────────
      if (intent === 'identity_query') {
        const response = getIdentityResponse(intent);
        return systemResponse(response!, intent, t0, t1);
      }

      // ── Limitations Query → Hardcoded responses ─────────────────
      if (intent === 'limitations_query') {
        const response = getIdentityResponse('limitations');
        return systemResponse(response!, intent, t0, t1);
      }

      // ── Factual / Realtime → Deflect (until web search) ────────
      if (intent === 'factual_realtime') {
        const response = getFactualGuardResponse(userMessage);
        return { response, handledBy: 'factual_guard', intent, wasStreamed: false };
      }

      // ── Memory context for LLM ─────────────────────────────────
      let memoryContext = '';
      let t2 = t1;
      try {
        const memories = await (await import('@/engines/memory')).memoryEngine.findSimilar(userMessage);
        t2 = Date.now();
        if (memories.length > 0) {
          memoryContext = `\n\n[MEMORY]\n${memories.map(m => `• ${m.fact}`).join('\n')}\n[/MEMORY]`;
        }
      } catch (e) {
        t2 = Date.now();
        console.warn('[Orchestrator] Memory search skipped:', e);
      }

      // ── Everything else → LLM ──────────────────────────────────
      if (!config.isModelReady()) {
        return {
          response: "I'm still loading up — give me a moment and try again!",
          handledBy: 'model',
          intent,
          wasStreamed: false,
        };
      }

      const { SYSTEM_PROMPT } = await import('@/utils/system-prompt');
      const dynamicSystemPrompt = SYSTEM_PROMPT + memoryContext;

      const messages = [
        { role: 'system', content: dynamicSystemPrompt },
        ...conversationHistory,
        { role: 'user', content: userMessage },
      ];

      let rawResponse = '';
      const streamCallback = onToken
        ? (token: string) => {
            const cleanToken = formatStreamingToken(token);
            if (cleanToken) {
              onToken(cleanToken);
            }
          }
        : (_token: string) => {};

      try {
        rawResponse = await config.streamCompletion(messages, streamCallback);
      } catch (error) {
        console.error('[Orchestrator] LLM completion failed:', error);
        return {
          response: "Something went wrong. Could you try again?",
          handledBy: 'model',
          intent,
          wasStreamed: false,
        };
      }

      const t3 = Date.now();
      const { response } = formatModelResponse(rawResponse);
      const t4 = Date.now();

      console.log(
        `[Orchestrator] Timing: classify=${t1 - t0}ms embed=${t2 - t1}ms llm=${t3 - t2}ms format=${t4 - t3}ms total=${t4 - t0}ms`
      );

      return {
        response,
        handledBy: 'model',
        intent,
        wasStreamed: true,
      };
    },
  };
}

export type Orchestrator = ReturnType<typeof createOrchestrator>;
