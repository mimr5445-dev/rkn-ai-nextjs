'use client';

import { useEffect, useMemo, useState } from 'react';
import { Menu, Plus } from 'lucide-react';
import { Composer } from '@/components/Composer';
import { EmptyState } from '@/components/EmptyState';
import { MessageList } from '@/components/MessageList';
import { Sidebar } from '@/components/Sidebar';
import { useChatStore } from '@/store/chat-store';
import type { Attachment, StreamEvent } from '@/types';

export function ChatApp() {
  const [isMobile, setIsMobile] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const conversations = useChatStore((state) => state.conversations);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const activeAgentId = useChatStore((state) => state.activeAgentId);
  const model = useChatStore((state) => state.model);
  const temperature = useChatStore((state) => state.temperature);
  const thinking = useChatStore((state) => state.thinking);
  const reasoningLevel = useChatStore((state) => state.reasoningLevel);
  const sidebarOpen = useChatStore((state) => state.sidebarOpen);
  const isLoading = useChatStore((state) => state.isLoading);

  const createConversation = useChatStore((state) => state.createConversation);
  const deleteConversation = useChatStore((state) => state.deleteConversation);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const appendToMessage = useChatStore((state) => state.appendToMessage);
  const appendToReasoning = useChatStore((state) => state.appendToReasoning);
  const clearAll = useChatStore((state) => state.clearAll);
  const setActiveAgent = useChatStore((state) => state.setActiveAgent);
  const setModel = useChatStore((state) => state.setModel);
  const setTemperature = useChatStore((state) => state.setTemperature);
  const setThinking = useChatStore((state) => state.setThinking);
  const setReasoningLevel = useChatStore((state) => state.setReasoningLevel);
  const setSidebarOpen = useChatStore((state) => state.setSidebarOpen);
  const setIsLoading = useChatStore((state) => state.setIsLoading);

  useEffect(() => {
    setHydrated(true);
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [activeConversationId, conversations]
  );

  const startNewChat = () => {
    createConversation();
  };

  const sendMessage = async (text: string, attachments: Attachment[]) => {
    if (isLoading) return;
    const targetId = activeConversationId ?? createConversation();
    const history = useChatStore.getState().conversations.find((conversation) => conversation.id === targetId)?.messages ?? [];

    addMessage(targetId, { role: 'user', content: text, attachments });
    const assistant = addMessage(targetId, { role: 'assistant', content: '', reasoning: '', pending: true });
    setIsLoading(true);

    const startedAt = Date.now();
    let sawFirstText = false;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: targetId,
          agentId: activeAgentId,
          model,
          temperature,
          thinking,
          reasoningLevel,
          stream: true,
          messages: [
            ...history.map(({ role, content, attachments }) => ({ role, content, attachments })),
            { role: 'user', content: text, attachments }
          ]
        })
      });

      if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => ({}))) as { details?: string; error?: string };
        throw new Error(data.details || data.error || 'فشل الطلب');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';

      const consumeLine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        let event: StreamEvent;
        try {
          event = JSON.parse(trimmed) as StreamEvent;
        } catch {
          return;
        }
        if (!event.c) return;

        if (event.t === 'think') {
          appendToReasoning(targetId, assistant.id, event.c);
          return;
        }

        if (!sawFirstText) {
          sawFirstText = true;
          updateMessage(targetId, assistant.id, { thinkingMs: Date.now() - startedAt });
        }
        accumulatedText += event.c;
        appendToMessage(targetId, assistant.id, event.c);
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) consumeLine(line);
      }

      if (buffer.trim()) consumeLine(buffer);

      if (!accumulatedText.trim()) {
        updateMessage(targetId, assistant.id, { content: 'لم يرد Gemini بأي محتوى.', pending: false, error: true });
      } else {
        updateMessage(targetId, assistant.id, { pending: false });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'حدث خطأ غير متوقع.';
      updateMessage(targetId, assistant.id, {
        content: `عذرًا، تعذر إكمال الطلب.\n\n> ${message}`,
        pending: false,
        error: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = (id: string) => {
    if (window.confirm('حذف هذه المحادثة؟')) deleteConversation(id);
  };

  const onSettings = () => {
    if (window.confirm('حذف كل المحادثات المحفوظة محليًا؟')) clearAll();
  };

  if (!hydrated) return null;

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-paper">
      {!isMobile && (
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          activeAgentId={activeAgentId}
          model={model}
          temperature={temperature}
          thinking={thinking}
          reasoningLevel={reasoningLevel}
          isMobile={false}
          open
          onClose={() => setSidebarOpen(false)}
          onNewChat={startNewChat}
          onSelectConversation={setActiveConversation}
          onDeleteConversation={onDelete}
          onSelectAgent={setActiveAgent}
          onSelectModel={setModel}
          onTemperatureChange={setTemperature}
          onToggleThinking={setThinking}
          onSelectReasoningLevel={setReasoningLevel}
          onOpenSettings={onSettings}
        />
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line px-3">
          <div className="flex min-w-0 items-center gap-2">
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-subtle hover:bg-sidebar" aria-label="القائمة">
                <Menu className="h-5 w-5" />
              </button>
            )}
            <span className="truncate text-sm font-medium text-ink">{activeConversation?.title ?? 'محادثة جديدة'}</span>
          </div>
          <button onClick={startNewChat} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-subtle hover:bg-sidebar" aria-label="جديدة">
            <Plus className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1">
          {!activeConversation || activeConversation.messages.length === 0 ? (
            <EmptyState onPrompt={(prompt) => sendMessage(prompt, [])} />
          ) : (
            <MessageList messages={activeConversation.messages} />
          )}
        </div>

        <Composer disabled={isLoading} onSend={sendMessage} />
      </main>

      {isMobile && (
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          activeAgentId={activeAgentId}
          model={model}
          temperature={temperature}
          thinking={thinking}
          reasoningLevel={reasoningLevel}
          isMobile
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNewChat={startNewChat}
          onSelectConversation={setActiveConversation}
          onDeleteConversation={onDelete}
          onSelectAgent={setActiveAgent}
          onSelectModel={setModel}
          onTemperatureChange={setTemperature}
          onToggleThinking={setThinking}
          onSelectReasoningLevel={setReasoningLevel}
          onOpenSettings={onSettings}
        />
      )}
    </div>
  );
}
