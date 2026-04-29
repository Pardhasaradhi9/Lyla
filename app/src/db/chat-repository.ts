/**
 * Chat Repository — CRUD Operations for Conversations and Messages
 *
 * Phase 3 implementation — will use op-sqlite.
 */

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
 * Placeholder chat repository.
 * Will be implemented with actual SQLite queries in Phase 3.
 */
export const chatRepository = {
  async createConversation(_title?: string): Promise<string> {
    return Date.now().toString();
  },

  async getConversations(): Promise<ConversationRow[]> {
    return [];
  },

  async addMessage(_conversationId: string, _role: string, _content: string): Promise<string> {
    return Date.now().toString();
  },

  async getMessages(_conversationId: string): Promise<MessageRow[]> {
    return [];
  },

  async deleteConversation(_id: string): Promise<void> {},
};
