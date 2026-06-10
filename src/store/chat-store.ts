'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { makeTitle } from '@/lib/utils';
import type { AgentId, Conversation, GeminiModel, Message } from '@/types';

type ChatState = {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeAgentId: AgentId;
  model: GeminiModel;
  temperature: number;
  sidebarOpen: boolean;
  isLoading: boolean;
  createConversation: () => string;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string) => void;
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'createdAt'> & Partial<Pick<Message, 'id' | 'createdAt'>>) => Message;
  updateMessage: (conversationId: string, messageId: string, patch: Partial<Message>) => void;
  appendToMessage: (conversationId: string, messageId: string, delta: string) => void;
  clearAll: () => void;
  setActiveAgent: (agentId: AgentId) => void;
  setModel: (model: GeminiModel) => void;
  setTemperature: (temperature: number) => void;
  setSidebarOpen: (open: boolean) => void;
  setIsLoading: (loading: boolean) => void;
};

const now = () => new Date().toISOString();

function newConversation(): Conversation {
  const timestamp = now();
  return { id: uuid(), title: 'محادثة جديدة', messages: [], createdAt: timestamp, updatedAt: timestamp };
}

function stripHeavyData(conversations: Conversation[]): Conversation[] {
  return conversations.map((conversation) => ({
    ...conversation,
    messages: conversation.messages.map((message) =>
      message.attachments?.length
        ? { ...message, attachments: message.attachments.map((attachment) => ({ ...attachment, data: '' })) }
        : message
    )
  }));
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      conversations: [],
      activeConversationId: null,
      activeAgentId: 'general',
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      sidebarOpen: false,
      isLoading: false,
      createConversation: () => {
        const conversation = newConversation();
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: conversation.id,
          sidebarOpen: false
        }));
        return conversation.id;
      },
      deleteConversation: (id) =>
        set((state) => {
          const filtered = state.conversations.filter((conversation) => conversation.id !== id);
          const nextActive = state.activeConversationId === id ? filtered[0]?.id ?? null : state.activeConversationId;
          return { conversations: filtered, activeConversationId: nextActive };
        }),
      setActiveConversation: (id) => set({ activeConversationId: id, sidebarOpen: false }),
      addMessage: (conversationId, message) => {
        const created: Message = {
          id: message.id ?? uuid(),
          createdAt: message.createdAt ?? now(),
          role: message.role,
          content: message.content,
          attachments: message.attachments,
          pending: message.pending,
          error: message.error
        };
        set((state) => ({
          conversations: state.conversations.map((conversation) => {
            if (conversation.id !== conversationId) return conversation;
            const title =
              conversation.messages.length === 0 && created.role === 'user'
                ? makeTitle(created.content || 'مرفقات جديدة')
                : conversation.title;
            return { ...conversation, title, messages: [...conversation.messages, created], updatedAt: now() };
          })
        }));
        return created;
      },
      updateMessage: (conversationId, messageId, patch) =>
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
        })),
      appendToMessage: (conversationId, messageId, delta) =>
        set((state) => ({
          conversations: state.conversations.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  messages: conversation.messages.map((message) =>
                    message.id === messageId ? { ...message, content: message.content + delta, pending: false } : message
                  ),
                  updatedAt: now()
                }
              : conversation
          )
        })),
      clearAll: () => set({ conversations: [], activeConversationId: null, sidebarOpen: false }),
      setActiveAgent: (agentId) => set({ activeAgentId: agentId }),
      setModel: (model) => set({ model }),
      setTemperature: (temperature) => set({ temperature }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setIsLoading: (loading) => set({ isLoading: loading })
    }),
    {
      name: 'rkn-ai-chat-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        conversations: stripHeavyData(state.conversations),
        activeConversationId: state.activeConversationId,
        activeAgentId: state.activeAgentId,
        model: state.model,
        temperature: state.temperature
      })
    }
  )
);
