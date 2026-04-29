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
  isThinking: boolean;

  // ── Actions ─────────────────────────────────────────────────────
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string) => void;
  setIsGenerating: (generating: boolean) => void;
  setIsThinking: (thinking: boolean) => void;
  clearChat: () => void;
  loadConversation: (id: string, messages: Message[]) => void;
  setConversationId: (id: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  conversationId: null,
  isGenerating: false,
  isThinking: false,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateLastMessage: (content) =>
    set((state) => {
      const messages = [...state.messages];
      const lastIndex = messages.length - 1;
      if (lastIndex >= 0 && messages[lastIndex].role === 'assistant') {
        messages[lastIndex] = {
          ...messages[lastIndex],
          content,
          isStreaming: true,
        };
      }
      return { messages };
    }),

  setIsGenerating: (generating) => set({ isGenerating: generating }),
  setIsThinking: (thinking) => set({ isThinking: thinking }),

  clearChat: () =>
    set({ messages: [], conversationId: null, isGenerating: false, isThinking: false }),

  loadConversation: (id, messages) =>
    set({ conversationId: id, messages, isGenerating: false, isThinking: false }),

  setConversationId: (id) => set({ conversationId: id }),
}));
