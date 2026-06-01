'use client';

import { EmptyState } from '@/components/chat/EmptyState';
import { MessageList } from '@/components/chat/MessageList';
import type { Conversation } from '@/types';

export function ChatArea({ conversation, onPrompt }: { conversation: Conversation | null; onPrompt: (prompt: string) => void }) {
  return (
    <section className="relative min-h-0 flex-1 overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,.18),transparent_34%),radial-gradient(circle_at_90%_90%,rgba(34,211,238,.09),transparent_30%)]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:36px_36px]" />
      <div className="relative h-full min-h-0">
        {!conversation || conversation.messages.length === 0 ? (
          <EmptyState onPrompt={onPrompt} />
        ) : (
          <MessageList messages={conversation.messages} />
        )}
      </div>
    </section>
  );
}
