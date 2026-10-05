import React from 'react';
import { BookOpen, Home, LogOut, Map, Radio, Settings, Users } from 'lucide-react';
import { Campanha } from '../types/campaign';

export type MainViewType =
  | 'dashboard'
  | 'campanhas'
  | 'personagens'
  | 'compendio'
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
  onAbrirMesa?: () => void;
  onSair: () => void;
}

const isSectionActive = (view: MainViewType, section: MainViewType) =>
  view === section || (section === 'campanhas' && view === 'detalhe_campanha');

export const Sidebar: React.FC<SidebarProps> = ({
  viewAtiva,
  setViewAtiva,
  campanhas,
  onNovaCampanha,
  onAbrirMesa,
  onSair
}) => (
  <aside className="ro-sidebar">
    <button onClick={() => setViewAtiva('dashboard')} className="ro-sidebar__brand" aria-label="Ir para o início">
      <img src="/ro-login-logo.webp" alt="Reinos Oníricos RPG" />
    </button>

    <nav className="ro-sidebar__nav" aria-label="Navegação principal">
      <button onClick={() => setViewAtiva('dashboard')} className={isSectionActive(viewAtiva, 'dashboard') ? 'is-active' : ''}>
        <Home /> <span>Início</span>
      </button>
      <button onClick={() => setViewAtiva('campanhas')} className={isSectionActive(viewAtiva, 'campanhas') ? 'is-active' : ''}>
        <Map /> <span>Minhas Campanhas</span>
      </button>
      <button onClick={() => setViewAtiva('personagens')} className={isSectionActive(viewAtiva, 'personagens') ? 'is-active' : ''}>
        <Users /> <span>Personagens</span>
      </button>
      <button onClick={() => setViewAtiva('compendio')} className={isSectionActive(viewAtiva, 'compendio') ? 'is-active' : ''}>
        <BookOpen /> <span>Compêndio</span>
      </button>
      <button
        onClick={() => onAbrirMesa?.()}
        disabled={!campanhas.length}
        className={viewAtiva === 'modo_mesa' ? 'is-active' : ''}
        title={campanhas.length ? 'Abrir Mesa Ao Vivo' : 'Crie uma campanha para abrir a mesa'}
      >
        <Radio /> <span>Mesa Ao Vivo</span>
      </button>
    </nav>

    <div className="ro-sidebar__art" aria-hidden="true">
      <img src="/ro-login-mist-city.webp" alt="" />
    </div>

    <div className="ro-sidebar__footer">
      <button onClick={() => setViewAtiva('configuracoes')} className={isSectionActive(viewAtiva, 'configuracoes') ? 'is-active' : ''}>
        <Settings /> <span>Configurações</span>
      </button>
      <button onClick={onSair}>
        <LogOut /> <span>Sair</span>
      </button>
      <button onClick={onNovaCampanha} className="ro-sidebar__new">
        <span>Nova campanha</span><strong>+</strong>
      </button>
    </div>
  </aside>
);

export const MobileNavigation: React.FC<Pick<SidebarProps, 'viewAtiva' | 'setViewAtiva' | 'onNovaCampanha'>> = ({
  viewAtiva,
  setViewAtiva,
  onNovaCampanha
}) => (
  <nav aria-label="Navegação principal" className="ro-mobile-shell">
    <button onClick={() => setViewAtiva('dashboard')} className={isSectionActive(viewAtiva, 'dashboard') ? 'is-active' : ''}>Início</button>
    <button onClick={() => setViewAtiva('campanhas')} className={isSectionActive(viewAtiva, 'campanhas') ? 'is-active' : ''}>Campanhas</button>
    <button onClick={() => setViewAtiva('personagens')} className={isSectionActive(viewAtiva, 'personagens') ? 'is-active' : ''}>Personagens</button>
    <button onClick={onNovaCampanha} aria-label="Criar campanha">+</button>
  </nav>
);
