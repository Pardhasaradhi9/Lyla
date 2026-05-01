/**
 * Chat state store.
 * Manages the active conversation: messages, streaming state, conversation ID.
 */
import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  /** True if this message is still being streamed */
  isStreaming?: boolean;
}

interface ChatState {
  // ── Conversation ────────────────────────────────────────────────
  messages: Message[];
  conversationId: string | null;
  isGenerating: boolean;

  // ── Actions ─────────────────────────────────────────────────────
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string, isComplete?: boolean) => void;
  setIsGenerating: (generating: boolean) => void;
  clearChat: () => void;
  loadConversation: (id: string, messages: Message[]) => void;
  setConversationId: (id: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  conversationId: null,
  isGenerating: false,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateLastMessage: (content, isComplete = false) =>
    set((state) => {
      const messages = [...state.messages];
      const lastIndex = messages.length - 1;
      if (lastIndex >= 0 && messages[lastIndex].role === 'assistant') {
        messages[lastIndex] = {
          ...messages[lastIndex],
          content,
          isStreaming: !isComplete,
        };
      }
      return { messages };
    }),

  setIsGenerating: (generating) => set({ isGenerating: generating }),

  clearChat: () =>
    set({ messages: [], conversationId: null, isGenerating: false }),

  loadConversation: (id, messages) =>
    set({ conversationId: id, messages, isGenerating: false }),

  setConversationId: (id) => set({ conversationId: id }),
}));
