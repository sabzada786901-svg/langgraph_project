import { useEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import type { ChatMessage } from '@/types';
import { MessageList } from './MessageList';
import { EmptyState } from './EmptyState';
import { cn } from '@/lib/utils';

interface ChatAreaProps {
  messages: ChatMessage[];
  onSuggestion: (text: string) => void;
  onApprove?: (approvalId: string, decision: string) => void;
}

export function ChatArea({ messages, onSuggestion, onApprove }: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // Track scroll position
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handler = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom && scrollHeight > clientHeight + 200);
      setAutoScroll(isNearBottom);
    };

    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, []);

  // Auto-scroll on new messages if user is near bottom
  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setAutoScroll(true);
    setShowScrollButton(false);
  };

  if (messages.length === 0) {
    return <EmptyState onSuggestion={onSuggestion} />;
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto"
        role="log"
        aria-label="Chat messages"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <MessageList messages={messages} onApprove={onApprove} />
          <div ref={bottomRef} className="h-4" />
        </div>
      </div>

      {/* New messages button */}
      <div
        className={cn(
          'absolute bottom-4 left-1/2 -translate-x-1/2 transition-all',
          showScrollButton ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
      >
        <button
          onClick={scrollToBottom}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-card border border-surface-border rounded-full text-sm text-slate-300 hover:bg-bg-hover shadow-lg transition-all"
          aria-label="Scroll to new messages"
        >
          <ArrowDown size={15} />
          New messages
        </button>
      </div>
    </div>
  );
}
