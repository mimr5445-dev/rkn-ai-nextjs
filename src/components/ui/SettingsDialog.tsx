'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { Database, Info, ShieldCheck, SlidersHorizontal, X } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import type { DeviceMetrics } from '@/types';

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClearAll: () => void;
  deviceMetrics: DeviceMetrics | null;
  conversationsCount: number;
};

export function SettingsDialog({ open, onOpenChange, onClearAll, deviceMetrics, conversationsCount }: SettingsDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-sm" />
        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="fixed left-1/2 top-1/2 z-[80] max-h-[min(680px,86dvh)] w-[min(94vw,520px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border border-white/10 bg-[#090b1b] p-0 text-white shadow-soft"
            dir="rtl"
          >
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
              <div>
                <Dialog.Title className="text-base font-black">إعدادات RKN.AI</Dialog.Title>
                <Dialog.Description className="text-xs text-muted-foreground">
                  معلومات الجهاز، الخصوصية، وإدارة التخزين المحلي.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <IconButton label="إغلاق الإعدادات">
                  <X className="h-5 w-5" />
                </IconButton>
              </Dialog.Close>
            </div>

            <div className="space-y-3 p-4">
              <section className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
                <div className="mb-3 flex items-center gap-2 font-bold">
                  <Info className="h-5 w-5 text-cyan-300" />
                  قياسات الجهاز المقفلة
                </div>
                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2" dir="ltr">
                  <div className="rounded-2xl bg-black/20 p-3">inner: {deviceMetrics ? `${deviceMetrics.innerWidth}×${deviceMetrics.innerHeight}` : '—'}</div>
                  <div className="rounded-2xl bg-black/20 p-3">screen: {deviceMetrics ? `${deviceMetrics.screenWidth}×${deviceMetrics.screenHeight}` : '—'}</div>
                  <div className="rounded-2xl bg-black/20 p-3">DPR: {deviceMetrics?.devicePixelRatio ?? '—'}</div>
                  <div className="rounded-2xl bg-black/20 p-3">mode: {deviceMetrics?.isMobile ? 'mobile' : 'desktop'}</div>
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
                <div className="mb-3 flex items-center gap-2 font-bold">
                  <ShieldCheck className="h-5 w-5 text-emerald-300" />
                  الخصوصية والأمان
                </div>
                <p className="text-sm leading-7 text-muted-foreground">
                  مفتاح Gemini لا يُرسل للمتصفح مطلقًا. كل الطلبات تمر عبر API Routes على الخادم: /api/chat و /api/agents و /api/swarm.
                </p>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
                <div className="mb-3 flex items-center gap-2 font-bold">
                  <Database className="h-5 w-5 text-primary" />
                  التخزين المحلي
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-black/20 p-3 text-sm text-muted-foreground">
                  <span>عدد المحادثات المحفوظة</span>
                  <strong className="text-white">{conversationsCount}</strong>
                </div>
                <button
                  type="button"
                  onClick={onClearAll}
                  className="mt-3 w-full rounded-2xl border border-destructive/35 bg-destructive/15 px-4 py-3 text-sm font-bold text-destructive transition hover:bg-destructive/25"
                >
                  حذف كل المحادثات
                </button>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
                <div className="mb-2 flex items-center gap-2 font-bold">
                  <SlidersHorizontal className="h-5 w-5 text-fuchsia-300" />
                  توافق النشر
                </div>
                <ul className="list-disc space-y-1 pr-5 text-sm leading-7 text-muted-foreground">
                  <li>جاهز للنشر على Vercel.</li>
                  <li>Next.js 14 App Router + TypeScript.</li>
                  <li>تصميم ثابت 100dvw / 100dvh مع safe-area.</li>
                </ul>
              </section>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
