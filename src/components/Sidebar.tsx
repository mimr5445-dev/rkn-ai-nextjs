'use client';

import { Brain, MessageSquare, Plus, Settings2, Trash2, X } from 'lucide-react';
import { agents } from '@/lib/agents';
import { cn } from '@/lib/utils';
import type { AgentId, Conversation, GeminiModel, ReasoningLevel } from '@/types';

const MODELS: { value: GeminiModel; label: string }[] = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' }
];

function modelSupportsThinking(model: GeminiModel) {
  return model.startsWith('gemini-2.5');
}

type SidebarProps = {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeAgentId: AgentId;
  model: GeminiModel;
  temperature: number;
  thinking: boolean;
  reasoningLevel: ReasoningLevel;
  isMobile: boolean;
  open: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onSelectAgent: (id: AgentId) => void;
  onSelectModel: (model: GeminiModel) => void;
  onTemperatureChange: (value: number) => void;
  onToggleThinking: (enabled: boolean) => void;
  onSelectReasoningLevel: (level: ReasoningLevel) => void;
  onOpenSettings: () => void;
};

function Panel(props: SidebarProps) {
  const {
    conversations,
    activeConversationId,
    activeAgentId,
    model,
    temperature,
    thinking,
    reasoningLevel,
    isMobile,
    onClose,
    onNewChat,
    onSelectConversation,
    onDeleteConversation,
    onSelectAgent,
    onSelectModel,
    onTemperatureChange,
    onToggleThinking,
    onSelectReasoningLevel,
    onOpenSettings
  } = props;
  const thinkingSupported = modelSupportsThinking(model);

  return (
    <aside className="flex h-full w-[17rem] shrink-0 flex-col border-l border-line bg-sidebar">
      <div className="flex h-14 items-center justify-between px-3">
        <span className="font-serif text-lg text-ink">RKN.AI</span>
        {isMobile && (
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-subtle hover:bg-paper" aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="px-3">
        <button onClick={onNewChat} className="flex w-full items-center gap-2 rounded-xl bg-clay px-3 py-2.5 text-sm font-semibold text-clay-ink transition hover:opacity-90">
          <Plus className="h-4 w-4" /> محادثة جديدة
        </button>
      </div>

      <div className="space-y-3 px-3 py-3">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-subtle">النموذج</span>
          <select
            value={model}
            onChange={(event) => onSelectModel(event.target.value as GeminiModel)}
            className="w-full rounded-lg border border-line bg-surface px-2 py-2 text-sm outline-none focus:border-clay"
          >
            {MODELS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <section className="rounded-xl border border-line bg-surface p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-ink">
            <Brain className="h-4 w-4 text-clay" />
            التفكير الموسّع
          </div>
          <label className="flex items-center justify-between gap-3 text-sm text-ink">
            <span>{thinkingSupported ? 'عرض طريقة التفكير' : 'غير متاح لهذا النموذج'}</span>
            <input
              type="checkbox"
              checked={thinkingSupported && thinking}
              disabled={!thinkingSupported}
              onChange={(event) => onToggleThinking(event.target.checked)}
              className="h-4 w-4 accent-clay disabled:opacity-40"
            />
          </label>
          {!thinkingSupported ? (
            <p className="mt-2 text-xs leading-5 text-subtle">التفكير الموسّع متاح في نماذج Gemini 2.5 فقط.</p>
          ) : (
            <label className="mt-2 block space-y-1">
              <span className="text-xs text-subtle">عمق التفكير</span>
              <select
                value={reasoningLevel}
                disabled={!thinking}
                onChange={(event) => onSelectReasoningLevel(event.target.value as ReasoningLevel)}
                className="w-full rounded-lg border border-line bg-paper px-2 py-2 text-sm outline-none focus:border-clay disabled:opacity-60"
              >
                <option value="balanced">متوازن</option>
                <option value="deep">عميق</option>
              </select>
            </label>
          )}
        </section>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-subtle">الوكيل</span>
          <select
            value={activeAgentId}
            onChange={(event) => onSelectAgent(event.target.value as AgentId)}
            className="w-full rounded-lg border border-line bg-surface px-2 py-2 text-sm outline-none focus:border-clay"
          >
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="flex items-center justify-between text-xs font-medium text-subtle">
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
            className="w-full accent-clay"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2">
        <div className="px-1 pb-1 text-xs font-medium text-subtle">المحادثات</div>
        {conversations.length === 0 ? (
          <div className="px-1 text-xs text-subtle">لا توجد محادثات بعد.</div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                'group mb-0.5 flex items-center gap-1 rounded-lg px-2 py-2 text-sm transition',
                activeConversationId === conversation.id ? 'bg-paper text-ink' : 'text-subtle hover:bg-paper'
              )}
            >
              <button onClick={() => onSelectConversation(conversation.id)} className="flex min-w-0 flex-1 items-center gap-2 text-right">
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="truncate">{conversation.title}</span>
              </button>
              <button
                onClick={() => onDeleteConversation(conversation.id)}
                className="shrink-0 text-subtle opacity-0 transition hover:text-red-600 group-hover:opacity-100"
                aria-label="حذف"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-line p-2">
        <button onClick={onOpenSettings} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-subtle transition hover:bg-paper hover:text-ink">
          <Settings2 className="h-4 w-4" /> الإعدادات
        </button>
      </div>
    </aside>
  );
}

export function Sidebar(props: SidebarProps) {
  if (!props.isMobile) return <Panel {...props} />;
  if (!props.open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black" style={{ opacity: 0.3 }} aria-label="إغلاق" onClick={props.onClose} />
      <div className="absolute right-0 top-0 h-full">
        <Panel {...props} />
      </div>
    </div>
  );
}
