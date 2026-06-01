'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { makeTitle } from '@/lib/utils';
import type { AgentId, Conversation, DeviceMetrics, Message } from '@/types';

type ChatState = {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeAgentId: AgentId;
  temperature: number;
  sidebarOpen: boolean;
  isLoading: boolean;
  deviceMetrics: DeviceMetrics | null;
  createConversation: () => string;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string) => void;
  updateConversationTitle: (id: string, title: string) => void;
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'createdAt'> & Partial<Pick<Message, 'id' | 'createdAt'>>) => Message;
  updateMessage: (conversationId: string, messageId: string, patch: Partial<Message>) => void;
  clearAll: () => void;
  setActiveAgent: (agentId: AgentId) => void;
  setTemperature: (temperature: number) => void;
  setSidebarOpen: (open: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setDeviceMetrics: (metrics: DeviceMetrics) => void;
};

function now() {
  return new Date().toISOString();
}

function newConversation(): Conversation {
  const timestamp = now();
  return {
    id: uuid(),
    title: 'محادثة جديدة',
    messages: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function ensureConversation(state: ChatState) {
  if (state.activeConversationId && state.conversations.some((item) => item.id === state.activeConversationId)) {
    return state.activeConversationId;
  }
  const conversation = newConversation();
  state.conversations.unshift(conversation);
  state.activeConversationId = conversation.id;
  return conversation.id;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      activeAgentId: 'general',
      temperature: 0.7,
      sidebarOpen: false,
      isLoading: false,
      deviceMetrics: null,
      createConversation: () => {
        const conversation = newConversation();
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: conversation.id,
          sidebarOpen: false
        }));
        return conversation.id;
      },
      deleteConversation: (id) => {
        set((state) => {
          const filtered = state.conversations.filter((conversation) => conversation.id !== id);
          const nextActive = state.activeConversationId === id ? filtered[0]?.id ?? null : state.activeConversationId;
          return { conversations: filtered, activeConversationId: nextActive };
        });
      },
      setActiveConversation: (id) => set({ activeConversationId: id, sidebarOpen: false }),
      updateConversationTitle: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map((conversation) =>
            conversation.id === id
              ? { ...conversation, title: title.trim() || 'محادثة جديدة', updatedAt: now() }
              : conversation
          )
        }));
      },
      addMessage: (conversationId, message) => {
        const created: Message = {
          id: message.id ?? uuid(),
          createdAt: message.createdAt ?? now(),
          role: message.role,
          content: message.content,
          pending: message.pending,
          error: message.error
        };
        set((state) => {
          const mutableState = { ...state, conversations: [...state.conversations] } as ChatState;
          const targetId = conversationId || ensureConversation(mutableState);
          const updated = mutableState.conversations.map((conversation) => {
            if (conversation.id !== targetId) return conversation;
            const title = conversation.messages.length === 0 && created.role === 'user' ? makeTitle(created.content) : conversation.title;
            return {
              ...conversation,
              title,
              messages: [...conversation.messages, created],
              updatedAt: now()
            };
          });
          return { conversations: updated, activeConversationId: targetId };
        });
        return created;
      },
      updateMessage: (conversationId, messageId, patch) => {
        set((state) => ({
          conversations: state.conversations.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  messages: conversation.messages.map((message) =>
                    message.id === messageId ? { ...message, ...patch } : message
                  ),
                  updatedAt: now()
                }
              : conversation
          )
        }));
      },
      clearAll: () => set({ conversations: [], activeConversationId: null, sidebarOpen: false }),
      setActiveAgent: (agentId) => set({ activeAgentId: agentId }),
      setTemperature: (temperature) => set({ temperature }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setDeviceMetrics: (metrics) => set({ deviceMetrics: metrics })
    }),
    {
      name: 'rkn-ai-chat-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        activeAgentId: state.activeAgentId,
        temperature: state.temperature
      })
    }
  )
);

export function getActiveConversation(state: ChatState) {
  return state.conversations.find((conversation) => conversation.id === state.activeConversationId) ?? null;
}
