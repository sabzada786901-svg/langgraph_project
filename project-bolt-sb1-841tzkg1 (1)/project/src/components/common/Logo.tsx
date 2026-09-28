import { cn } from '@/lib/utils';

interface LogoProps {
  size?: number;
  className?: string;
  showGlow?: boolean;
}

export function Logo({ size = 36, className, showGlow = false }: LogoProps) {
  return (
    <div
      className={cn('relative shrink-0', className)}
      style={{ width: size, height: size }}
    >
      {showGlow && (
        <div
          className="absolute inset-0 rounded-2xl blur-md opacity-50"
          style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)' }}
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        <defs>
          <linearGradient id="fai-grad-inline" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366F1" />
            <stop offset="1" stopColor="#06B6D4" />
          </linearGradient>
          <linearGradient id="fai-grad-soft-inline" x1="20" y1="20" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#818CF8" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#fai-grad-inline)" />
        <rect x="4" y="4" width="56" height="56" rx="16" fill="black" fillOpacity="0.05" />
        <circle cx="25" cy="28" r="3.5" fill="white" fillOpacity="0.95" />
        <circle cx="39" cy="28" r="3.5" fill="white" fillOpacity="0.95" />
        <path
          d="M23 38 Q32 44 41 38"
          stroke="white"
          strokeOpacity="0.95"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M48 12 L50 16 L54 18 L50 20 L48 24 L46 20 L42 18 L46 16 Z"
          fill="url(#fai-grad-soft-inline)"
          opacity="0.9"
        />
      </svg>
    </div>
  );
}
