/**
 * Chat Repository — CRUD Operations for Conversations and Messages
 *
 * Handles all database operations for chat persistence.
 * Messages survive app restarts — no more losing conversations.
 */

import { getDatabase } from './database';

export interface ConversationRow {
  id: string;
  title: string | null;
  created_at: number;
  updated_at: number;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: number;
}

/**
 * Generate a unique ID (timestamp + random suffix).
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

export const chatRepository = {
  // ── Conversations ───────────────────────────────────────────────

  /**
   * Create a new conversation. Returns the conversation ID.
   */
  async createConversation(title?: string): Promise<string> {
    const db = getDatabase();
    const id = generateId();
    const now = Date.now();

    await db.runAsync(
      'INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)',
      id,
      title ?? null,
      now,
      now,
    );

    return id;
  },

  /**
   * Get all conversations, most recent first.
   */
  async getConversations(limit = 50): Promise<ConversationRow[]> {
    const db = getDatabase();
    return db.getAllAsync<ConversationRow>(
      'SELECT * FROM conversations ORDER BY updated_at DESC LIMIT ?',
      limit,
    );
  },

  /**
   * Update the conversation title and timestamp.
   */
  async updateConversation(id: string, title: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      'UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?',
      title,
      Date.now(),
      id,
    );
  },

  /**
   * Touch the conversation's updated_at (e.g., when a new message is added).
   */
  async touchConversation(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      'UPDATE conversations SET updated_at = ? WHERE id = ?',
      Date.now(),
      id,
    );
  },

  /**
   * Delete a conversation and all its messages (CASCADE).
   */
  async deleteConversation(id: string): Promise<void> {
    const db = getDatabase();
    // Delete messages first (in case FOREIGN KEY CASCADE isn't enforced)
    await db.runAsync('DELETE FROM messages WHERE conversation_id = ?', id);
    await db.runAsync('DELETE FROM conversations WHERE id = ?', id);
  },

  // ── Messages ────────────────────────────────────────────────────

  /**
   * Add a message to a conversation. Returns the message ID.
   */
  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    messageId?: string,
  ): Promise<string> {
    const db = getDatabase();
    const id = messageId ?? generateId();
    const now = Date.now();

    await db.runAsync(
      'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)',
      id,
      conversationId,
      role,
      content,
      now,
    );

    // Touch the conversation's updated_at
    await db.runAsync(
      'UPDATE conversations SET updated_at = ? WHERE id = ?',
      now,
      conversationId,
    );

    return id;
  },

  /**
   * Update a message's content (e.g., after streaming completes).
   */
  async updateMessage(messageId: string, content: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      'UPDATE messages SET content = ? WHERE id = ?',
      content,
      messageId,
    );
  },

  /**
   * Get all messages for a conversation, oldest first.
   */
  async getMessages(conversationId: string): Promise<MessageRow[]> {
    const db = getDatabase();
    return db.getAllAsync<MessageRow>(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
      conversationId,
    );
  },

  /**
   * Get the message count for a conversation.
   */
  async getMessageCount(conversationId: string): Promise<number> {
    const db = getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?',
      conversationId,
    );
    return result?.count ?? 0;
  },

  /**
   * Delete a specific message.
   */
  async deleteMessage(messageId: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM messages WHERE id = ?', messageId);
  },

  /**
   * Generate a title from the first user message in a conversation.
   * Returns the first ~50 chars of the first user message.
   */
  async generateTitle(conversationId: string): Promise<string> {
    const db = getDatabase();
    const firstUserMsg = await db.getFirstAsync<MessageRow>(
      "SELECT * FROM messages WHERE conversation_id = ? AND role = 'user' ORDER BY created_at ASC LIMIT 1",
      conversationId,
    );

    if (!firstUserMsg) return 'New Chat';

    const title = firstUserMsg.content.substring(0, 50).trim();
    return title.length < firstUserMsg.content.length ? title + '...' : title;
  },
};
