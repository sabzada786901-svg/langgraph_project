export type Role = 'user' | 'assistant' | 'system';

export type MessageStatus = 'sending' | 'streaming' | 'completed' | 'error';

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  /** Data URL preview for images, or backend file reference after upload */
  url?: string;
  uploadProgress?: number;
  error?: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  role: Role;
  content: string;
  created_at: string;
  status?: MessageStatus;
  attachments?: Attachment[];
  /** Agent tool activity events shown inline before the final answer */
  toolEvents?: ToolEvent[];
  /** Human-in-the-loop approval request from the backend */
  approvalRequest?: ApprovalRequest;
}

export type ToolEventType =
  | 'thinking'
  | 'tool_start'
  | 'tool_end'
  | 'waiting_for_approval'
  | 'generating'
  | 'completed'
  | 'error';

export interface ToolEvent {
  id: string;
  type: ToolEventType;
  /** Backend tool name, e.g. "search_knowledge_base" */
  tool?: string;
  /** Friendly label already mapped by the service layer */
  label?: string;
  timestamp: string;
  /** Payload for approval requests */
  approvalData?: ApprovalRequest;
}

export interface ApprovalRequest {
  id: string;
  message: string;
  /** Options the user can choose, e.g. ["Approve", "Deny"] */
  options: string[];
}

export interface Conversation {
  id: string;
  thread_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatRequest {
  thread_id: string;
  message: string;
  files?: Attachment[];
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  language?: string;
}

export interface ChatResponse {
  thread_id: string;
  message: string;
  status: 'completed' | 'error' | 'waiting_for_approval';
  tool_events?: ToolEvent[];
  approval_request?: ApprovalRequest;
}

export type AIProvider = 'groq' | 'openrouter';

export type ThemeMode = 'dark' | 'light';

export interface Settings {
  theme: ThemeMode;
  provider: AIProvider;
  model: string;
  temperature: number;
  language: string;
}

export interface UserProfile {
  name: string;
  email: string;
  plan: string;
}
