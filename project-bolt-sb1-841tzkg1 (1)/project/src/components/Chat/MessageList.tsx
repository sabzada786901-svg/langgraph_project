import { useState } from 'react';
import { Check, Copy, FileText, User } from 'lucide-react';
import type { ChatMessage } from '@/types';
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer';
import { ToolStatusList } from '@/components/ToolStatus/ToolStatus';
import { TypingIndicator } from './TypingIndicator';
import { Logo } from '@/components/common/Logo';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: ChatMessage;
  onApprove?: (approvalId: string, decision: string) => void;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function MessageBubble({ message, onApprove }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const copyResponse = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-up">
        <div className="flex items-start gap-3 max-w-[85%] sm:max-w-[75%]">
          <div className="flex-1">
            <div className="bg-gradient-to-br from-brand-primary to-brand-primaryHover text-white rounded-2xl rounded-tr-md px-4 py-3 shadow-lg shadow-brand-primary/10">
              {message.attachments && message.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {message.attachments.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-1.5 bg-white/15 rounded-lg px-2 py-1 text-xs"
                    >
                      <FileText size={12} />
                      <span className="truncate max-w-[120px]">{a.name}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </div>
            <p className="text-xs text-slate-500 mt-1 text-right pr-1">
              {formatTime(message.created_at)}
            </p>
          </div>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-bg-card border border-surface-border text-slate-300 shrink-0">
            <User size={16} />
          </div>
        </div>
      </div>
    );
  }

  // Assistant message
  const isThinking = message.status === 'sending' && !message.content;
  const showToolEvents = (message.toolEvents?.length ?? 0) > 0;

  return (
    <div className="flex justify-start animate-slide-up">
      <div className="flex items-start gap-3 max-w-[90%] sm:max-w-[80%]">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary shrink-0 mt-0.5">
          <Logo size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-slate-200">friendly_AI</span>
            <span className="text-xs text-slate-600">{formatTime(message.created_at)}</span>
          </div>

          <div
            className={cn(
              'bg-bg-card border border-surface-border rounded-2xl rounded-tl-md px-4 py-3',
              message.status === 'error' && 'border-error/30',
            )}
          >
            {showToolEvents && <ToolStatusList events={message.toolEvents!} />}

            {isThinking ? (
              <TypingIndicator />
            ) : message.content ? (
              <>
                <MarkdownRenderer content={message.content} />
                {message.status === 'completed' && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-surface-border">
                    <button
                      onClick={copyResponse}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                      aria-label="Copy response"
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}
              </>
            ) : null}

            {/* Approval request */}
            {message.approvalRequest && (
              <div className="mt-3 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                <p className="text-sm text-slate-200 mb-3">
                  {message.approvalRequest.message}
                </p>
                <div className="flex flex-wrap gap-2">
                  {message.approvalRequest.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() =>
                        onApprove?.(message.approvalRequest!.id, opt)
                      }
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        opt.toLowerCase().includes('approve') || opt.toLowerCase().includes('yes') || opt.toLowerCase().includes('ok')
                          ? 'bg-success/20 text-success hover:bg-success/30'
                          : opt.toLowerCase().includes('deny') || opt.toLowerCase().includes('no') || opt.toLowerCase().includes('cancel')
                            ? 'bg-error/20 text-error hover:bg-error/30'
                            : 'bg-white/10 text-slate-200 hover:bg-white/15',
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {message.status === 'streaming' && message.content && (
              <span className="inline-block w-1.5 h-4 bg-brand-secondary ml-0.5 animate-blink align-middle" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MessageListProps {
  messages: ChatMessage[];
  onApprove?: (approvalId: string, decision: string) => void;
}

export function MessageList({ messages, onApprove }: MessageListProps) {
  return (
    <div className="flex flex-col gap-4 py-4">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} onApprove={onApprove} />
      ))}
    </div>
  );
}
