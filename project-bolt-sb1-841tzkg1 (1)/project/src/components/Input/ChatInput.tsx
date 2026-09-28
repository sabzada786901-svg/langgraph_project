import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from 'react';
import { Paperclip, Send, Square } from 'lucide-react';
import type { Attachment } from '@/types';
import * as api from '@/services/api';
import { FileChips } from './FileChips';
import { VoiceButton } from './VoiceButton';
import { useVoice } from '@/hooks/useVoice';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/common/Tooltip';

const ACCEPTED_TYPES = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/webp',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

interface ChatInputProps {
  onSend: (text: string, files?: Attachment[]) => void;
  disabled?: boolean;
  isStreaming?: boolean;
  onStop?: () => void;
  draft: string;
  onDraftChange: (text: string) => void;
}

export function ChatInput({
  onSend,
  disabled,
  isStreaming,
  onStop,
  draft,
  onDraftChange,
}: ChatInputProps) {
  const [files, setFiles] = useState<Attachment[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const voice = useVoice((text) => {
    onDraftChange(draft ? `${draft} ${text}` : text);
  });

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [draft]);

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text && files.length === 0) return;
    if (disabled) return;
    onSend(text, files.length > 0 ? files : undefined);
    onDraftChange('');
    setFiles([]);
  }, [draft, files, disabled, onSend, onDraftChange]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const processFiles = useCallback(async (fileList: FileList) => {
    setFileError(null);
    const newFiles: Attachment[] = [];

    for (const file of Array.from(fileList)) {
      if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_TYPES.some((t) => file.name.match(/\.(pdf|txt|docx|csv|png|jpe?g|webp)$/i))) {
        setFileError(`${file.name}: invalid file type`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`${file.name}: file too large (max 10MB)`);
        continue;
      }

      const attachment: Attachment = {
        id: api.generateAttachmentId(),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadProgress: 0,
      };

      if (file.type.startsWith('image/')) {
        attachment.url = URL.createObjectURL(file);
      }

      newFiles.push(attachment);
    }

    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);

      // Simulate upload progress
      newFiles.forEach((att) => {
        const interval = setInterval(() => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === att.id && f.uploadProgress !== undefined && f.uploadProgress < 100
                ? { ...f, uploadProgress: Math.min(f.uploadProgress + 25, 100) }
                : f,
            ),
          );
        }, 200);
        setTimeout(() => clearInterval(interval), 1200);
      });
    }
  }, []);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const canSend = (draft.trim() || files.length > 0) && !disabled;

  return (
    <div className="shrink-0 border-t border-surface-border bg-bg-sidebar/50 backdrop-blur-xl">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3">
        {fileError && (
          <div className="mb-2 px-3 py-1.5 bg-error/10 border border-error/30 rounded-lg text-xs text-error animate-slide-up">
            {fileError}
          </div>
        )}
        {voice.listening && (
          <div className="mb-2 flex items-center gap-2 px-3 py-1.5 bg-error/10 border border-error/30 rounded-lg text-xs text-error animate-slide-up">
            <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
            Listening... {voice.transcript && `"${voice.transcript}"`}
          </div>
        )}
        {voice.error && (
          <div className="mb-2 px-3 py-1.5 bg-error/10 border border-error/30 rounded-lg text-xs text-error animate-slide-up">
            {voice.error}
          </div>
        )}

        <FileChips files={files} onRemove={removeFile} />

        <div
          className={cn(
            'flex items-end gap-1.5 bg-bg-card border rounded-2xl p-2 transition-all',
            dragOver
              ? 'border-brand-primary ring-2 ring-brand-primary/20'
              : 'border-surface-border',
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {/* Attach button */}
          <Tooltip label="Attach files" side="top">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              aria-label="Attach files"
            >
              <Paperclip size={18} />
            </button>
          </Tooltip>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.docx,.csv,.png,.jpg,.jpeg,.webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 resize-none outline-none text-[15px] leading-relaxed py-2.5 max-h-40"
            aria-label="Message input"
          />

          {/* Voice */}
          <VoiceButton
            supported={voice.supported}
            listening={voice.listening}
            onStart={voice.start}
            onStop={voice.stop}
          />

          {/* Send / Stop */}
          {isStreaming ? (
            <button
              onClick={onStop}
              className="p-2.5 rounded-xl bg-error/20 text-error hover:bg-error/30 transition-colors"
              aria-label="Stop generating"
            >
              <Square size={18} />
            </button>
          ) : (
            <Tooltip label="Send message" side="top">
              <button
                onClick={handleSend}
                disabled={!canSend}
                className={cn(
                  'p-2.5 rounded-xl transition-all',
                  canSend
                    ? 'bg-gradient-to-br from-brand-primary to-brand-secondary text-white hover:scale-105 active:scale-95'
                    : 'bg-white/5 text-slate-600 cursor-not-allowed',
                )}
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </Tooltip>
          )}
        </div>

        <p className="text-[11px] text-slate-600 text-center mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
