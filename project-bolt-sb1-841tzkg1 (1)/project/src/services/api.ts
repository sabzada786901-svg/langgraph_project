import type {
  Attachment,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  Conversation,
  ToolEvent,
} from '@/types';
import { supabase } from '@/lib/supabase';
import * as mockApi from './mockApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') === 'true';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

/** Map a Supabase conversations row to the frontend Conversation type */
function rowToConversation(row: {
  id: string;
  thread_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}): Conversation {
  return {
    id: row.id,
    thread_id: row.thread_id,
    title: row.title,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** Map a Supabase messages row to the frontend ChatMessage type */
function rowToMessage(row: {
  id: string;
  thread_id: string;
  role: string;
  content: string;
  created_at: string;
  status: string | null;
  attachments: Attachment[] | null;
  tool_events: ToolEvent[] | null;
  approval_request: ChatMessage['approvalRequest'] | null;
}): ChatMessage {
  return {
    id: row.id,
    thread_id: row.thread_id,
    role: row.role as ChatMessage['role'],
    content: row.content,
    created_at: row.created_at,
    status: (row.status as ChatMessage['status']) ?? undefined,
    attachments: row.attachments ?? undefined,
    toolEvents: row.tool_events ?? undefined,
    approvalRequest: row.approval_request ?? undefined,
  };
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Request failed (${res.status}): ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/* ------------------------------------------------------------------ */
/* Conversations (Supabase)                                            */
/* ------------------------------------------------------------------ */

export async function createConversation(title = 'New Chat'): Promise<Conversation> {
  if (USE_MOCK) return mockApi.createConversation(title);

  const threadId = `thread-${uid('t')}`;
  const { data, error } = await supabase
    .from('conversations')
    .insert({ thread_id: threadId, title })
    .select()
    .single();

  if (error) throw new Error(`Failed to create conversation: ${error.message}`);
  return rowToConversation(data);
}

export async function getConversations(): Promise<Conversation[]> {
  if (USE_MOCK) return mockApi.getConversations();

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`Failed to load conversations: ${error.message}`);
  return (data ?? []).map(rowToConversation);
}

export async function getConversation(id: string): Promise<Conversation | null> {
  if (USE_MOCK) return mockApi.getConversation(id);

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load conversation: ${error.message}`);
  return data ? rowToConversation(data) : null;
}

export async function renameConversation(id: string, title: string): Promise<Conversation> {
  if (USE_MOCK) return mockApi.renameConversation(id, title);

  const { data, error } = await supabase
    .from('conversations')
    .update({ title, updated_at: nowISO() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to rename conversation: ${error.message}`);
  return rowToConversation(data);
}

export async function deleteConversation(id: string): Promise<void> {
  if (USE_MOCK) return mockApi.deleteConversation(id);

  const { error } = await supabase.from('conversations').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete conversation: ${error.message}`);
}

/* ------------------------------------------------------------------ */
/* Messages (Supabase)                                                 */
/* ------------------------------------------------------------------ */

export async function getMessages(threadId: string): Promise<ChatMessage[]> {
  if (USE_MOCK) return mockApi.getMessages(threadId);

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to load messages: ${error.message}`);
  return (data ?? []).map(rowToMessage);
}

/** Insert a message into Supabase. Returns the stored row. */
async function insertMessage(msg: ChatMessage): Promise<void> {
  const row = {
    id: msg.id,
    thread_id: msg.thread_id,
    role: msg.role,
    content: msg.content,
    created_at: msg.created_at,
    status: msg.status ?? null,
    attachments: msg.attachments ?? null,
    tool_events: msg.toolEvents ?? null,
    approval_request: msg.approvalRequest ?? null,
  };
  const { error } = await supabase.from('messages').insert(row);
  if (error) throw new Error(`Failed to save message: ${error.message}`);
}

/** Update an existing message in Supabase. */
async function updateMessage(msg: ChatMessage): Promise<void> {
  const row = {
    content: msg.content,
    status: msg.status ?? null,
    attachments: msg.attachments ?? null,
    tool_events: msg.toolEvents ?? null,
    approval_request: msg.approvalRequest ?? null,
  };
  const { error } = await supabase.from('messages').update(row).eq('id', msg.id);
  if (error) throw new Error(`Failed to update message: ${error.message}`);
}

/* ------------------------------------------------------------------ */
/* Chat                                                                */
/* ------------------------------------------------------------------ */

export type StreamCallbacks = {
  onToolEvent?: (event: ToolEvent) => void;
  onChunk?: (chunk: string) => void;
  onApprovalRequest?: (req: ChatResponse['approval_request']) => void;
};

/**
 * Send a message to the AI agent.
 *
 * Designed to support streaming (SSE) in the future. Currently uses a single
 * POST and emits tool events as they arrive from the server. When the backend
 * supports `text/event-stream`, this function can be extended to read the
 * stream incrementally without changing the hook layer.
 */
export async function sendMessage(
  req: ChatRequest,
  callbacks?: StreamCallbacks,
): Promise<ChatResponse> {
  if (USE_MOCK) return mockApi.sendMessage(req, callbacks?.onToolEvent);

  // Try streaming first; fall back to single POST if the server doesn't support SSE.
  try {
    const res = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(req),
    });
    if (!res.ok || !res.body) {
      throw new Error('Stream unavailable');
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/event-stream')) {
      return readSSEStream(res.body, callbacks);
    }
    // Non-streaming JSON response
    const data = (await res.json()) as ChatResponse;
    data.tool_events?.forEach((e) => callbacks?.onToolEvent?.(e));
    if (data.approval_request) callbacks?.onApprovalRequest?.(data.approval_request);
    return data;
  } catch {
    // Fall back to simple JSON POST
  }

  return http<ChatResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

async function readSSEStream(
  body: ReadableStream<Uint8Array>,
  callbacks?: StreamCallbacks,
): Promise<ChatResponse> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullMessage = '';
  let threadId = '';
  let approvalRequest: ChatResponse['approval_request'];
  const toolEvents: ToolEvent[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') continue;
      try {
        const evt = JSON.parse(payload) as
          | {
              type: string;
              thread_id?: string;
              content?: string;
              tool_event?: ToolEvent;
              approval_request?: ChatResponse['approval_request'];
            }
          | ChatResponse;
        if ('type' in evt) {
          if (evt.thread_id) threadId = evt.thread_id;
          if (evt.tool_event) {
            toolEvents.push(evt.tool_event);
            callbacks?.onToolEvent?.(evt.tool_event);
          }
          if (evt.content) {
            fullMessage += evt.content;
            callbacks?.onChunk?.(evt.content);
          }
          if (evt.approval_request) {
            approvalRequest = evt.approval_request;
            callbacks?.onApprovalRequest?.(approvalRequest);
          }
        }
      } catch {
        // ignore malformed lines
      }
    }
  }

  return {
    thread_id: threadId,
    message: fullMessage,
    status: approvalRequest ? 'waiting_for_approval' : 'completed',
    tool_events: toolEvents,
    approval_request: approvalRequest,
  };
}

/* ------------------------------------------------------------------ */
/* File upload                                                         */
/* ------------------------------------------------------------------ */

export async function uploadFiles(files: File[]): Promise<Attachment[]> {
  if (USE_MOCK) return mockApi.uploadFiles(files);

  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));
  const res = await fetch(`${API_BASE_URL}/api/chat/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json() as Promise<Attachment[]>;
}

/* ------------------------------------------------------------------ */
/* Approval                                                            */
/* ------------------------------------------------------------------ */

export async function sendApproval(
  threadId: string,
  approvalId: string,
  decision: string,
): Promise<ChatResponse> {
  if (USE_MOCK) {
    return {
      thread_id: threadId,
      message: `You chose: ${decision}. Proceeding...`,
      status: 'completed',
    };
  }
  return http<ChatResponse>('/api/chat/approval', {
    method: 'POST',
    body: JSON.stringify({ thread_id: threadId, approval_id: approvalId, decision }),
  });
}

/* ------------------------------------------------------------------ */
/* Message persistence (Supabase-backed)                               */
/* ------------------------------------------------------------------ */

/**
 * Persist the full message list for a thread to Supabase.
 * New messages are inserted; existing messages are updated.
 */
export async function persistMessages(threadId: string, messages: ChatMessage[]): Promise<void> {
  if (USE_MOCK) {
    try {
      localStorage.setItem(`friendly_ai_messages_${threadId}`, JSON.stringify(messages));
    } catch {
      // non-critical
    }
    return;
  }

  // Fetch existing message IDs from Supabase
  const { data: existing, error } = await supabase
    .from('messages')
    .select('id')
    .eq('thread_id', threadId);

  if (error) return;

  const existingIds = new Set((existing ?? []).map((r) => r.id as string));
  const toInsert = messages.filter((m) => !existingIds.has(m.id));
  const toUpdate = messages.filter((m) => existingIds.has(m.id));

  for (const msg of toInsert) {
    await insertMessage(msg);
  }
  for (const msg of toUpdate) {
    await updateMessage(msg);
  }
}

export async function loadPersistedMessages(threadId: string): Promise<ChatMessage[]> {
  if (USE_MOCK) {
    try {
      const raw = localStorage.getItem(`friendly_ai_messages_${threadId}`);
      return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
    } catch {
      return [];
    }
  }

  return getMessages(threadId);
}

/* ------------------------------------------------------------------ */
/* ID + timestamp generators                                           */
/* ------------------------------------------------------------------ */

export function generateThreadId(): string {
  return `thread-${uid('t')}`;
}

export function generateMessageId(): string {
  return uid('msg');
}

export function generateAttachmentId(): string {
  return uid('file');
}

export function timestampNow(): string {
  return nowISO();
}