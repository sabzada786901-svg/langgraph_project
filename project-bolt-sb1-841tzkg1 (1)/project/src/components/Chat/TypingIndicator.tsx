export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-2" aria-label="AI is typing">
      <span className="w-2 h-2 rounded-full bg-brand-secondary animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 rounded-full bg-brand-secondary animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 rounded-full bg-brand-secondary animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}
