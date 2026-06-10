'use client';

import { Code2, GraduationCap, Lightbulb, PenLine } from 'lucide-react';

const suggestions = [
  { icon: Lightbulb, text: 'اشرح لي فكرة معقّدة ببساطة' },
  { icon: Code2, text: 'اكتب لي مكوّن React احترافي' },
  { icon: PenLine, text: 'حسّن صياغة هذا النص' },
  { icon: GraduationCap, text: 'ضع لي خطة تعلّم لأسبوع' }
];

export function EmptyState({ onPrompt }: { onPrompt: (prompt: string) => void }) {
  return (
    <div className="flex h-full items-center justify-center px-4">
      <div className="w-full max-w-thread">
        <h1 className="text-center font-serif text-3xl text-ink md:text-4xl">مساء الخير، كيف أساعدك؟</h1>
        <div className="mt-8 grid gap-2 sm:grid-cols-2">
          {suggestions.map((item) => (
            <button
              key={item.text}
              type="button"
              onClick={() => onPrompt(item.text)}
              className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-right text-sm text-ink transition hover:border-clay hover:bg-clay-soft"
            >
              <item.icon className="h-4 w-4 shrink-0 text-clay" />
              <span>{item.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
