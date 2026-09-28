import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onClose, title, children, className, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-md';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full bg-bg-card border border-surface-border rounded-2xl shadow-2xl animate-scale-in',
          sizeClass,
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
            <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
            <button
              onClick={onClose}
              className="btn-ghost p-1.5 rounded-lg"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 btn-ghost p-1.5 rounded-lg z-10"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
