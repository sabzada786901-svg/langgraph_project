import { Mic, MicOff, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/common/Tooltip';

interface VoiceButtonProps {
  supported: boolean;
  listening: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function VoiceButton({ supported, listening, onStart, onStop }: VoiceButtonProps) {
  if (!supported) {
    return (
      <Tooltip label="Voice input not supported" side="top">
        <button
          disabled
          className="p-2.5 rounded-xl text-slate-600 cursor-not-allowed"
          aria-label="Voice input not supported"
        >
          <MicOff size={18} />
        </button>
      </Tooltip>
    );
  }

  return (
    <Tooltip label={listening ? 'Stop recording' : 'Voice input'} side="top">
      <button
        onClick={listening ? onStop : onStart}
        className={cn(
          'relative p-2.5 rounded-xl transition-all',
          listening
            ? 'bg-error/20 text-error'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5',
        )}
        aria-label={listening ? 'Stop recording' : 'Start voice input'}
      >
        {listening ? (
          <>
            <span className="absolute inset-0 rounded-xl bg-error/30 animate-ping" />
            <Square size={18} className="relative z-10" />
          </>
        ) : (
          <Mic size={18} />
        )}
      </button>
    </Tooltip>
  );
}
