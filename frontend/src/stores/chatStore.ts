import { create } from 'zustand';
import type { Message, MessageContext } from '../types';

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  currentContext: MessageContext | null;
  
  // Actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, content: string) => void;
  setStreaming: (isStreaming: boolean) => void;
  setContext: (context: MessageContext | null) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  currentContext: null,

  addMessage: (message) => set((state) => ({
    messages: [
      ...state.messages,
      {
        ...message,
        id: `msg-${Date.now()}`,
        timestamp: Date.now(),
      },
    ],
  })),

  updateMessage: (id, content) => set((state) => ({
    messages: state.messages.map(msg =>
      msg.id === id ? { ...msg, content } : msg
    ),
  })),

  setStreaming: (isStreaming) => set({ isStreaming }),

  setContext: (context) => set({ currentContext: context }),

  clearMessages: () => set({ messages: [] }),
}));

