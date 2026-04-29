/**
 * System Prompt Builder for Lyla.
 *
 * Dynamically constructs the system prompt with:
 * - User memories (facts recalled from past conversations)
 * - Online/offline context
 * - Current date
 */
import type { Memory } from '@/engines/memory';

/**
 * Build the complete system prompt for the LLM.
 */
export function buildSystemPrompt(
  memories: Memory[],
  isOnline: boolean,
): string {
  const memorySection =
    memories.length > 0
      ? `## What you remember about the user:\n${memories.map((m) => `- ${m.fact}`).join('\n')}`
      : '';

  const networkSection = isOnline
    ? 'You have access to web search results which will be provided when relevant.'
    : 'You are currently offline. Rely on your knowledge and memories.';

  return `You are Lyla, a private AI assistant running entirely on the user's device.
You are direct, helpful, and conversational. Never add disclaimers about being an AI.
You have persistent memory — you remember facts about the user across conversations.
Be concise but warm. Match the user's energy and language style.

${memorySection}

${networkSection}

Current date: ${new Date().toLocaleDateString()}
Respond naturally and concisely.`.trim();
}
