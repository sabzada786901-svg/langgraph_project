import { Check, Loader2, Sparkles } from 'lucide-react';
import type { ToolEvent } from '@/types';
import { cn } from '@/lib/utils';

interface ToolStatusProps {
  event: ToolEvent;
  isLast?: boolean;
}

const ICON_MAP: Record<string, typeof Loader2> = {
  thinking: Sparkles,
  tool_start: Loader2,
  tool_end: Check,
  generating: Loader2,
  completed: Check,
  error: Check,
  waiting_for_approval: Loader2,
};

export function ToolStatus({ event, isLast }: ToolStatusProps) {
  const Icon = ICON_MAP[event.type] ?? Sparkles;
  const isActive =
    isLast &&
    (event.type === 'thinking' ||
      event.type === 'tool_start' ||
      event.type === 'generating' ||
      event.type === 'waiting_for_approval');

  return (
    <div
      className="flex items-center gap-2 text-sm text-slate-400 animate-slide-in py-0.5"
      role="status"
    >
      <span className="text-brand-secondary">
        <Icon
          size={14}
          className={cn(isActive && 'animate-spin')}
        />
      </span>
      <span
        className={cn(
          'font-mono text-[13px]',
          event.type === 'tool_end' && 'text-slate-500',
          event.type === 'error' && 'text-error',
        )}
      >
        {event.label || event.tool || event.type}
      </span>
    </div>
  );
}

interface ToolStatusListProps {
  events: ToolEvent[];
}

export function ToolStatusList({ events }: ToolStatusListProps) {
  if (!events?.length) return null;
  return (
    <div className="flex flex-col gap-0.5 mb-2 pl-1">
      {events.map((evt, i) => (
        <ToolStatus key={evt.id} event={evt} isLast={i === events.length - 1} />
      ))}
    </div>
  );
}
