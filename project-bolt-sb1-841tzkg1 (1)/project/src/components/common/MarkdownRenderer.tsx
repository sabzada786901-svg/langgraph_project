import { memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-3">
      <div className="flex items-center justify-between px-3 py-1.5 bg-bg-input border border-surface-border border-b-0 rounded-t-lg">
        <span className="text-xs text-slate-500 font-mono">{lang || 'code'}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Copy code"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto bg-bg-input border border-surface-border rounded-b-lg p-3 text-[13px] font-mono leading-relaxed">
        <code className="text-slate-200">{code}</code>
      </pre>
    </div>
  );
}

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  return (
    <div className={cn('prose-chat', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props) {
            const { className: cls, children } = props;
            const match = /language-(\w+)/.exec(cls || '');
            const code = String(children).replace(/\n$/, '');
            const isBlock = !!match && code.includes('\n');
            if (isBlock) {
              return <CodeBlock code={code} lang={match?.[1] ?? ''} />;
            }
            return <code className={cls}>{children}</code>;
          },
          pre({ children }) {
            // The CodeBlock handles its own <pre>, so unwrap
            return <>{children}</>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
