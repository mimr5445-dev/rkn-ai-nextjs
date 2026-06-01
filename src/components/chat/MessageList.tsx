'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import type { Message } from '@/types';

export function MessageList({ messages }: { messages: Message[] }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div ref={scrollRef} className="h-full min-h-0 overflow-y-auto overflow-x-hidden px-3 py-5 md:px-6" dir="rtl">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 pb-2">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>
    </div>
  );
}
