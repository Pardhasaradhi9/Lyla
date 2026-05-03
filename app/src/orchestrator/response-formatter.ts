/**
 * Response Formatter — Clean up model output for display
 *
 * Two-phase approach:
 * 1. extractToolCallIfPresent() — checks for tool calls BEFORE cleanup
 * 2. formatModelResponse() — strips tokens for FINAL display output
 */

import { parseToolCall, type ParsedToolCall } from './tool-definitions';

/**
 * Check if model output contains a native tool call.
 * Call this BEFORE formatModelResponse() to intercept tool calls.
 */
export function extractToolCallIfPresent(raw: string): {
  hasToolCall: boolean;
  toolCall: ParsedToolCall | null;
  textResponse: string;
} {
  const toolCall = parseToolCall(raw);
  if (toolCall && toolCall.name) {
    // Remove the tool call tokens to get any surrounding text
    const textResponse = raw
      .replace(/<\|tool_call_start\|>.*?(<\|tool_call_end\|>)?/s, '')
      .replace(/<\|tool_list_start\|>.*?<\|tool_list_end\|>/gs, '')
      .trim();
    return { hasToolCall: true, toolCall, textResponse };
  }
  return { hasToolCall: false, toolCall: null, textResponse: raw };
}

/**
 * Clean model output by stripping special tokens and markdown noise.
 * Call this AFTER tool call extraction for final display.
 */
export function formatModelResponse(raw: string): { response: string } {
  let response = raw;

  // Strip LFM2.5 tool-calling tokens (only in final output)
  response = response
    .replace(/<\|tool_call_start\|>/g, '')
    .replace(/<\|tool_call_end\|>/g, '')
    .replace(/<\|tool_response_start\|>/g, '')
    .replace(/<\|tool_response_end\|>/g, '')
    .replace(/<\|tool_list_start\|>/g, '')
    .replace(/<\|tool_list_end\|>/g, '');

  // Strip ChatML tokens
  response = response
    .replace(/<\|im_start\|>/g, '')
    .replace(/<\|im_end\|>/g, '')
    .replace(/<\|endoftext\|>/g, '')
    .replace(/<\|startoftext\|>/g, '');

  // Clean up excess whitespace
  response = response.replace(/\n{3,}/g, '\n\n');
  response = response.trim();

  if (!response) {
    response = "I'm not sure how to respond to that. Could you rephrase?";
  }

  return { response };
}

/**
 * Format a streaming token for display.
 * Only strip ChatML tokens — NOT tool tokens (those are handled upstream).
 */
export function formatStreamingToken(token: string): string {
  return token
    .replace(/<\|im_end\|>/g, '')
    .replace(/<\|im_start\|>/g, '')
    .replace(/<\|endoftext\|>/g, '');
  // NOTE: tool_call tokens are NOT stripped during streaming.
  // They are intercepted by the orchestrator after generation completes.
}
