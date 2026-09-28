import { useState } from 'react';
import { Check, MoreHorizontal, Pencil, Trash2, X } from 'lucide-react';
import type { Conversation } from '@/types';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/common/Tooltip';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}

function relativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onRename,
  onDelete,
}: ConversationItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(conversation.title);

  const submitRename = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== conversation.title) {
      onRename(trimmed);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 px-2.5 py-2">
        <input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitRename();
            if (e.key === 'Escape') setEditing(false);
          }}
          onBlur={submitRename}
          className="flex-1 bg-bg-input border border-brand-primary/40 rounded-lg px-2 py-1 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
        />
        <button onClick={submitRename} className="btn-ghost p-1" aria-label="Save">
          <Check size={15} />
        </button>
        <button onClick={() => setEditing(false)} className="btn-ghost p-1" aria-label="Cancel">
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors',
        isActive
          ? 'bg-brand-primary/15 text-slate-100'
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
      )}
      onClick={onSelect}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate font-medium">{conversation.title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{relativeTime(conversation.updated_at)}</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((v) => !v);
        }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-opacity"
        aria-label="Conversation options"
      >
        <MoreHorizontal size={15} />
      </button>
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-2 top-10 z-40 w-36 bg-bg-card border border-surface-border rounded-lg shadow-xl py-1 animate-scale-in">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                setEditValue(conversation.title);
                setEditing(true);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors"
            >
              <Pencil size={14} /> Rename
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onDelete();
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-error hover:bg-error/10 transition-colors"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (conv: Conversation) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (conv: Conversation) => void;
}

function groupByDate(conversations: Conversation[]): { label: string; items: Conversation[] }[] {
  const groups: Record<string, Conversation[]> = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  for (const c of conversations) {
    const d = new Date(c.updated_at).toDateString();
    const label = d === today ? 'Today' : d === yesterday ? 'Yesterday' : d;
    (groups[label] ??= []).push(c);
  }

  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onRename,
  onDelete,
}: ConversationListProps) {
  const groups = groupByDate(conversations);

  if (conversations.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-slate-500">No conversations yet</p>
        <p className="text-xs text-slate-600 mt-1">Start a new chat to begin</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-2 pb-2">
      {groups.map((group) => (
        <div key={group.label}>
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-2 mb-1">
            {group.label}
          </h4>
          <div className="flex flex-col gap-0.5">
            {group.items.map((conv) => (
              <Tooltip key={conv.id} label={conv.thread_id} side="right">
                <ConversationItem
                  conversation={conv}
                  isActive={conv.id === activeId}
                  onSelect={() => onSelect(conv)}
                  onRename={(title) => onRename(conv.id, title)}
                  onDelete={() => onDelete(conv)}
                />
              </Tooltip>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
