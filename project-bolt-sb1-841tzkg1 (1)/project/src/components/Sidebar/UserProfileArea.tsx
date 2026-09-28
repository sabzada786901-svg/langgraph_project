import { useState } from 'react';
import { ChevronRight, Info, Moon, Settings, Sun, User } from 'lucide-react';
import type { Settings as SettingsType, UserProfile } from '@/types';
import { cn } from '@/lib/utils';

interface UserProfileAreaProps {
  profile: UserProfile;
  settings: SettingsType;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenAbout: () => void;
  onToggleTheme: () => void;
}

export function UserProfileArea({
  profile,
  settings,
  onOpenSettings,
  onOpenProfile,
  onOpenAbout,
  onToggleTheme,
}: UserProfileAreaProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative border-t border-surface-border px-2 py-2">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary text-white text-sm font-semibold shrink-0">
          {profile.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-slate-200 truncate">{profile.name}</p>
          <p className="text-xs text-slate-500 truncate">{profile.email}</p>
        </div>
        <ChevronRight
          size={16}
          className={cn('text-slate-500 transition-transform', menuOpen && 'rotate-90')}
        />
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
          <div className="absolute bottom-full left-2 right-2 mb-1 bg-bg-card border border-surface-border rounded-lg shadow-xl py-1 animate-scale-in z-40">
            <button
              onClick={() => {
                setMenuOpen(false);
                onOpenProfile();
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors"
            >
              <User size={15} /> Profile
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onOpenSettings();
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors"
            >
              <Settings size={15} /> Settings
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onToggleTheme();
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors"
            >
              {settings.theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              {settings.theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onOpenAbout();
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors"
            >
              <Info size={15} /> About friendly_AI
            </button>
          </div>
        </>
      )}
    </div>
  );
}
