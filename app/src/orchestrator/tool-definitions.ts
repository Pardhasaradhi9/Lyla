/**
 * Tool Definitions — LFM2.5 native tool-calling support
 *
 * parseToolCall() extracts structured tool calls from model output.
 * getToolPromptForBrain() generates the tool schema injection for the Brain.
 */

import { getAllTools } from './tool-registry';

export interface ParsedToolCall {
  name: string;
  arguments: Record<string, string>;
}

/**
 * Tools that benefit from Brain-powered argument extraction.
 * Simple tools (time, battery, clipboard, memory, tts) use direct dispatch.
 */
const BRAIN_EXTRACTED_TOOLS = new Set([
  'calendar_create', 'contact_lookup', 'reminder_create',
]);

/**
 * Generate tool schema prompt for the Brain's system prompt.
 * Only includes tools that need NL argument extraction.
 */
export function getToolPromptForBrain(): string {
  const tools = getAllTools().filter(t => BRAIN_EXTRACTED_TOOLS.has(t.name));
  if (tools.length === 0) return '';

  const schemas = tools.map(t => ({
    name: t.name,
    description: t.description,
    parameters: {
      type: 'object',
      properties: Object.fromEntries(
        t.parameters.map(p => [p.name, { type: p.type, description: p.description }])
      ),
      required: t.parameters.filter(p => p.required).map(p => p.name),
    },
  }));

  return '\n<|tool_list_start|>\n' + JSON.stringify(schemas) + '\n<|tool_list_end|>\n' +
    'When the user wants to use one of these tools, output ONLY a tool call:\n' +
    '<|tool_call_start|>[tool_name(param="value")]<|tool_call_end|>\n' +
    'Then STOP. The system will execute the tool and show the result.';
}

/**
 * Parse a tool call from LFM2.5 output.
 * Format: <|tool_call_start|>[function_name(key="value")]<|tool_call_end|>
 */
export function parseToolCall(modelOutput: string): ParsedToolCall | null {
  const match = modelOutput.match(
    /<\|tool_call_start\|>\s*\[(\w+)\((.*?)\)(?:\]\s*<\|tool_call_end\|>)?/
  );
  if (!match) return null;

  const name = match[1];
  const argsString = match[2];
  let args: Record<string, string> = {};

  if (argsString.trim()) {
    try {
      args = JSON.parse(argsString);
    } catch {
      const argPattern = /(\w+)=(['"])(.*?)\2/g;
      let argMatch: RegExpExecArray | null;
      while ((argMatch = argPattern.exec(argsString)) !== null) {
        args[argMatch[1]] = argMatch[3];
      }
    }
  }

  return { name, arguments: args };
}
