import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function makeTitle(input: string) {
  const normalized = input.replace(/\s+/g, ' ').trim();
  if (!normalized) return 'محادثة جديدة';
  return normalized.length > 42 ? `${normalized.slice(0, 42)}…` : normalized;
}

export function safeJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
