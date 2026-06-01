'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ChatArea } from '@/components/chat/ChatArea';
import { ChatInput } from '@/components/chat/ChatInput';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { SettingsDialog } from '@/components/ui/SettingsDialog';
import { lockViewport, readDeviceMetrics } from '@/lib/device';
import { useChatStore } from '@/store/chat-store';
import type { ChatResponse } from '@/types';

export function AppShell() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const conversations = useChatStore((state) => state.conversations);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const activeAgentId = useChatStore((state) => state.activeAgentId);
  const temperature = useChatStore((state) => state.temperature);
  const sidebarOpen = useChatStore((state) => state.sidebarOpen);
  const isLoading = useChatStore((state) => state.isLoading);
  const deviceMetrics = useChatStore((state) => state.deviceMetrics);

  const createConversation = useChatStore((state) => state.createConversation);
  const deleteConversation = useChatStore((state) => state.deleteConversation);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const clearAll = useChatStore((state) => state.clearAll);
  const setActiveAgent = useChatStore((state) => state.setActiveAgent);
  const setTemperature = useChatStore((state) => state.setTemperature);
  const setSidebarOpen = useChatStore((state) => state.setSidebarOpen);
  const setIsLoading = useChatStore((state) => state.setIsLoading);
  const setDeviceMetrics = useChatStore((state) => state.setDeviceMetrics);

  useEffect(() => {
    const update = () => setDeviceMetrics(readDeviceMetrics());
    update();
    const cleanup = lockViewport();
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('orientationchange', update, { passive: true });
    return () => {
      cleanup?.();
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, [setDeviceMetrics]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [activeConversationId, conversations]
  );

  const isMobile = deviceMetrics?.isMobile ?? true;

  const startNewChat = () => {
    createConversation();
    toast.success('تم إنشاء محادثة جديدة');
  };

  const sendMessage = async (text: string) => {
    if (isLoading) return;

    const targetConversationId = activeConversationId ?? createConversation();
    const baseMessages = conversations.find((conversation) => conversation.id === targetConversationId)?.messages ?? [];

    addMessage(targetConversationId, { role: 'user', content: text });
    const assistantMessage = addMessage(targetConversationId, {
      role: 'assistant',
      content: '',
      pending: true
    });

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: targetConversationId,
          agentId: activeAgentId,
          temperature,
          messages: [...baseMessages.map(({ role, content }) => ({ role, content })), { role: 'user', content: text }]
        })
      });

      const data = (await response.json()) as ChatResponse & { error?: string; details?: string };
      if (!response.ok) {
        throw new Error(data.details || data.error || 'فشل الطلب');
      }

      updateMessage(targetConversationId, assistantMessage.id, {
        content: data.message,
        pending: false
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'حدث خطأ غير متوقع.';
      updateMessage(targetConversationId, assistantMessage.id, {
        content: `عذرًا، تعذر إكمال الطلب.\n\n> ${message}`,
        pending: false,
        error: true
      });
      toast.error('تعذر الاتصال بخدمة Gemini');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteOne = (id: string) => {
    if (window.confirm('هل تريد حذف هذه المحادثة؟')) {
      deleteConversation(id);
      toast.success('تم حذف المحادثة');
    }
  };

  const clearConversations = () => {
    if (window.confirm('سيتم حذف كل المحادثات المحفوظة محليًا. هل أنت متأكد؟')) {
      clearAll();
      toast.success('تم حذف كل المحادثات');
      setSettingsOpen(false);
    }
  };

  return (
    <main
      className="app-safe-area relative h-[var(--app-height)] w-[var(--app-width)] overflow-hidden bg-background text-foreground"
      dir="ltr"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative grid h-full min-h-0 grid-rows-[var(--header-height)_minmax(0,1fr)_auto] overflow-hidden rounded-none border-white/10 bg-background/70 md:border-x">
        <Header
          isMobile={isMobile}
          onOpenSidebar={() => setSidebarOpen(true)}
          onNewChat={startNewChat}
          onOpenSettings={() => setSettingsOpen(true)}
          deviceMetrics={deviceMetrics}
        />

        <div className="flex min-h-0 overflow-hidden" dir="ltr">
          <Sidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            isMobile={isMobile}
            open={sidebarOpen}
            activeAgentId={activeAgentId}
            temperature={temperature}
            onClose={() => setSidebarOpen(false)}
            onNewChat={startNewChat}
            onSelectConversation={setActiveConversation}
            onDeleteConversation={deleteOne}
            onSelectAgent={setActiveAgent}
            onTemperatureChange={setTemperature}
          />
          <ChatArea conversation={activeConversation} onPrompt={sendMessage} />
        </div>

        <ChatInput disabled={isLoading} onSend={sendMessage} />
      </div>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onClearAll={clearConversations}
        deviceMetrics={deviceMetrics}
        conversationsCount={conversations.length}
      />
    </main>
  );
}
