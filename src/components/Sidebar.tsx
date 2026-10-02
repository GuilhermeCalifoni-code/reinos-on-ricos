import React from 'react';
import { Campanha } from '../types/campaign';

export type MainViewType =
  | 'dashboard'
  | 'campanhas'
  | 'personagens'
  | 'criar_campanha'
  | 'detalhe_campanha'
  | 'modo_mesa'
  | 'configuracoes';

interface SidebarProps {
  viewAtiva: MainViewType;
  setViewAtiva: (v: MainViewType) => void;
  campanhas: Campanha[];
  campanhaAtivaId: string | null;
  onSelecionarCampanha: (id: string) => void;
  onNovaCampanha: () => void;
  onSair: () => void;
}

const isSectionActive = (view: MainViewType, section: MainViewType) => view === section || (section === 'campanhas' && view === 'detalhe_campanha');

export const Sidebar: React.FC<SidebarProps> = ({
  viewAtiva, setViewAtiva, campanhas, campanhaAtivaId, onSelecionarCampanha, onNovaCampanha, onSair
}) => (
  <aside className="sticky top-0 hidden h-screen w-[244px] shrink-0 flex-col border-r border-[var(--ro-line)] bg-[var(--ro-panel-bg)] backdrop-blur-md lg:flex">
    <button onClick={() => setViewAtiva('dashboard')} className="group border-b border-[var(--ro-line)] px-6 py-6 text-left">
      <span className="flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center border border-[var(--ro-line-strong)] font-serif text-sm text-[var(--ro-gold)]">RO</span>
        <span>
          <span className="block font-serif text-lg tracking-[.08em] text-[var(--ro-paper)] group-hover:text-[var(--ro-gold)]">REINOS</span>
          <span className="block font-mono text-[8px] tracking-[.22em] text-[var(--ro-paper-muted)]">ONÍRICOS RPG</span>
        </span>
      </span>
    </button>

    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-6">
      <p className="ro-eyebrow px-3 pb-2">Navegação</p>
      <nav className="space-y-1">
        <button onClick={() => setViewAtiva('dashboard')} className={`ro-nav-item ${isSectionActive(viewAtiva, 'dashboard') ? 'ro-nav-item--active' : ''}`}><span>◈</span> Visão geral</button>
        <button onClick={() => setViewAtiva('campanhas')} className={`ro-nav-item ${isSectionActive(viewAtiva, 'campanhas') ? 'ro-nav-item--active' : ''}`}><span>◇</span> Campanhas</button>
        <button onClick={() => setViewAtiva('personagens')} className={`ro-nav-item ${isSectionActive(viewAtiva, 'personagens') ? 'ro-nav-item--active' : ''}`}><span>♙</span> Personagens</button>
      </nav>

      <div className="mt-8 flex items-center justify-between px-3 pb-2">
        <p className="ro-eyebrow">Em preparação</p>
        <button onClick={onNovaCampanha} className="ro-icon-button h-6 min-h-6 w-6 min-w-6" title="Criar campanha" aria-label="Criar campanha">+</button>
      </div>
      <div className="space-y-1">
        {campanhas.length === 0 ? (
          <button onClick={onNovaCampanha} className="w-full border border-dashed border-[var(--ro-line)] px-3 py-3 text-left text-[11px] text-[var(--ro-paper-muted)] hover:border-[var(--ro-line-strong)] hover:text-[var(--ro-gold)]">Criar o primeiro reino</button>
        ) : campanhas.map((campanha) => {
          const active = campanhaAtivaId === campanha.id && (viewAtiva === 'detalhe_campanha' || viewAtiva === 'modo_mesa');
          return <button key={campanha.id} onClick={() => onSelecionarCampanha(campanha.id)} className={`ro-campaign-nav ${active ? 'ro-campaign-nav--active' : ''}`}>
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ro-gold)] opacity-60" />
            <span className="min-w-0"><strong>{campanha.nome}</strong><small>Sessão {String(campanha.sessaoAtual).padStart(2, '0')}</small></span>
          </button>;
        })}
      </div>
    </div>

    <div className="border-t border-[var(--ro-line)] p-3">
      <button onClick={() => setViewAtiva('configuracoes')} className={`ro-nav-item ${isSectionActive(viewAtiva, 'configuracoes') ? 'ro-nav-item--active' : ''}`}><span>⚙</span> Configurações</button>
      <button onClick={onSair} className="ro-nav-item mt-1 text-[var(--ro-paper-muted)] hover:text-[var(--ro-danger)]"><span>↪</span> Sair da mesa</button>
    </div>
  </aside>
);

export const MobileNavigation: React.FC<Pick<SidebarProps, 'viewAtiva' | 'setViewAtiva' | 'onNovaCampanha'>> = ({
  viewAtiva, setViewAtiva, onNovaCampanha
}) => (
  <nav aria-label="Navegação principal" className="flex h-12 items-stretch border-b border-[var(--ro-line)] bg-[var(--ro-panel-bg)] lg:hidden">
    <button onClick={() => setViewAtiva('dashboard')} className={`ro-mobile-nav ${isSectionActive(viewAtiva, 'dashboard') ? 'ro-mobile-nav--active' : ''}`}>Início</button>
    <button onClick={() => setViewAtiva('campanhas')} className={`ro-mobile-nav ${isSectionActive(viewAtiva, 'campanhas') ? 'ro-mobile-nav--active' : ''}`}>Campanhas</button>
    <button onClick={() => setViewAtiva('personagens')} className={`ro-mobile-nav ${isSectionActive(viewAtiva, 'personagens') ? 'ro-mobile-nav--active' : ''}`}>Fichas</button>
    <button onClick={onNovaCampanha} className="ro-mobile-nav ml-auto px-4 text-[var(--ro-gold)]" aria-label="Criar campanha">+</button>
  </nav>
);
