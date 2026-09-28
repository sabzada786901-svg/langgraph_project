import { useCallback, useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { ChatHeader } from '@/components/Header/ChatHeader';
import { ChatArea } from '@/components/Chat/ChatArea';
import { ChatInput } from '@/components/Input/ChatInput';
import { SettingsModal } from '@/components/Settings/SettingsModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Modal } from '@/components/common/Modal';
import { Logo } from '@/components/common/Logo';
import { useConversations } from '@/hooks/useConversations';
import { useChat } from '@/hooks/useChat';
import type {
  Conversation,
  Settings as SettingsType,
  UserProfile,
} from '@/types';
import { AlertCircle, Github, Shield, Zap } from 'lucide-react';

const DEFAULT_SETTINGS: SettingsType = {
  theme: 'dark',
  provider: 'groq',
  model: 'llama-3.3-70b-versatile',
  temperature: 0.7,
  language: 'English',
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'User',
  email: 'user@friendly-ai.app',
  plan: 'AI Workspace',
};

const SETTINGS_KEY = 'friendly_ai_settings';

function loadSettings(): SettingsType {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function ChatPage() {
  const [settings, setSettings] = useState<SettingsType>(loadSettings);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const {
    conversations,
    search,
    setSearch,
    create,
    rename,
    remove,
  } = useConversations();

  const { messages, isLoading, isStreaming, error, sendMessage, loadThread, clearError, approveAction } =
    useChat(activeConversation?.thread_id ?? null, settings);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversation) {
      loadThread(activeConversation.thread_id);
    }
  }, [activeConversation, loadThread]);

  const handleNewChat = useCallback(async () => {
    const conv = await create('New Chat');
    if (conv) {
      setActiveConversation(conv);
      setDraft('');
      setMobileSidebarOpen(false);
    }
  }, [create]);

  const handleSelectConversation = useCallback((conv: Conversation) => {
    setActiveConversation(conv);
    setDraft('');
  }, []);

  const handleRename = useCallback(
    (id: string, title: string) => rename(id, title),
    [rename],
  );

  const handleDeleteRequest = useCallback((conv: Conversation) => {
    setDeleteTarget(conv);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget.id);
    if (activeConversation?.id === deleteTarget.id) {
      setActiveConversation(null);
    }
    setDeleteTarget(null);
  }, [deleteTarget, remove, activeConversation]);

  const handleSend = useCallback(
    (text: string, files?: import('@/types').Attachment[]) => {
      if (!activeConversation) return;
      sendMessage(text, files);
      setDraft('');
    },
    [activeConversation, sendMessage],
  );

  const handleQuickQuestion = useCallback(
    (q: string) => {
      if (!activeConversation) return;
      sendMessage(q);
      setMobileSidebarOpen(false);
    },
    [activeConversation, sendMessage],
  );

  const handleSuggestion = useCallback(
    (text: string) => {
      if (!activeConversation) return;
      sendMessage(text);
    },
    [activeConversation, sendMessage],
  );

  const toggleTheme = useCallback(() => {
    setSettings((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }));
  }, []);

  // Auto-create a conversation on first load if none exist
  useEffect(() => {
    if (conversations.length === 0 && !activeConversation) {
      handleNewChat();
    }
  }, [conversations.length, activeConversation, handleNewChat]);

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar
        conversations={conversations}
        activeConversation={activeConversation}
        search={search}
        onSearchChange={setSearch}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onRenameConversation={handleRename}
        onDeleteConversation={handleDeleteRequest}
        onQuickQuestion={handleQuickQuestion}
        profile={DEFAULT_PROFILE}
        settings={settings}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenAbout={() => setAboutOpen(true)}
        onToggleTheme={toggleTheme}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          conversation={activeConversation}
          settings={settings}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
          isMobile={isMobile}
        />

        {error && (
          <div className="flex items-center gap-2 px-4 py-2 bg-error/10 border-b border-error/30 text-sm text-error">
            <AlertCircle size={15} />
            <span className="flex-1">{error}</span>
            <button onClick={clearError} className="text-error/70 hover:text-error text-xs underline">
              Dismiss
            </button>
          </div>
        )}

        <ChatArea
          messages={messages}
          onSuggestion={handleSuggestion}
          onApprove={approveAction}
        />

        <ChatInput
          onSend={handleSend}
          disabled={isLoading && !isStreaming}
          isStreaming={isStreaming}
          onStop={() => {/* stop would abort fetch in real mode */}}
          draft={draft}
          onDraftChange={setDraft}
        />
      </main>

      {/* Settings */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={setSettings}
      />

      {/* Profile */}
      <Modal open={profileOpen} onClose={() => setProfileOpen(false)} title="Profile" size="sm">
        <div className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary text-white text-2xl font-semibold">
              {DEFAULT_PROFILE.name.charAt(0)}
            </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-100">{DEFAULT_PROFILE.name}</h3>
          <p className="text-sm text-slate-400">{DEFAULT_PROFILE.email}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-brand-primary/15 text-brand-secondary rounded-full text-xs font-medium">
            {DEFAULT_PROFILE.plan}
          </div>
        </div>
      </Modal>

      {/* About */}
      <Modal open={aboutOpen} onClose={() => setAboutOpen(false)} title="About friendly_AI" size="md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Logo size={48} showGlow />
            <div>
              <h3 className="text-xl font-bold text-slate-100">
                friendly<span className="text-brand-secondary">_AI</span>
              </h3>
              <p className="text-sm text-slate-400">Your intelligent AI workspace</p>
            </div>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            friendly_AI is a professional AI agent chat interface designed to
            connect with Python LangGraph backends. It supports agentic tools,
            knowledge base search, file analysis, calculator, and
            human-in-the-loop approval workflows.
          </p>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Zap size={16} className="text-brand-secondary" />
              Multi-provider support (Groq, OpenRouter)
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Shield size={16} className="text-brand-secondary" />
              API keys never exposed in frontend
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Github size={16} className="text-brand-secondary" />
              Built with React, Vite, TypeScript, Tailwind CSS
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-4 text-center">Version 1.0.0</p>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete conversation?"
        message={`"${deleteTarget?.title ?? ''}" will be permanently deleted. This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
