'use client';

import { motion } from 'framer-motion';
import { BrainCircuit, Code2, Lightbulb, PenTool } from 'lucide-react';

const suggestions = [
  { icon: BrainCircuit, text: 'اشرح لي فكرة معقدة ببساطة' },
  { icon: Code2, text: 'اكتب لي مكوّن React احترافي' },
  { icon: Lightbulb, text: 'اقترح خطة مشروع ناشئ' },
  { icon: PenTool, text: 'حسّن صياغة هذا النص' }
];

export function EmptyState({ onPrompt }: { onPrompt: (prompt: string) => void }) {
  return (
    <div className="flex h-full items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl text-center"
      >
        <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-[1.75rem] bg-gradient-to-br from-primary via-fuchsia-500 to-cyan-400 shadow-glow">
          <BrainCircuit className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">أهلاً بك في RKN.AI</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-8 text-muted-foreground md:text-base">
          تجربة محادثة عربية ثابتة كالتطبيقات الأصلية، مدعومة بـ Gemini 2.0 Flash، مع وكلاء متخصصين وحفظ محلي آمن.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {suggestions.map((item, index) => (
            <motion.button
              key={item.text}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07 }}
              onClick={() => onPrompt(item.text)}
              className="group rounded-3xl border border-white/10 bg-white/[0.045] p-4 text-right transition hover:border-primary/40 hover:bg-primary/10 active:scale-[0.99]"
            >
              <item.icon className="mb-3 h-5 w-5 text-primary transition group-hover:scale-110" />
              <span className="text-sm font-bold text-white">{item.text}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
