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
export function getFactualGuardResponse(userMessage: string, isOnline: boolean = false): string {
  const lower = userMessage.toLowerCase();

  if (/\bweather|temperature|forecast|rain|sunny|cold|hot\b/.test(lower)) {
    return isOnline
      ? `I don't have web search yet — it's coming soon! For now, check your weather app for current conditions.`
      : `I'm offline right now so I can't look up weather data. Try again when you're connected, or check your weather app.`;
  }

  if (/\bprice|cost|stock|crypto|bitcoin|gold|silver|market|exchange\s+rate\b/.test(lower)) {
    return isOnline
      ? `I don't have web search yet, but it's coming soon! For now, check a financial app for live numbers.`
      : `I'm offline — I can't access market data without an internet connection. Check a financial app instead.`;
  }

  if (/\bnews|headline|happening|going\s+on|trending|election|update\b/.test(lower)) {
    return isOnline
      ? `Web search is coming soon — for now I can't pull live news. Is there something else I can help with?`
      : `I'm offline so I can't fetch news. Once you're connected again and web search is live, I'll be able to help!`;
  }

  if (/\bscore|result|match|game|tournament|ipl|world\s+cup|champion\b/.test(lower)) {
    return isOnline
      ? `I can't check live scores yet — web search is coming soon! Try a sports app for now.`
      : `I'm offline and can't check scores. Connect to the internet and try again once web search is available!`;
  }

  if (/\bwhat\s+(?:time|date)\s+is\s+it\b/.test(lower)) {
    const now = new Date();
    return `It's ${now.toLocaleTimeString()} on ${now.toLocaleDateString()}. Anything else?`;
  }

  return isOnline
    ? `That requires real-time data — web search is coming soon! Is there something else I can help with?`
    : `I'm offline right now and can't look that up. Once you're connected and web search is available, I'll be able to help!`;
}
