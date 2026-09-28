import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '@/services/api';
import type { Attachment, ChatMessage, Settings, ToolEvent } from '@/types';

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  sendMessage: (text: string, attachments?: Attachment[]) => Promise<void>;
  clearError: () => void;
  loadThread: (threadId: string) => Promise<void>;
  approveAction: (approvalId: string, decision: string) => Promise<void>;
}

export function useChat(
  threadId: string | null,
  settings: Settings,
): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const threadRef = useRef<string | null>(null);

  // Keep ref in sync for use inside async callbacks
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    threadRef.current = threadId;
  }, [threadId]);

  const persist = useCallback((msgs: ChatMessage[]) => {
    messagesRef.current = msgs;
    setMessages(msgs);
    if (threadRef.current) {
      // Fire-and-forget — the UI already has the data; Supabase sync is best-effort
      api.persistMessages(threadRef.current, msgs).catch(() => {});
    }
  }, []);

  const loadThread = useCallback(async (id: string) => {
    setError(null);
    try {
      const fetched = await api.loadPersistedMessages(id);
      setMessages(fetched);
      messagesRef.current = fetched;
    } catch {
      setMessages([]);
      messagesRef.current = [];
    }
  }, []);

  const sendMessage = useCallback(
    async (text: string, attachments?: Attachment[]) => {
      if (!text.trim() || !threadRef.current) return;
      setError(null);

      const userMsg: ChatMessage = {
        id: api.generateMessageId(),
        thread_id: threadRef.current,
        role: 'user',
        content: text.trim(),
        created_at: api.timestampNow(),
        status: 'completed',
        attachments: attachments?.filter((a) => !a.error),
      };

      const assistantMsg: ChatMessage = {
        id: api.generateMessageId(),
        thread_id: threadRef.current,
        role: 'assistant',
        content: '',
        created_at: api.timestampNow(),
        status: 'sending',
        toolEvents: [],
      };

      const current = [...messagesRef.current, userMsg, assistantMsg];
      persist(current);
      setIsLoading(true);
      setIsStreaming(true);

      const updateAssistant = (updater: (m: ChatMessage) => ChatMessage) => {
        const updated = messagesRef.current.map((m) =>
          m.id === assistantMsg.id ? updater(m) : m,
        );
        persist(updated);
      };

      try {
        const response = await api.sendMessage(
          {
            thread_id: threadRef.current,
            message: text.trim(),
            files: attachments,
            provider: settings.provider,
            model: settings.model,
            temperature: settings.temperature,
            language: settings.language,
          },
          {
            onToolEvent: (evt: ToolEvent) => {
              updateAssistant((m) => ({
                ...m,
                status: 'streaming',
                toolEvents: [...(m.toolEvents ?? []), evt],
              }));
            },
            onChunk: (chunk: string) => {
              updateAssistant((m) => ({
                ...m,
                status: 'streaming',
                content: m.content + chunk,
              }));
            },
            onApprovalRequest: (req) => {
              if (!req) return;
              updateAssistant((m) => ({
                ...m,
                status: 'streaming',
                approvalRequest: req,
              }));
            },
          },
        );

        updateAssistant((m) => ({
          ...m,
          content: response.message || m.content,
          status: response.status === 'error' ? 'error' : 'completed',
          approvalRequest: response.approval_request ?? m.approvalRequest,
        }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong';
        setError(msg);
        updateAssistant((m) => ({
          ...m,
          status: 'error',
          content: m.content || `Error: ${msg}`,
        }));
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
      }
    },
    [persist, settings],
  );

  const approveAction = useCallback(
    async (approvalId: string, decision: string) => {
      if (!threadRef.current) return;
      try {
        setIsLoading(true);
        const response = await api.sendApproval(threadRef.current, approvalId, decision);
        const updated = messagesRef.current.map((m) =>
          m.approvalRequest?.id === approvalId
            ? {
                ...m,
                content: response.message || m.content,
                status: 'completed' as const,
                approvalRequest: undefined,
              }
            : m,
        );
        persist(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Approval failed');
      } finally {
        setIsLoading(false);
      }
    },
    [persist],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    clearError,
    loadThread,
    approveAction,
  };
}
