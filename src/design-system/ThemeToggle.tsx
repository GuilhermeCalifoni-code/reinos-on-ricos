import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './theme';

interface ThemeToggleProps {
  compact?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ compact = false }) => {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={compact ? 'ro-theme-toggle ro-theme-toggle--compact' : 'ro-theme-toggle'}
      aria-label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={dark ? 'Tema claro — Arquivo da Vigília' : 'Tema escuro — Vigília Noturna'}
    >
      {dark ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
      {!compact && <span>{dark ? 'Claro' : 'Escuro'}</span>}
    </button>
  );
};
