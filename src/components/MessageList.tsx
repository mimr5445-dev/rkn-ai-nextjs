'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/components/Message';
import type { Message as MessageType } from '@/types';

export function MessageList({ messages }: { messages: MessageType[] }) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastLen = messages[messages.length - 1]?.content.length ?? 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, lastLen]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-thread flex-col gap-7 px-4 py-8 md:px-6">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
