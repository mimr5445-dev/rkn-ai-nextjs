'use client';

import { Brain, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Markdown } from '@/components/Markdown';
import { cn } from '@/lib/utils';

export function ThinkingPanel({ reasoning, live = false, thinkingMs }: { reasoning: string; live?: boolean; thinkingMs?: number }) {
  const [open, setOpen] = useState(live);

  useEffect(() => {
    if (live) setOpen(true);
    else setOpen(false);
  }, [live]);

  if (!reasoning.trim()) return null;

  const seconds = typeof thinkingMs === 'number' ? Math.max(1, Math.round(thinkingMs / 1000)) : null;
  const title = live ? 'يفكّر…' : seconds ? `فكّر لمدة ${seconds} ثانية` : 'طريقة التفكير';

  return (
    <section className="thinking-card mb-4 overflow-hidden rounded-2xl border border-line bg-sidebar">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-sm text-ink"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 font-medium">
          <Brain className={cn('h-4 w-4 text-clay', live && 'animate-pulse')} />
          <span className={cn(live && 'shimmer-text')}>{title}</span>
        </span>
        <ChevronDown className={cn('h-4 w-4 text-subtle transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="thinking-stream border-t border-line px-4 py-3 text-sm text-subtle">
          <Markdown content={reasoning} />
        </div>
      )}
    </section>
  );
}
