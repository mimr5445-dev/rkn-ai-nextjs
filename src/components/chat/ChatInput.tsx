'use client';

import { ChangeEvent, FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { FileText, Image as ImageIcon, Loader2, Paperclip, SendHorizonal, WandSparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Attachment } from '@/types';

const MAX_FILES = 4;
const MAX_FILE_SIZE = 7 * 1024 * 1024;
const ACCEPTED_FILES = 'image/*,.pdf,.txt,.md,.csv,.json,.js,.ts,.tsx,.jsx,.html,.css,.xml,.log';

type ChatInputProps = {
  disabled?: boolean;
  onSend: (message: string, attachments?: Attachment[]) => void | Promise<void>;
};

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

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function ChatInput({ disabled, onSend }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = '0px';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 132)}px`;
  }, [value]);

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    const text = value.trim();
    if ((!text && attachments.length === 0) || disabled || isReadingFiles) return;

    const filesToSend = attachments;
    setValue('');
    setAttachments([]);
    await onSend(text || 'حلّل المرفقات المرسلة.', filesToSend);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  };

  const onFilesSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    const availableSlots = MAX_FILES - attachments.length;
    if (availableSlots <= 0) {
      toast.warning(`يمكنك إرفاق ${MAX_FILES} ملفات كحد أقصى في الرسالة الواحدة.`);
      return;
    }

    const accepted = files.slice(0, availableSlots).filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`الملف ${file.name} أكبر من الحد المسموح (${formatSize(MAX_FILE_SIZE)}).`);
        return false;
      }
      return true;
    });

    if (files.length > availableSlots) {
      toast.warning(`تم أخذ أول ${availableSlots} ملف فقط.`);
    }

    if (accepted.length === 0) return;

    try {
      setIsReadingFiles(true);
      const nextAttachments = await Promise.all(accepted.map(fileToAttachment));
      setAttachments((current) => [...current, ...nextAttachments]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذر تجهيز المرفقات.');
    } finally {
      setIsReadingFiles(false);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((current) => current.filter((attachment) => attachment.id !== id));
  };

  return (
    <form
      onSubmit={submit}
      className="shrink-0 border-t border-white/10 bg-background/88 px-3 py-3 backdrop-blur-2xl md:px-6"
      dir="rtl"
    >
      {attachments.length > 0 && (
        <div className="mx-auto mb-2 flex max-w-5xl gap-2 overflow-x-auto pb-1">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex max-w-[220px] shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] p-2 text-xs text-white"
            >
              {attachment.kind === 'image' ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:${attachment.mimeType};base64,${attachment.data}`}
                    alt={attachment.name}
                    className="h-10 w-10 rounded-xl object-cover"
                  />
                </>
              ) : (
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1 text-right">
                <div className="truncate font-bold">{attachment.name}</div>
                <div className="text-[10px] text-muted-foreground" dir="ltr">
                  {formatSize(attachment.size)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeAttachment(attachment.id)}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-muted-foreground transition hover:text-white"
                aria-label="حذف المرفق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mx-auto flex max-w-5xl items-end gap-2 rounded-[1.6rem] border border-white/10 bg-white/[0.055] p-2 shadow-soft transition focus-within:border-primary/45 focus-within:bg-white/[0.075]">
        <div className="hidden h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary sm:grid">
          <WandSparkles className="h-5 w-5" />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILES}
          className="hidden"
          onChange={onFilesSelected}
          disabled={disabled || isReadingFiles}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isReadingFiles || attachments.length >= MAX_FILES}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.045] text-muted-foreground transition hover:bg-white/[0.08] hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="إضافة صورة أو ملف"
          title="إضافة صورة أو ملف"
        >
          {isReadingFiles ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="اكتب رسالتك أو أرفق صورة/ملف..."
          disabled={disabled}
          className="max-h-32 min-h-11 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-2 py-2.5 text-base leading-7 text-white outline-none placeholder:text-muted-foreground disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled || isReadingFiles || (!value.trim() && attachments.length === 0)}
          className={cn(
            'grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-white shadow-glow transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50'
          )}
          aria-label="إرسال"
        >
          {disabled ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizonal className="h-5 w-5" />}
        </button>
      </div>
      <div className="mx-auto mt-2 flex max-w-5xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-2 text-center text-[11px] text-muted-foreground">
        <span>Enter للإرسال · Shift + Enter لسطر جديد</span>
        <span className="inline-flex items-center gap-1">
          <ImageIcon className="h-3.5 w-3.5" /> صور وملفات حتى {formatSize(MAX_FILE_SIZE)}
        </span>
      </div>
    </form>
  );
}
