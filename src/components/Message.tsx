'use client';

import { Check, Copy, FileText } from 'lucide-react';
import { useState } from 'react';
import { Markdown } from '@/components/Markdown';
import { ThinkingPanel } from '@/components/ThinkingPanel';
import { cn, formatSize } from '@/lib/utils';
import type { Attachment, Message as MessageType } from '@/types';

function AttachmentChip({ attachment }: { attachment: Attachment }) {
  if (attachment.kind === 'image' && attachment.data) {
    return (
      <a
        href={`data:${attachment.mimeType};base64,${attachment.data}`}
        target="_blank"
        rel="noreferrer"
        className="block"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:${attachment.mimeType};base64,${attachment.data}`}
          alt={attachment.name}
          className="max-h-60 w-auto rounded-xl border border-line object-cover"
        />
      </a>
    );
  }

  return (
    <div className="flex max-w-full items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm">
      <FileText className="h-4 w-4 shrink-0 text-clay" />
      <span className="truncate">{attachment.name}</span>
      <span className="shrink-0 text-xs text-subtle" dir="ltr">
        {formatSize(attachment.size)}
      </span>
    </div>
  );
}

export function Message({ message }: { message: MessageType }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const hasReasoning = Boolean(message.reasoning?.trim());
  const liveThinking = Boolean(message.pending && !message.content && hasReasoning);

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  if (isUser) {
    return (
      <div className="flex animate-fadeUp justify-start">
        <div className="max-w-[85%] space-y-2">
          {message.attachments?.length ? (
            <div className="flex flex-wrap gap-2">
              {message.attachments.map((attachment) => (
                <AttachmentChip key={attachment.id} attachment={attachment} />
              ))}
            </div>
          ) : null}
          {message.content ? (
            <div className="whitespace-pre-wrap rounded-2xl bg-userbubble px-4 py-2.5 leading-8 text-ink">
              {message.content}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="group animate-fadeUp">
      {hasReasoning && (
        <ThinkingPanel reasoning={message.reasoning ?? ''} live={liveThinking} thinkingMs={message.thinkingMs} />
      )}

      {message.pending && !message.content && !hasReasoning ? (
        <div className="flex items-center gap-1 py-1 text-subtle">
          <span className="h-2 w-2 animate-blink rounded-full bg-clay" />
          <span className="h-2 w-2 animate-blink rounded-full bg-clay [animation-delay:200ms]" />
          <span className="h-2 w-2 animate-blink rounded-full bg-clay [animation-delay:400ms]" />
        </div>
      ) : message.content ? (
        <div className={cn(message.error && 'rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700')}>
          <Markdown content={message.content} />
        </div>
      ) : null}

      {!message.pending && message.content && !message.error && (
        <button
          type="button"
          onClick={copy}
          className="mt-2 inline-flex items-center gap-1 text-xs text-subtle opacity-0 transition group-hover:opacity-100 hover:text-ink"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'نُسخ' : 'نسخ'}
        </button>
      )}
    </div>
  );
}
