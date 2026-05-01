/**
 * Factual Guard — Intercepts questions the model CANNOT answer
 *
 * Detects questions about real-time data (weather, prices, news, scores)
 * and returns a graceful deflection instead of letting the model hallucinate.
 *
 * In Phase 4 (Web Search), this becomes the trigger for DuckDuckGo search.
 * For now, it returns a "I need web for that" response.
 */

/**
 * Generate a contextual deflection response for real-time questions.
 * Acknowledges what the user asked and offers web search as a solution.
 */
export function getFactualGuardResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  // Weather
  if (/\bweather|temperature|forecast|rain|sunny|cold|hot\b/.test(lower)) {
    return `I don't have access to real-time weather data since I run offline on your device. Once web search is enabled, I'll be able to look that up for you! For now, you could check your phone's weather app.`;
  }

  // Prices / Finance
  if (/\bprice|cost|stock|crypto|bitcoin|gold|silver|market|exchange\s+rate\b/.test(lower)) {
    return `I don't have access to live pricing or market data — I run entirely offline on your device. Want me to explain how something works instead, or would you prefer to check a financial app for current numbers?`;
  }

  // News / Current Events
  if (/\bnews|headline|happening|going\s+on|trending|election|update\b/.test(lower)) {
    return `I'm running offline so I don't have access to current news or events. Once web search is live, I'll be able to pull the latest for you! In the meantime, is there something else I can help with?`;
  }

  // Sports scores
  if (/\bscore|result|match|game|tournament|ipl|world\s+cup|champion\b/.test(lower)) {
    return `I can't check live scores since I run offline — but once web search is enabled, I'll be able to look those up for you! Need help with anything else?`;
  }

  // Time / Date (the model sometimes gets this wrong)
  if (/\bwhat\s+(?:time|date)\s+is\s+it\b/.test(lower)) {
    const now = new Date();
    return `It's ${now.toLocaleTimeString()} on ${now.toLocaleDateString()}. Anything else?`;
  }

  // Generic fallback for anything the guard catches
  return `That's something I'd need real-time data for, and I run completely offline on your device. Web search is coming soon — for now, is there something else I can help with?`;
}
