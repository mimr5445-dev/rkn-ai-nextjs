'use client';

import { ChangeEvent, FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { ArrowUp, FileText, Loader2, Paperclip, X } from 'lucide-react';
import { cn, formatSize } from '@/lib/utils';
import type { Attachment } from '@/types';

const MAX_FILES = 4;
const MAX_FILE_SIZE = 7 * 1024 * 1024;
const ACCEPTED = 'image/*,.pdf,.txt,.md,.csv,.json,.js,.ts,.tsx,.jsx,.html,.css';

function makeId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function fileToAttachment(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`تعذر قراءة الملف: ${file.name}`));
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const data = result.includes(',') ? result.split(',')[1] : result;
      resolve({
        id: makeId(),
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        data,
        kind: file.type.startsWith('image/') ? 'image' : 'file'
      });
    };
    reader.readAsDataURL(file);
  });
}

type ComposerProps = {
  disabled?: boolean;
  onSend: (message: string, attachments: Attachment[]) => void | Promise<void>;
};

export function Composer({ disabled, onSend }: ComposerProps) {
  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [reading, setReading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = '0px';
    element.style.height = `${Math.min(element.scrollHeight, 200)}px`;
  }, [value]);

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    const text = value.trim();
    if ((!text && attachments.length === 0) || disabled || reading) return;
    const files = attachments;
    setValue('');
    setAttachments([]);
    await onSend(text || 'حلّل المرفقات المرسلة.', files);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  };

  const onFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;

    const slots = MAX_FILES - attachments.length;
    if (slots <= 0) return;
    const accepted = files.slice(0, slots).filter((file) => file.size <= MAX_FILE_SIZE);
    if (!accepted.length) return;

    try {
      setReading(true);
      const next = await Promise.all(accepted.map(fileToAttachment));
      setAttachments((current) => [...current, ...next]);
    } finally {
      setReading(false);
    }
  };

  return (
    <div className="px-4 pb-4 md:px-6">
      <form
        onSubmit={submit}
        className="mx-auto w-full max-w-thread rounded-[1.6rem] border border-line bg-surface p-2 shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition focus-within:border-clay"
      >
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2 px-1">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="flex max-w-full items-center gap-2 rounded-xl border border-line bg-paper px-2 py-1.5 text-xs">
                <FileText className="h-3.5 w-3.5 shrink-0 text-clay" />
                <span className="max-w-[140px] truncate">{attachment.name}</span>
                <span className="text-subtle" dir="ltr">
                  {formatSize(attachment.size)}
                </span>
                <button
                  type="button"
                  onClick={() => setAttachments((current) => current.filter((item) => item.id !== attachment.id))}
                  aria-label="حذف المرفق"
                >
                  <X className="h-3.5 w-3.5 text-subtle hover:text-ink" />
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="اسأل RKN.AI…"
          disabled={disabled}
          className="max-h-52 min-h-[44px] w-full resize-none bg-transparent px-2 py-2 leading-7 outline-none placeholder:text-subtle"
        />

        <div className="flex items-center justify-between px-1">
          <input ref={fileRef} type="file" multiple accept={ACCEPTED} className="hidden" onChange={onFiles} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={disabled || reading || attachments.length >= MAX_FILES}
            className="grid h-9 w-9 place-items-center rounded-full text-subtle transition hover:bg-paper hover:text-ink disabled:opacity-40"
            aria-label="إرفاق ملف"
            title={`إرفاق ملفات حتى ${formatSize(MAX_FILE_SIZE)}`}
          >
            {reading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
          </button>
          <button
            type="submit"
            disabled={disabled || reading || (!value.trim() && attachments.length === 0)}
            className={cn('grid h-9 w-9 place-items-center rounded-full bg-clay text-clay-ink transition hover:opacity-90 active:scale-95 disabled:opacity-40')}
            aria-label="إرسال"
          >
            {disabled ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" />}
          </button>
        </div>
      </form>
      <p className="mx-auto mt-2 max-w-thread text-center text-xs text-subtle">Enter للإرسال · Shift + Enter لسطر جديد</p>
    </div>
  );
}
