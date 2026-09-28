import { Sparkles } from 'lucide-react';

const QUICK_QUESTIONS = [
  { icon: Sparkles, label: 'Explain LangGraph' },
  { icon: Sparkles, label: 'Calculate 25 × 40' },
  { icon: Sparkles, label: 'Search my knowledge' },
  { icon: Sparkles, label: 'Read a file' },
  { icon: Sparkles, label: 'What can you do?' },
  { icon: Sparkles, label: 'Help me with Python' },
  { icon: Sparkles, label: 'Explain AI Agents' },
  { icon: Sparkles, label: 'Explain RAG' },
];

interface QuickQuestionsProps {
  onSelect: (question: string) => void;
}

export function QuickQuestions({ onSelect }: QuickQuestionsProps) {
  return (
    <div className="px-3 py-2">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
        Quick Questions
      </h3>
      <div className="flex flex-col gap-1">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q.label}
            onClick={() => onSelect(q.label)}
            className="flex items-center gap-2 px-2.5 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors text-left"
          >
            <q.icon size={14} className="text-brand-secondary/70 shrink-0" />
            <span className="truncate">{q.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
