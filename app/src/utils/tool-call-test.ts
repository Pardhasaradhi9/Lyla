/**
 * Tool-Call Test Utility
 *
 * Tests whether the current GGUF model supports LFM2.5's native
 * tool-calling tokens (<|tool_call_start|>, <|tool_call_end|>).
 *
 * Usage: Import and call `testToolCalling()` from any dev screen
 * or trigger it from the settings screen.
 *
 * Results:
 * - If the model outputs <|tool_call_start|>[function_name(...)]<|tool_call_end|>
 *   → Tool calling WORKS. We can use it for Phase 3/4.
 * - If the model just answers the question directly without tool tokens
 *   → Tool calling was stripped. Fall back to TypeScript intent classifier (current approach).
 */

import { llmEngine } from '@/engines/llm';
import { parseToolCall } from '@/orchestrator/tool-definitions';

const TOOL_CALL_TEST_PROMPT = `<|im_start|>system
You have access to the following tools:
List of tools: [{"name": "get_weather", "description": "Get current weather for a location", "parameters": {"type": "object", "properties": {"location": {"type": "string", "description": "City name"}}, "required": ["location"]}}]

When you need to use a tool, output the call between <|tool_call_start|> and <|tool_call_end|> tokens.
<|im_end|>
<|im_start|>user
What's the weather in Tokyo?
<|im_end|>
<|im_start|>assistant
`;

export interface ToolCallTestResult {
  /** Whether the model produced tool-calling tokens */
  supportsToolCalling: boolean;
  /** Raw model output */
  rawOutput: string;
  /** Parsed tool call (if any) */
  parsedToolCall: { name: string; arguments: Record<string, string> } | null;
  /** Human-readable summary */
  summary: string;
}

/**
 * Test if the loaded model supports LFM2.5 tool-calling format.
 * Must be called AFTER the model is loaded (modelStatus === 'ready').
 */
export async function testToolCalling(): Promise<ToolCallTestResult> {
  if (!llmEngine.isLoaded || !llmEngine.context) {
    return {
      supportsToolCalling: false,
      rawOutput: '',
      parsedToolCall: null,
      summary: '❌ Model not loaded. Load the model first.',
    };
  }

  let rawOutput = '';

  try {
    const result = await llmEngine.context.completion(
      {
        prompt: TOOL_CALL_TEST_PROMPT,
        n_predict: 128,
        temperature: 0.1, // Low temp for deterministic output
        stop: ['<|im_end|>', '<|im_start|>'],
      },
      (data) => {
        rawOutput += data.token;
      },
    );

    rawOutput = result.text;
  } catch (error) {
    return {
      supportsToolCalling: false,
      rawOutput: String(error),
      parsedToolCall: null,
      summary: `❌ Test failed with error: ${error}`,
    };
  }

  // Check for tool-calling tokens
  const hasToolTokens = rawOutput.includes('<|tool_call_start|>') || rawOutput.includes('tool_call_start');
  const parsedToolCall = parseToolCall(rawOutput);

  if (parsedToolCall) {
    return {
      supportsToolCalling: true,
      rawOutput,
      parsedToolCall,
      summary: `✅ Tool calling WORKS! Model called: ${parsedToolCall.name}(${JSON.stringify(parsedToolCall.arguments)})`,
    };
  }

  if (hasToolTokens) {
    return {
      supportsToolCalling: true,
      rawOutput,
      parsedToolCall: null,
      summary: `⚠️ Tool tokens detected but couldn't parse the call. Raw: ${rawOutput.substring(0, 200)}`,
    };
  }

  return {
    supportsToolCalling: false,
    rawOutput,
    parsedToolCall: null,
    summary: `❌ No tool-calling tokens in output. Model answered directly: "${rawOutput.substring(0, 150)}..."`,
  };
}
