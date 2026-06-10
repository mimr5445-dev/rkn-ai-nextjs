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

export function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
