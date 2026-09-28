import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} size="sm">
      <div className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div
            className={
              danger
                ? 'flex items-center justify-center w-10 h-10 rounded-full bg-error/15 text-error shrink-0'
                : 'flex items-center justify-center w-10 h-10 rounded-full bg-warning/15 text-warning shrink-0'
            }
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
            <p className="text-sm text-slate-400 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={
              danger
                ? 'px-4 py-2 rounded-lg text-sm font-medium bg-error hover:bg-error/90 text-white transition-colors'
                : 'px-4 py-2 rounded-lg text-sm font-medium bg-brand-primary hover:bg-brand-primaryHover text-white transition-colors'
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
