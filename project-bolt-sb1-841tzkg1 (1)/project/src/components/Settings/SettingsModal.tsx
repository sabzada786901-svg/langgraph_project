import { Globe, Moon, Palette, Sliders, Sun, Zap } from 'lucide-react';
import type { AIProvider, Settings, ThemeMode } from '@/types';
import { Modal } from '@/components/common/Modal';
import { cn } from '@/lib/utils';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onChange: (settings: Settings) => void;
}

const MODELS_BY_PROVIDER: Record<AIProvider, string[]> = {
  groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  openrouter: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o-mini', 'google/gemini-pro-1.5'],
};

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Japanese', 'Chinese'];

export function SettingsModal({ open, onClose, settings, onChange }: SettingsModalProps) {
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const models = MODELS_BY_PROVIDER[settings.provider];

  return (
    <Modal open={open} onClose={onClose} title="Settings" size="md">
      <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Appearance */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-3">
            <Palette size={16} className="text-brand-secondary" />
            Appearance
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {(['dark', 'light'] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => update('theme', mode)}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-xl border transition-all',
                  settings.theme === mode
                    ? 'border-brand-primary bg-brand-primary/10 text-slate-100'
                    : 'border-surface-border text-slate-400 hover:bg-white/5',
                )}
              >
                {mode === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                <span className="text-sm font-medium capitalize">{mode} mode</span>
              </button>
            ))}
          </div>
        </section>

        {/* AI Provider */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-3">
            <Zap size={16} className="text-brand-secondary" />
            AI Provider
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {(['groq', 'openrouter'] as AIProvider[]).map((p) => (
              <button
                key={p}
                onClick={() => {
                  update('provider', p);
                  update('model', MODELS_BY_PROVIDER[p][0]);
                }}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-xl border transition-all capitalize',
                  settings.provider === p
                    ? 'border-brand-primary bg-brand-primary/10 text-slate-100'
                    : 'border-surface-border text-slate-400 hover:bg-white/5',
                )}
              >
                <span className="text-sm font-medium">{p}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Model */}
        <section>
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Model</h3>
          <select
            value={settings.model}
            onChange={(e) => update('model', e.target.value)}
            className="w-full input-base px-3 py-2.5 text-sm"
          >
            {models.map((m) => (
              <option key={m} value={m} className="bg-bg-card">
                {m}
              </option>
            ))}
          </select>
        </section>

        {/* Temperature */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-3">
            <Sliders size={16} className="text-brand-secondary" />
            Temperature
            <span className="ml-auto text-xs text-slate-500 font-mono">
              {settings.temperature.toFixed(1)}
            </span>
          </h3>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={settings.temperature}
            onChange={(e) => update('temperature', parseFloat(e.target.value))}
            className="w-full accent-brand-primary"
            aria-label="Temperature"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Precise</span>
            <span>Creative</span>
          </div>
        </section>

        {/* Language */}
        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-3">
            <Globe size={16} className="text-brand-secondary" />
            Language
          </h3>
          <select
            value={settings.language}
            onChange={(e) => update('language', e.target.value)}
            className="w-full input-base px-3 py-2.5 text-sm"
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l} className="bg-bg-card">
                {l}
              </option>
            ))}
          </select>
        </section>

        <div className="pt-2 border-t border-surface-border">
          <p className="text-xs text-slate-500">
            API keys are managed securely on the backend. They are never stored
            or exposed in the frontend.
          </p>
        </div>
      </div>
    </Modal>
  );
}
