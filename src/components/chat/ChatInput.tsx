'use client';

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Loader2, SendHorizonal, WandSparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type ChatInputProps = {
  disabled?: boolean;
  onSend: (message: string) => void | Promise<void>;
};

export function ChatInput({ disabled, onSend }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = '0px';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 132)}px`;
  }, [value]);

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    setValue('');
    await onSend(text);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  };

  return (
    <form
      onSubmit={submit}
      className="shrink-0 border-t border-white/10 bg-background/88 px-3 py-3 backdrop-blur-2xl md:px-6"
      dir="rtl"
    >
      <div className="mx-auto flex max-w-5xl items-end gap-2 rounded-[1.6rem] border border-white/10 bg-white/[0.055] p-2 shadow-soft transition focus-within:border-primary/45 focus-within:bg-white/[0.075]">
        <div className="hidden h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary sm:grid">
          <WandSparkles className="h-5 w-5" />
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="اكتب رسالتك إلى RKN.AI..."
          disabled={disabled}
          className="max-h-32 min-h-11 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-2 py-2.5 text-base leading-7 text-white outline-none placeholder:text-muted-foreground disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className={cn(
            'grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-white shadow-glow transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'
          )}
          aria-label="إرسال"
        >
          {disabled ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizonal className="h-5 w-5" />}
        </button>
      </div>
      <div className="mx-auto mt-2 max-w-5xl px-2 text-center text-[11px] text-muted-foreground">
        Enter للإرسال · Shift + Enter لسطر جديد · قد يخطئ الذكاء الاصطناعي، راجع المعلومات المهمة.
      </div>
    </form>
  );
}
