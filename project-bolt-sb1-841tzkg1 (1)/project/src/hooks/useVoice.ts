import { useCallback, useEffect, useRef, useState } from 'react';

// Minimal type for the Web Speech API since TS DOM lib doesn't include it
interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: ArrayLike<{ 0: SpeechRecognitionResult; isFinal: boolean }>;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface UseVoiceReturn {
  supported: boolean;
  listening: boolean;
  transcript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useVoice(onTranscript?: (text: string) => void): UseVoiceReturn {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    const SR =
      (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor })
        .webkitSpeechRecognition;
    if (SR) {
      setSupported(true);
      const rec = new SR();
      rec.lang = 'en-US';
      rec.continuous = false;
      rec.interimResults = true;

      rec.onresult = (event: SpeechRecognitionEvent) => {
        let text = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setTranscript(text);
      };

      rec.onerror = (e: { error: string }) => {
        if (e.error === 'not-allowed') {
          setError('Microphone permission denied.');
        } else if (e.error === 'no-speech') {
          // silently ignore
        } else {
          setError(`Voice error: ${e.error}`);
        }
        setListening(false);
      };

      rec.onend = () => {
        setListening(false);
        setTranscript((prev) => {
          if (prev.trim()) {
            onTranscriptRef.current?.(prev.trim());
          }
          return '';
        });
      };

      recognitionRef.current = rec;
    }

    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const start = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Voice input is not supported in this browser.');
      return;
    }
    setError(null);
    setTranscript('');
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch {
      // already started
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return { supported, listening, transcript, error, start, stop, reset };
}
