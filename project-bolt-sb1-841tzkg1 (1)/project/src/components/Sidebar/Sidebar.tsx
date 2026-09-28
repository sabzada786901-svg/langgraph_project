import { Plus, Search, X } from 'lucide-react';
import type { Conversation, Settings as SettingsType, UserProfile } from '@/types';
import { Logo } from '@/components/common/Logo';
import { QuickQuestions } from './QuickQuestions';
import { ConversationList } from '@/components/Conversations/ConversationList';
import { UserProfileArea } from './UserProfileArea';
import { cn } from '@/lib/utils';

interface SidebarProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  search: string;
  onSearchChange: (s: string) => void;
  onNewChat: () => void;
  onSelectConversation: (conv: Conversation) => void;
  onRenameConversation: (id: string, title: string) => void;
  onDeleteConversation: (conv: Conversation) => void;
  onQuickQuestion: (q: string) => void;
  profile: UserProfile;
  settings: SettingsType;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenAbout: () => void;
  onToggleTheme: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  conversations,
  activeConversation,
  search,
  onSearchChange,
  onNewChat,
  onSelectConversation,
  onRenameConversation,
  onDeleteConversation,
  onQuickQuestion,
  profile,
  settings,
  onOpenSettings,
  onOpenProfile,
  onOpenAbout,
  onToggleTheme,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const filtered = search.trim()
    ? conversations.filter((c) =>
        c.title.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : conversations;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-[280px] bg-bg-sidebar border-r border-surface-border flex flex-col transition-transform duration-300 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Sidebar"
      >
        {/* Logo + brand */}
        <div className="flex items-center justify-between px-4 h-14 shrink-0">
          <div className="flex items-center gap-2.5">
            <Logo size={32} />
            <span className="text-lg font-bold text-slate-100 tracking-tight">
              friendly<span className="text-brand-secondary">_AI</span>
            </span>
          </div>
          <button
            onClick={onCloseMobile}
            className="btn-ghost p-1.5 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* New Chat */}
        <div className="px-3 pb-2">
          <button
            onClick={onNewChat}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary/20 to-brand-secondary/15 hover:from-brand-primary/30 hover:to-brand-secondary/25 border border-brand-primary/20 text-slate-100 font-medium text-sm transition-all"
          >
            <Plus size={18} className="text-brand-secondary" />
            New Chat
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 input-base text-sm"
              aria-label="Search conversations"
            />
          </div>
        </div>

        {/* Quick Questions */}
        <div className="shrink-0">
          <QuickQuestions onSelect={onQuickQuestion} />
        </div>

        {/* Conversations (scrollable) */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 px-4 pt-2">
            Conversations
          </h3>
          <ConversationList
            conversations={filtered}
            activeId={activeConversation?.id ?? null}
            onSelect={(conv) => {
              onSelectConversation(conv);
              onCloseMobile();
            }}
            onRename={onRenameConversation}
            onDelete={onDeleteConversation}
          />
        </div>

        {/* User profile */}
        <UserProfileArea
          profile={profile}
          settings={settings}
          onOpenSettings={onOpenSettings}
          onOpenProfile={onOpenProfile}
          onOpenAbout={onOpenAbout}
          onToggleTheme={onToggleTheme}
        />
      </aside>
    </>
  );
}
