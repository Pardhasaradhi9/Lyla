/**
 * Search query generation prompt.
 *
 * Used to determine if a user message needs web search,
 * and to generate an optimal search query.
 */

/**
 * Build a prompt that classifies search intent and generates a query.
 */
export function buildSearchQueryPrompt(userMessage: string): string {
  return `Analyze this user message and determine if it requires a web search to answer accurately.

Rules:
- needs_search = true for: current events, weather, prices, recent news, live data
- needs_search = false for: opinions, personal questions, general knowledge, creative tasks

Output ONLY valid JSON:
{"needs_search": true/false, "query": "optimized search query or empty string"}

User message: ${userMessage}

JSON output:`;
}
