'use client';

import { Menu, Plus, Settings2, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';
import { IconButton } from '@/components/ui/IconButton';
import { BrandMark } from '@/components/ui/BrandMark';
import type { DeviceMetrics } from '@/types';

type HeaderProps = {
  isMobile: boolean;
  onOpenSidebar: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  deviceMetrics: DeviceMetrics | null;
};

export function Header({ isMobile, onOpenSidebar, onNewChat, onOpenSettings, deviceMetrics }: HeaderProps) {
  return (
    <header
      className="relative z-30 flex h-[var(--header-height)] shrink-0 items-center justify-between border-b border-white/10 bg-background/80 px-3 backdrop-blur-2xl md:px-4"
      dir="ltr"
    >
      <div className="flex items-center gap-2">
        {isMobile && (
          <IconButton label="فتح القائمة" onClick={onOpenSidebar}>
            <Menu className="h-5 w-5" />
          </IconButton>
        )}
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
          <BrandMark compact={isMobile} />
        </motion.div>
      </div>

      <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 sm:flex" dir="rtl">
        <Wifi className="h-3.5 w-3.5" />
        متصل عبر Gemini 2.0 Flash
      </div>

      <div className="flex items-center gap-2" dir="rtl">
        {deviceMetrics && (
          <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] text-muted-foreground lg:block" dir="ltr">
            {deviceMetrics.innerWidth}×{deviceMetrics.innerHeight} @ {deviceMetrics.devicePixelRatio}x
          </div>
        )}
        <IconButton label="محادثة جديدة" variant="solid" onClick={onNewChat}>
          <Plus className="h-5 w-5" />
        </IconButton>
        <IconButton label="الإعدادات" onClick={onOpenSettings}>
          <Settings2 className="h-5 w-5" />
        </IconButton>
      </div>
    </header>
  );
}
