'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  label: string;
  variant?: 'ghost' | 'solid' | 'danger';
};

export function IconButton({ children, label, className, variant = 'ghost', ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-sm transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'ghost' && 'border-white/10 bg-white/[0.04] text-white/85 hover:bg-white/[0.08]',
        variant === 'solid' && 'border-primary/40 bg-primary text-primary-foreground shadow-glow hover:bg-primary/90',
        variant === 'danger' && 'border-destructive/35 bg-destructive/15 text-destructive hover:bg-destructive/25',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
