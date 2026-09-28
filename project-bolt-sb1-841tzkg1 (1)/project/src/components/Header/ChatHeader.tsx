import { Menu, Cpu } from 'lucide-react';
import type { Conversation, Settings } from '@/types';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  conversation: Conversation | null;
  settings: Settings;
  onOpenSidebar: () => void;
  isMobile: boolean;
}

export function ChatHeader({
  conversation,
  settings,
  onOpenSidebar,
  isMobile,
}: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-surface-border bg-bg-sidebar/50 backdrop-blur-xl shrink-0 z-10">
      <div className="flex items-center gap-3 min-w-0">
        {isMobile && (
          <button
            onClick={onOpenSidebar}
            className="btn-ghost p-1.5"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-slate-200 truncate">
            {conversation?.title ?? 'friendly_AI'}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
            Online
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-card border border-surface-border text-xs text-slate-400',
          )}
        >
          <Cpu size={13} className="text-brand-secondary" />
          <span className="font-mono">{settings.model}</span>
        </div>
      </div>
    </header>
  );
}
