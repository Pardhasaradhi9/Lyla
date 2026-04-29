/**
 * Memory extraction prompt.
 *
 * Used after each assistant response to extract new facts
 * about the user for persistent memory storage.
 */

/**
 * Build a prompt that instructs the LLM to extract facts from a conversation turn.
 * Returns valid JSON array of extracted facts.
 */
export function buildMemoryExtractionPrompt(
  userMessage: string,
  assistantResponse: string,
): string {
  return `Extract factual information about the user from this conversation.
Output ONLY a JSON array of facts. If no new facts, output [].

Rules:
- Only extract facts about the USER, not general knowledge
- Include personal details, preferences, relationships, activities
- Each fact should be a single, clear statement
- Categorize: name, location, work, family, pets, preferences, health, hobbies, other

Example output: [{"fact": "User's dog is named Max", "entity": "Max", "category": "pets"}]

Conversation:
User: ${userMessage}
Assistant: ${assistantResponse}

JSON output:`;
}
