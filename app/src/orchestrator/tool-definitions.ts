/**
 * Tool Definitions — JSON schemas for LFM2.5 tool calling
 *
 * LFM2.5 was trained with special tool-calling tokens:
 * <|tool_call_start|>, <|tool_call_end|>, etc.
 *
 * These definitions are injected into the system prompt so the model
 * can decide when to call a tool vs respond directly.
 *
 * Phase 2.5: Define schemas. Tools are NOT yet functional.
 * Phase 3: Memory tools become functional.
 * Phase 4: Web search tool becomes functional.
 */

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

/**
 * All available tools for Lyla.
 * Only include tools that are actually implemented in the current phase.
 */
export function getActiveTools(phase: 'phase2' | 'phase3' | 'phase4'): ToolDefinition[] {
  const tools: ToolDefinition[] = [];

  // Phase 3: Memory tools
  if (phase === 'phase3' || phase === 'phase4') {
    tools.push({
      name: 'recall_memory',
      description: 'Search your memories about the user to recall facts, preferences, or past conversations. Use this when the user asks about something you might have learned about them before.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'What to search for in user memories (e.g., "favorite food", "job", "birthday")',
          },
        },
        required: ['query'],
      },
    });
  }

  // Phase 4: Web search
  if (phase === 'phase4') {
    tools.push({
      name: 'web_search',
      description: 'Search the web for current information. Use when the user asks about real-time data like weather, news, prices, or anything that requires up-to-date information.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query to look up on the web',
          },
        },
        required: ['query'],
      },
    });
  }

  return tools;
}

/**
 * Format tool definitions into the JSON string format expected by LFM2.5.
 * This gets injected into the system prompt.
 */
export function formatToolsForPrompt(tools: ToolDefinition[]): string {
  if (tools.length === 0) return '';
  return `\nList of tools: ${JSON.stringify(tools)}`;
}

/**
 * Parse a tool call from the model's output.
 * LFM2.5 format: <|tool_call_start|>[function_name(param="value")]<|tool_call_end|>
 *
 * Returns null if no tool call is detected.
 */
export interface ParsedToolCall {
  name: string;
  arguments: Record<string, string>;
}

export function parseToolCall(modelOutput: string): ParsedToolCall | null {
  // Match LFM2.5 tool call format: <|tool_call_start|>[function_name(fact="value")]
  // Or handle truncated output where it just started
  const match = modelOutput.match(
    /<\|tool_call_start\|>\s*\[(\w+)\((.*?)\)(?:\]\s*<\|tool_call_end\|>)?/
  );

  if (!match) return null;

  const name = match[1];
  const argsString = match[2];

  let args: Record<string, string> = {};
  
  if (argsString.trim()) {
    try {
      // Try JSON parse first just in case
      args = JSON.parse(argsString);
    } catch (e) {
      // Fallback to python kwarg style matching: key="value" or key='value'
      const argPattern = /(\w+)=(['"])(.*?)\2/g;
      let argMatch: RegExpExecArray | null;
      while ((argMatch = argPattern.exec(argsString)) !== null) {
        args[argMatch[1]] = argMatch[3];
      }
    }
  }

  return { name, arguments: args };
}
