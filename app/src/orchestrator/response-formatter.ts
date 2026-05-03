/**
 * Response Formatter — Clean up model output for display
 *
 * Strips leaked special tokens and cleans markdown artifacts
 * from the model's raw output.
 */

/**
 * Clean model output by stripping special tokens and markdown noise.
 */
export function formatModelResponse(raw: string): { response: string } {
  let response = raw;

  // ── Strip LFM2.5 tool-calling tokens if they leaked ───────────
  response = response
    .replace(/<\|tool_call_start\|>/g, '')
    .replace(/<\|tool_call_end\|>/g, '')
    .replace(/<\|tool_response_start\|>/g, '')
    .replace(/<\|tool_response_end\|>/g, '')
    .replace(/<\|tool_list_start\|>/g, '')
    .replace(/<\|tool_list_end\|>/g, '');

  // ── Strip ChatML tokens if they leaked ─────────────────────────
  response = response
    .replace(/<\|im_start\|>/g, '')
    .replace(/<\|im_end\|>/g, '')
    .replace(/<\|endoftext\|>/g, '')
    .replace(/<\|startoftext\|>/g, '');

  // ── Clean up excess whitespace ────────────────────────────────
  response = response.replace(/\n{3,}/g, '\n\n');
  response = response.trim();

  if (!response) {
    response = "I'm not sure how to respond to that. Could you rephrase?";
  }

  return { response };
}

/**
 * Format a response for streaming display.
 * Called on partial tokens during streaming — lighter processing.
 */
export function formatStreamingToken(token: string): string {
  return token
    .replace(/<\|im_end\|>/g, '')
    .replace(/<\|im_start\|>/g, '')
    .replace(/<\|endoftext\|>/g, '')
    .replace(/<\|tool_call_start\|>/g, '')
    .replace(/<\|tool_call_end\|>/g, '');
}
