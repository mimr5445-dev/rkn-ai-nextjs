'use client';

import { Check, Copy, Sparkles, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn('flex w-full gap-3', isUser ? 'justify-end' : 'justify-start')}
      dir="rtl"
    >
      {!isUser && (
        <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-cyan-400 shadow-glow">
          <Sparkles className="h-4.5 w-4.5 text-white" />
        </div>
      )}

      <div className={cn('group max-w-[min(780px,92%)]', isUser && 'order-first')}>
        <div
          className={cn(
            'relative overflow-hidden rounded-[1.35rem] border px-4 py-3 text-sm shadow-soft md:text-[15px]',
            isUser
              ? 'border-primary/35 bg-gradient-to-br from-primary/95 to-fuchsia-600/90 text-white'
              : message.error
                ? 'border-destructive/35 bg-destructive/10 text-destructive-foreground'
                : 'border-white/10 bg-white/[0.055] text-foreground backdrop-blur-xl'
          )}
        >
          {message.pending && (
            <div className="absolute inset-x-0 top-0 h-px overflow-hidden bg-white/10">
              <div className="h-full w-1/2 animate-shimmer bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
            </div>
          )}

          {message.pending ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              RKN.AI يفكر الآن...
            </div>
          ) : isUser ? (
            <div className="whitespace-pre-wrap leading-8">{message.content}</div>
          ) : (
            <div className="message-markdown">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    if (match) {
                      return (
                        <SyntaxHighlighter
                          // eslint-disable-next-line react/no-children-prop
                          children={String(children).replace(/\n$/, '')}
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            borderRadius: '1rem',
                            background: '#090b18',
                            fontSize: '0.86rem'
                          }}
                        />
                      );
                    }
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div className={cn('mt-1 flex items-center gap-2 px-2 text-[11px] text-muted-foreground', isUser ? 'justify-end' : 'justify-start')}>
          <span>{new Date(message.createdAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}</span>
          {!message.pending && (
            <button type="button" onClick={copy} className="inline-flex items-center gap-1 hover:text-white">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'نُسخ' : 'نسخ'}
            </button>
          )}
        </div>
      </div>

      {isUser && (
        <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.07]">
          <UserRound className="h-4.5 w-4.5 text-white" />
        </div>
      )}
    </motion.article>
  );
}
