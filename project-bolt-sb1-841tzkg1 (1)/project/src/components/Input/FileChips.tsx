import { FileText, Image as ImageIcon, X } from 'lucide-react';
import type { Attachment } from '@/types';
import { cn } from '@/lib/utils';

interface FileChipsProps {
  files: Attachment[];
  onRemove: (id: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

}

export function FileChips({ files, onRemove }: FileChipsProps) {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-1">
      {files.map((f) => {
        const isImage = f.type.startsWith('image/');
        return (
          <div
            key={f.id}
            className={cn(
              'group flex items-center gap-2 pl-2 pr-1 py-1.5 bg-bg-card border border-surface-border rounded-lg text-sm',
              f.error && 'border-error/40',
            )}
          >
            {isImage && f.url ? (
              <img
                src={f.url}
                alt={f.name}
                className="w-7 h-7 rounded object-cover"
              />
            ) : (
              <div className="flex items-center justify-center w-7 h-7 rounded bg-bg-input text-slate-400">
                {isImage ? <ImageIcon size={14} /> : <FileText size={14} />}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-slate-200 truncate max-w-[140px] text-xs">
                {f.name}
              </span>
              <span className="text-slate-500 text-[10px]">
                {f.error ?? formatSize(f.size)}
              </span>
            </div>
            {f.uploadProgress !== undefined && f.uploadProgress < 100 ? (
              <div className="w-10 h-1 bg-bg-input rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-secondary transition-all"
                  style={{ width: `${f.uploadProgress}%` }}
                />
              </div>
            ) : (
              <button
                onClick={() => onRemove(f.id)}
                className="p-0.5 rounded text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors"
                aria-label={`Remove ${f.name}`}
              >
                <X size={14} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
