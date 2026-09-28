import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  label: string;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ label, children, side = 'top', className }: TooltipProps) {
  const [show, setShow] = useState(false);

  const posClass = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[side];

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 px-2.5 py-1 text-xs font-medium text-slate-200 bg-slate-900 border border-surface-border rounded-lg whitespace-nowrap pointer-events-none animate-fade-in shadow-lg',
            posClass,
            className,
          )}
        >
          {label}
        </div>
      )}
    </div>
  );
}
