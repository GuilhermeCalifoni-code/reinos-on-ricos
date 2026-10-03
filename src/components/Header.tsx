import React from 'react';
import { UserSession } from '../types/auth';
import { ThemeToggle } from '../design-system/ThemeToggle';

interface HeaderProps {
  campanhaNome?: string;
  rupturaNivel?: number;
  session: UserSession | null;
}

export const Header: React.FC<HeaderProps> = ({ campanhaNome, rupturaNivel = 0, session }) => (
  <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--ro-line)] bg-[var(--ro-header-bg)] px-5 backdrop-blur-md sm:px-7">
    <div className="min-w-0">
      <p className="ro-eyebrow">{campanhaNome ? 'Campanha ativa' : 'Arquivo pessoal'}</p>
      <p className="mt-1 truncate font-serif text-lg text-[var(--ro-paper)]">{campanhaNome || 'Reinos Oníricos'}</p>
    </div>
    <div className="flex items-center gap-1 sm:gap-3">
      {rupturaNivel > 0 && (
        <div className="hidden border border-[var(--ro-line)] bg-[var(--ro-rupture-soft)] px-3 py-1.5 sm:block" title={`Ruptura geral: ${rupturaNivel}/6`}>
          <span className="font-mono text-[9px] uppercase tracking-[.13em] text-[var(--ro-paper-muted)]">Ruptura </span>
          <span className="font-mono text-xs text-[var(--ro-gold)]">{rupturaNivel}/6</span>
        </div>
      )}
      <ThemeToggle compact />
      <div className="ml-1 flex items-center gap-2 border-l border-[var(--ro-line)] pl-3">
        <span className="grid h-8 w-8 place-items-center border border-[var(--ro-line-strong)] bg-[var(--ro-accent-soft)] font-mono text-[10px] text-[var(--ro-gold)]">
          {session?.nome ? session.nome.slice(0, 2).toUpperCase() : 'RO'}
        </span>
        <span className="hidden max-w-28 truncate text-xs text-[var(--ro-paper)] sm:block">{session?.nome || 'Narrador'}</span>
      </div>
    </div>
  </header>
);
