import { Logo } from '@/components/common/Logo';
import {
  Calculator,
  FileText,
  HelpCircle,
  Search,
  Sparkles,
  Code2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  onSuggestion: (text: string) => void;
}

const SUGGESTIONS: { icon: LucideIcon; title: string; subtitle: string }[] = [
  { icon: Sparkles, title: 'Explain LangGraph', subtitle: 'Learn about stateful agent graphs' },
  { icon: Search, title: 'Search my knowledge', subtitle: 'Find info in your knowledge base' },
  { icon: Calculator, title: 'Calculate 25 × 40', subtitle: 'Quick math and computations' },
  { icon: FileText, title: 'Read a file', subtitle: 'Upload and analyze documents' },
  { icon: Code2, title: 'Help me write Python', subtitle: 'Generate clean code snippets' },
  { icon: HelpCircle, title: 'What can you do?', subtitle: 'Explore all capabilities' },
];

export function EmptyState({ onSuggestion }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-2xl w-full text-center animate-fade-in">
        <div className="flex justify-center mb-6">
          <Logo size={72} showGlow />
        </div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">
          Your intelligent AI workspace
        </h1>
        <p className="text-slate-400 text-base mb-8 max-w-lg mx-auto">
          Ask questions, analyze information, calculate, search your knowledge
          base and work with files.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.title}
              onClick={() => onSuggestion(s.title)}
              className="group flex flex-col gap-1 p-4 bg-bg-card border border-surface-border rounded-xl hover:border-brand-primary/30 hover:bg-bg-hover transition-all hover:scale-[1.02] active:scale-[0.99]"
            >
              <div className="flex items-center gap-2">
                <s.icon
                  size={18}
                  className="text-brand-secondary group-hover:text-brand-primary transition-colors"
                />
                <span className="text-sm font-medium text-slate-200">{s.title}</span>
              </div>
              <p className="text-xs text-slate-500 pl-7">{s.subtitle}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
