import { Sparkles } from 'lucide-react';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3" dir="rtl">
      <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-fuchsia-500 to-cyan-400 shadow-glow">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.55),transparent_30%)]" />
        <Sparkles className="relative h-5 w-5 text-white" />
      </div>
      {!compact && (
        <div className="min-w-0 leading-tight">
          <div className="truncate text-base font-black tracking-tight text-white">RKN.AI</div>
          <div className="truncate text-[11px] font-medium text-muted-foreground">ركن الذكاء الاصطناعي</div>
        </div>
      )}
    </div>
  );
}
