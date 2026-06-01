'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Bot, MessageSquare, Plus, Trash2, X } from 'lucide-react';
import { agents } from '@/lib/agents';
import { cn } from '@/lib/utils';
import { IconButton } from '@/components/ui/IconButton';
import type { AgentId, Conversation } from '@/types';

type SidebarProps = {
  conversations: Conversation[];
  activeConversationId: string | null;
  isMobile: boolean;
  open: boolean;
  activeAgentId: AgentId;
  temperature: number;
  onClose: () => void;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onSelectAgent: (agentId: AgentId) => void;
  onTemperatureChange: (value: number) => void;
};

function SidebarContent({
  conversations,
  activeConversationId,
  activeAgentId,
  temperature,
  onClose,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onSelectAgent,
  onTemperatureChange,
  isMobile
}: SidebarProps) {
  const visibleConversations = conversations.slice(0, 12);

  return (
    <aside className="flex h-full w-[var(--sidebar-width)] shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[#080a18]/95 text-right backdrop-blur-2xl" dir="rtl">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-3">
        <div>
          <div className="text-sm font-extrabold text-white">مساحة العمل</div>
          <div className="text-[11px] text-muted-foreground">محادثاتك محفوظة محليًا</div>
        </div>
        {isMobile && (
          <IconButton label="إغلاق القائمة" onClick={onClose}>
            <X className="h-5 w-5" />
          </IconButton>
        )}
      </div>

      <div className="shrink-0 space-y-3 border-b border-white/10 p-3">
        <button
          type="button"
          onClick={onNewChat}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-primary to-cyan-500 px-4 text-sm font-black text-white shadow-glow transition active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" />
          محادثة جديدة
        </button>

        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <Bot className="h-4 w-4" />
            الوكيل النشط
          </span>
          <select
            value={activeAgentId}
            onChange={(event) => onSelectAgent(event.target.value as AgentId)}
            className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-3 text-sm text-white outline-none focus:border-primary"
          >
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id} className="bg-[#11142b] text-white">
                {agent.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>الإبداع</span>
            <span dir="ltr">{temperature.toFixed(1)}</span>
          </span>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.1}
            value={temperature}
            onChange={(event) => onTemperatureChange(Number(event.target.value))}
            className="w-full accent-primary"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden p-3">
        <div className="mb-2 flex items-center justify-between text-xs font-bold text-muted-foreground">
          <span>المحادثات الأخيرة</span>
          <span>{conversations.length}</span>
        </div>

        {visibleConversations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-muted-foreground">
            لا توجد محادثات بعد. ابدأ بسؤال RKN.AI من شريط الإدخال.
          </div>
        ) : (
          <div className="space-y-2 overflow-hidden">
            {visibleConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  'group flex items-center gap-2 rounded-2xl border p-2 transition',
                  activeConversationId === conversation.id
                    ? 'border-primary/45 bg-primary/15'
                    : 'border-white/10 bg-white/[0.035] hover:bg-white/[0.07]'
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelectConversation(conversation.id)}
                  className="min-w-0 flex-1 text-right"
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <MessageSquare className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate">{conversation.title}</span>
                  </div>
                  <div className="mt-1 truncate text-[11px] text-muted-foreground">
                    {conversation.messages.at(-1)?.content || 'محادثة فارغة'}
                  </div>
                </button>
                <IconButton
                  label="حذف المحادثة"
                  variant="danger"
                  className="h-8 w-8 opacity-70 md:opacity-0 md:group-hover:opacity-100"
                  onClick={() => onDeleteConversation(conversation.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-white/10 p-3 text-xs leading-6 text-muted-foreground">
        <div className="rounded-2xl bg-white/[0.035] p-3">
          التخزين: localStorage، مع تجهيز IndexedDB للبيانات الكبيرة. المفتاح السري يبقى على الخادم فقط.
        </div>
      </div>
    </aside>
  );
}

export function Sidebar(props: SidebarProps) {
  if (!props.isMobile) {
    return <SidebarContent {...props} />;
  }

  return (
    <AnimatePresence>
      {props.open && (
        <>
          <motion.button
            aria-label="إغلاق القائمة"
            type="button"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={props.onClose}
          />
          <motion.div
            className="fixed left-0 top-0 z-50 h-full"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            dir="ltr"
          >
            <SidebarContent {...props} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
