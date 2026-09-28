import { useCallback, useEffect, useState } from 'react';
import * as api from '@/services/api';
import type { Conversation } from '@/types';

interface UseConversationsReturn {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (s: string) => void;
  filtered: Conversation[];
  refresh: () => Promise<void>;
  create: (title?: string) => Promise<Conversation | null>;
  rename: (id: string, title: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.getConversations();
      setConversations(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(async (title = 'New Chat') => {
    try {
      const conv = await api.createConversation(title);
      setConversations((prev) => [conv, ...prev]);
      return conv;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
      return null;
    }
  }, []);

  const rename = useCallback(async (id: string, title: string) => {
    try {
      const updated = await api.renameConversation(id, title);
      setConversations((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename conversation');
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete conversation');
    }
  }, []);

  const filtered = search.trim()
    ? conversations.filter((c) =>
        c.title.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : conversations;

  return {
    conversations,
    loading,
    error,
    search,
    setSearch,
    filtered,
    refresh,
    create,
    rename,
    remove,
  };
}
